
// src/app/features/ticket-management/team-list/team-list.component.ts

import { Component, OnInit, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { TicketService } from '../../../core/services/ticket.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';
import { FlatTeam } from '../../../core/models/tickets.model';
import { TeamEditComponent } from '../edit-team/edit-team.component';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule, TeamEditComponent], 
  templateUrl: './team-list.component.html',
})
export class TeamListComponent implements OnInit {
  teams = signal<FlatTeam[]>([]);
  editingTeam = signal<FlatTeam | null>(null);  // Signal for edit state
  @Output() edit = new EventEmitter<FlatTeam>();  // Existing for edit
  @Output() view = new EventEmitter<FlatTeam>();  // NEW: For details view

  constructor(private ticketService: TicketService) {}

  getIconPath = getIconPath;

  async ngOnInit() {
    try {
      const { teams } = await this.ticketService.getTeams();
      this.teams.set(teams);
      console.log('Teams loaded:', teams);
    } catch (error) {
      console.error('Load teams error:', error);
    }
  }

  async deleteTeam(id: string) {
    try {
      await this.ticketService.deleteTeam(id);
      this.teams.update(ts => ts.filter(t => t.id !== id));
      console.log('Team deleted:', id);
    } catch (error) {
      console.error('Delete team error:', error);
    }
  }

  editTeam(team: FlatTeam) {
    this.edit.emit(team);  // Emit for parent to handle edit
    this.editingTeam.set(team);  // Local edit state if needed
  }

  viewTeam(team: FlatTeam) {
    this.view.emit(team);  // NEW: Emit for parent to show details
  }

  onTeamUpdate(updatedTeam: FlatTeam) {
    this.teams.update(ts => ts.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    this.editingTeam.set(null);  // Close form
  }

  trackById(index: number, item: FlatTeam): string {
    return item.id;
  }
}