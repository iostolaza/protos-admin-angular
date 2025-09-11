import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../../core/services/icon-preloader.service';
import { FlatTicket } from '../../../../core/services/ticket.service';

@Component({
  selector: '[ticket-list-item]',
  templateUrl: './ticket-list-item.component.html',
  standalone: true,
  imports: [CommonModule, DatePipe, AngularSvgIconModule],
})
export class TicketListItemComponent {
  getIconPath = getIconPath;

  @Input() ticket!: FlatTicket;
  @Output() deleted = new EventEmitter<string>();

  deleteTicket(): void {
    if (confirm('Delete this ticket?')) {
      this.deleted.emit(this.ticket.id);
    }
  }
}