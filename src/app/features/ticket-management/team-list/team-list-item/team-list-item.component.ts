import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../../../core/models/tickets.model';
 
@Component({
  selector: '[team-list-item]',
  standalone: true,
  imports: [CommonModule],
  template: `<td class="py-3 text-left">{{ team.name }}</td>
  <td class="py-3 text-right">
    <button (click)="delete()" class="text-destructive">Delete</button>
  </td>`,
})
export class TeamListItemComponent {
  @Input() team!: Team;
  @Output() deleted = new EventEmitter<string>();
 
  delete() {
    if (confirm('Delete team?')) this.deleted.emit(this.team.id);
  }
}