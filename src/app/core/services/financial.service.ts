// src/app/core/services/financial.service.ts

import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';  // Verify path; run 'amplify codegen models'
import { from, Observable, throwError, of } from 'rxjs';  // Added of
import { catchError, map, switchMap } from 'rxjs/operators';  // Added switchMap

@Injectable({ providedIn: 'root' })
export class FinancialService {
  private client = generateClient<Schema>();

  // Create Transaction (CRUD: Create - Compute balance client-side; query last for account)
  createTransaction(transData: Partial<Schema['Transaction']['create']['input']>): Observable<Schema['Transaction']['create']['output']> {
    return this.getLastBalance(transData.accountId!).pipe(
      map(lastBalance => ({
        ...transData,
        balance: (lastBalance || 0) + (transData.chargeAmount || 0) - (transData.paymentAmount || 0),
        date: transData.date || new Date().toISOString()
      })),
      switchMap(computed => from(this.client.models.Transaction.create(computed))),
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
  listTransactions(filter: { accountId: string; startDate?: string; endDate?: string; limit?: number }): Observable<Schema['Transaction']['list']['output']['data'][number][]> {
    return from(this.client.models.Transaction.list({
      filter: { 
        accountId: { eq: filter.accountId },
        and: filter.startDate ? [{ date: { ge: filter.startDate } }] : [],
      },
      limit: filter.limit || 100
    })).pipe(map(res => res.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())));
  }

  // Get Single Transaction (CRUD: Read)
  getTransaction(transactionId: string): Observable<Schema['Transaction']['get']['output']> {
    return from(this.client.models.Transaction.get({ transactionId })).pipe(map(res => res.data));
  }

  // Update Transaction (CRUD: Update - e.g., status; recompute balance if amounts change)
  updateTransaction(transactionId: string, updates: Partial<Schema['Transaction']['update']['input']>): Observable<Schema['Transaction']['update']['output']> {
    // TODO: Recompute balance chain if needed (query/update subsequent)
    return from(this.client.models.Transaction.update({ transactionId, ...updates }));
  }

  // Delete Transaction (CRUD: Delete)
  deleteTransaction(transactionId: string): Observable<void> {
    return from(this.client.models.Transaction.delete({ transactionId })).pipe(map(() => undefined));
  }

  // Subscription for Real-Time (e.g., new payments)
  subscribeNewTransactions(accountId: string): Observable<Schema['Transaction']['observeQuery']['output']['items'][number][]> {
    return this.client.models.Transaction.observeQuery({ filter: { accountId: { eq: accountId } } }).pipe(map(snapshot => snapshot.items));
  }

  // Forecast Balance (Next 3 months - Stub; use recurringId to project)
  forecastBalance(accountId: string): Observable<number> {
    // Implement logic: Query recurring, sum projections
    return of(0);  // Placeholder
  }
}