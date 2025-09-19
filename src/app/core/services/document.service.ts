// src/app/core/services/document.service.ts (Full fix: Generate docId with crypto.randomUUID in create (custom IDs not auto-gen); add | null to returns; default permissions)

import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private client = generateClient<Schema>();

  // Create/Upload Document (CRUD: Create) - Generate docId (custom ID not auto-gen); defaults for requireds
  uploadDocument(docData: Partial<Schema['Document']['type']>, file: File): Observable<Schema['Document']['type'] | null> {
    return from(uploadData({
      path: `protected/${docData.userCognitoId || 'shared'}/${file.name}`,
      data: file,
      options: { contentType: file.type }
    }).result).pipe(
      map(uploadResult => ({
        docId: crypto.randomUUID(),  // Generate UUID client-side for custom identifier
        ...docData,
        fileKey: uploadResult.path,
        fileName: file.name,
        fileType: file.type.split('/')[1].toUpperCase(),
        uploadDate: new Date().toISOString(),
        size: file.size,
        category: docData.category || 'Statement',
        permissions: docData.permissions || []  // Required array default
      })),
      switchMap(meta => from(this.client.models.Document.create(meta))),
      map(res => res.data),  // Extract data, can be null on error
      catchError(err => throwError(() => new Error(`Upload failed: ${err.message}`)))
    );
  }

  // List Documents (CRUD: Read - with filters, e.g., by category using GSI)
  listDocuments(filter?: { category?: string; userCognitoId?: string; limit?: number }): Observable<Schema['Document']['type'][]> {
    return from(this.client.models.Document.list({
      filter: filter?.category ? { category: { eq: filter.category } } : undefined,
      limit: filter?.limit || 100
    })).pipe(map(res => res.data || []));  // Default empty array if null
  }

  // Get Single Document (CRUD: Read) - Use docId; allow null
  getDocument(docId: string): Observable<Schema['Document']['type'] | null> {
    return from(this.client.models.Document.get({ docId })).pipe(map(res => res.data));
  }

  // Get Presigned URL for View/Download
  getDocumentUrl(fileKey: string): Observable<string> {
    return from(getUrl({ path: fileKey, options: { expiresIn: 3600 } })).pipe(map(res => res.url.toString()));
  }

  // Update Document (CRUD: Update - e.g., status or metadata) - Use docId; allow null
  updateDocument(docId: string, updates: Partial<Schema['Document']['type']>): Observable<Schema['Document']['type'] | null> {
    return from(this.client.models.Document.update({ docId, ...updates })).pipe(map(res => res.data));
  }

  // Delete Document (CRUD: Delete - also remove from S3) - Use docId
  deleteDocument(docId: string, fileKey: string): Observable<void> {
    return from(this.client.models.Document.delete({ docId })).pipe(
      switchMap(() => from(remove({ path: fileKey }))),
      map(() => undefined),
      catchError(err => throwError(() => new Error(`Delete failed: ${err.message}`)))
    );
  }

  // Subscription for Real-Time (e.g., new uploads)
  subscribeNewDocuments(): Observable<Schema['Document']['type'][]> {
    return this.client.models.Document.observeQuery().pipe(map(snapshot => snapshot.items));
  }
}