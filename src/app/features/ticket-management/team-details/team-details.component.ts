// src/app/features/ticket-management/team-details/team-details.component.ts

import { Component, Input, Output, OnInit, signal, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TicketService } from '../../../core/services/ticket.service';
import type { Schema } from '../../../../../amplify/data/resource';
import { FlatTeam } from '../../../core/models/tickets.model';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';

type UserType = Schema['User']['type'];

@Component({
  selector: 'app-team-details',
  standalone: true,
  imports: [CommonModule, DatePipe,  AngularSvgIconModule],
  templateUrl: './team-details.component.html',
})
export class TeamDetailsComponent implements OnInit {
  @Input() team!: FlatTeam;
  @Output() close = new EventEmitter<void>();
  @Output() edit = new EventEmitter<FlatTeam>();  // Emit to switch to edit

  members = signal<UserType[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  getIconPath = getIconPath;

  constructor(private ticketService: TicketService) {}

  async ngOnInit() {
    try {
      this.loading.set(true);
      const members = await this.ticketService.getTeamMembers(this.team.id);
      this.members.set(members || []);
    } catch (err) {
      this.error.set((err as Error).message || 'Failed to load members');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteTeam(id: string) {
    if (confirm('Delete team? This is permanent.')) {
      try {
        await this.ticketService.deleteTeam(id);
        this.close.emit();
      } catch (err) {
        this.error.set((err as Error).message || 'Failed to delete team');
      }
    }
  }
}