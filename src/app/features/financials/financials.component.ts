// src/app/features/financials/financials.component.ts (Placeholder; uses service, real-time sub; expand for full UI later)

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinancialService } from '../../core/services/financial.service';
import { signal } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './financials.component.html',
})
export class FinancialsComponent implements OnInit, OnDestroy {
  transactions = signal<any[]>([]);
  private subs: Subscription[] = [];

  constructor(private financialService: FinancialService) {
    this.subs.push(
      this.financialService.subscribeNewTransactions('example-account').subscribe(trans => this.transactions.update(current => [...current, ...trans]))
    );
  }

  ngOnInit(): void {
    this.financialService.listTransactions({ accountId: 'example-account' }).subscribe(trans => this.transactions.set(trans));
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
  }
}