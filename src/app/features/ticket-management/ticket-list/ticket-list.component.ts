import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService, FlatTicket } from '../../../core/services/ticket.service';
import { TicketListItemComponent } from './ticket-list-item/ticket-list-item.component';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, TicketListItemComponent],
  templateUrl: './ticket-list.component.html',
  // styleUrl: './ticket-list.component.scss',
})
export class TicketListComponent implements OnInit {
  public tickets = signal<FlatTicket[]>([]);

  constructor(private ticketService: TicketService) {}

  trackById(index: number, item: FlatTicket): string {
    return item.id;
  }

  async ngOnInit(): Promise<void> {
    await this.loadTickets();
  }

  private async loadTickets(): Promise<void> {
    try {
      let nextToken: string | null = null;
      const accumulated: FlatTicket[] = [];
      do {
        const { tickets, nextToken: newToken } = await this.ticketService.getTickets(nextToken);
        accumulated.push(...tickets);
        nextToken = newToken;
      } while (nextToken);
      this.tickets.set(accumulated);
      console.log('Tickets loaded:', this.tickets());
    } catch (err) {
      console.error('Load tickets error:', err);
    }
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
}