import { Component, inject, OnInit, signal } from '@angular/core';
import { TicketService } from '../../../core/services/ticket.service';

@Component({
  selector: 'app-tickets-overview',
  standalone: true,
  imports: [],
  template: `
    <div class="rounded-lg bg-card flex items-center justify-center text-center w-full h-full">
      <div>
        <h3>Tickets Overview</h3>
        <p>Open: {{ open() }}</p>
      </div>
    </div>
  `,
})
export class TicketsOverviewComponent implements OnInit {
  private ticketService = inject(TicketService);
  open = signal(0);

  async ngOnInit() {
    this.open.set( 10);
    // this.open.set(await this.ticketService.getOpenTicketsCount() || 10);
  }
}
