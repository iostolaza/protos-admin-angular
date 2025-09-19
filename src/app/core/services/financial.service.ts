// src/app/core/services/financial.service.ts 

import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { from, Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private client = generateClient<Schema>();

  // Create Transaction (CRUD: Create - Require accountId (intersection overrides optional); generate transactionId; ensure requireds)
  createTransaction(transData: { accountId: string } & Partial<Schema['Transaction']['type']>): Observable<Schema['Transaction']['type'] | null> {  // Intersection requires accountId
    return this.getLastBalance(transData.accountId).pipe(
      map(lastBalance => ({
        transactionId: crypto.randomUUID(),  // Generate UUID for custom identifier
        ...transData,  // Includes required accountId from param
        balance: (lastBalance || 0) + (transData.chargeAmount || 0) - (transData.paymentAmount || 0),
        date: transData.date || new Date().toISOString()
      })),
      switchMap(computed => from(this.client.models.Transaction.create(computed))),
      map(res => res.data),
      catchError(err => throwError(() => new Error(`Create failed: ${err.message}`)))
    );
  }

  // Helper: Get last balance (query latest transaction)
  private getLastBalance(accountId: string): Observable<number> {
    return from(this.client.models.Transaction.list({
      filter: { accountId: { eq: accountId } },
      limit: 1,
    })).pipe(map(res => res.data[0]?.balance || 0));
  }

  // List Transactions (CRUD: Read - Ledger by account/date)
  listTransactions(filter: { accountId: string; startDate?: string; endDate?: string; limit?: number }): Observable<Schema['Transaction']['type'][]> {
    return from(this.client.models.Transaction.list({
      filter: { 
        accountId: { eq: filter.accountId },
        and: filter.startDate ? [{ date: { ge: filter.startDate } }] : [],
      },
      limit: filter.limit || 100
    })).pipe(map(res => res.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || []));
  }

  // Get Single Transaction (CRUD: Read) - Use transactionId; allow null
  getTransaction(transactionId: string): Observable<Schema['Transaction']['type'] | null> {
    return from(this.client.models.Transaction.get({ transactionId })).pipe(map(res => res.data));
  }

  // Update Transaction (CRUD: Update - e.g., status; recompute balance if amounts change) - Use transactionId; allow null
  updateTransaction(transactionId: string, updates: Partial<Schema['Transaction']['type']>): Observable<Schema['Transaction']['type'] | null> {
    // TODO: Recompute balance chain if needed (query/update subsequent)
    return from(this.client.models.Transaction.update({ transactionId, ...updates })).pipe(map(res => res.data));
  }

  // Delete Transaction (CRUD: Delete) - Use transactionId
  deleteTransaction(transactionId: string): Observable<void> {
    return from(this.client.models.Transaction.delete({ transactionId })).pipe(map(() => undefined));
  }

  // Subscription for Real-Time (e.g., new payments)
  subscribeNewTransactions(accountId: string): Observable<Schema['Transaction']['type'][]> {
    return this.client.models.Transaction.observeQuery({ filter: { accountId: { eq: accountId } } }).pipe(map(snapshot => snapshot.items));
  }

  // Forecast Balance (Next 3 months - Stub; use recurringId to project)
  forecastBalance(accountId: string): Observable<number> {
    // Implement logic: Query recurring, sum projections
    return of(0);  // Placeholder
  }
}