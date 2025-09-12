
// src/app/features/ticket-management/ticket-list/ticket-list.component.ts

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TicketService, FlatTicket } from '../../../core/services/ticket.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, DatePipe, AngularSvgIconModule],
  templateUrl: './ticket-list.component.html',
})
export class TicketListComponent implements OnInit, OnDestroy {
  tickets = signal<FlatTicket[]>([]);
  private destroy$ = new Subject<void>();
  getIconPath = getIconPath;

  constructor(private ticketService: TicketService) {}

  async ngOnInit(): Promise<void> {
    await this.loadTickets();
    this.setupRealTime();
  }

  private async loadTickets(): Promise<void> {
    try {
      const { tickets } = await this.ticketService.getTickets(); // Simplify, no loop
      this.tickets.set(tickets);
      console.log('Tickets loaded:', this.tickets());
    } catch (err) {
      console.error('Load tickets error:', err);
    }
  }

  private setupRealTime() {
    this.ticketService.observeTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Tickets real-time update triggered');
        this.loadTickets();
      });
  }

  async onDelete(id: string): Promise<void> {
    try {
      await this.ticketService.deleteTicket(id);
      this.tickets.update(curr => curr.filter(t => t.id !== id));
      console.log('Ticket deleted:', id);
    } catch (err) {
      console.error('Delete ticket error:', err);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}