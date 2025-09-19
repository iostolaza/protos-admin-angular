// src/app/features/documents/document-details/document-details.component.ts (Added Output import)

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';  // Added Output
import { CommonModule, DatePipe } from '@angular/common';
import { DocumentService } from '../../../core/services/document.service';
import { signal } from '@angular/core';

@Component({
  selector: 'app-document-details',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './document-details.component.html',
})
export class DocumentDetailsComponent implements OnInit {
  @Input() document!: any;
  @Output() close = new EventEmitter<void>();
  documentUrl = signal<string>('');

  constructor(private documentService: DocumentService) {}

  ngOnInit(): void {
    this.documentService.getDocumentUrl(this.document.fileKey).subscribe(url => this.documentUrl.set(url));
  }
}