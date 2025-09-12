
// src/app/features/ticket-management/team-list/team-list.component.ts

import { Component, OnInit, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { TicketService, FlatTeam } from '../../../core/services/ticket.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule], 
  templateUrl: './team-list.component.html',
})
export class TeamListComponent implements OnInit {
  teams = signal<FlatTeam[]>([]);
  @Output() edit = new EventEmitter<FlatTeam>();

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
    this.edit.emit(team);
  }

  trackById(index: number, item: FlatTeam): string {
    return item.id;
  }
}