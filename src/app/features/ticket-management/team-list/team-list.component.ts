
// src/app/features/ticket-management/team-list/team-list.component.ts

import { Component, OnInit, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { TicketService } from '../../../core/services/ticket.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';
import { FlatTeam } from '../../../core/models/tickets.model';
import { TeamService } from '../../../core/services/team.service';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule],
  templateUrl: './team-list.component.html',
})
export class TeamListComponent {
  @Output() view = new EventEmitter<any>();
  @Output() edit = new EventEmitter<any>();
  getIconPath = getIconPath;

  teams = signal<any[]>([]);
  editingTeam = signal<any | null>(null);
  

  constructor(private teamService: TeamService) {
    this.loadTeams();
  }

  async loadTeams() {
    this.teams.set(await this.teamService.getTeams());
  }

  viewTeam(team: any) {
    this.view.emit(team);
  }

  onTeamUpdate(updated: any) {
    this.loadTeams();
    this.editingTeam.set(null);
  }
}















// @Component({
//   selector: 'app-team-list',
//   standalone: true,
//   imports: [CommonModule, AngularSvgIconModule, TeamEditComponent], 
//   templateUrl: './team-list.component.html',
// })
// export class TeamListComponent implements OnInit {
//   teams = signal<FlatTeam[]>([]);
//   editingTeam = signal<FlatTeam | null>(null);  
//   @Output() edit = new EventEmitter<FlatTeam>();  
//   @Output() view = new EventEmitter<FlatTeam>();  

//   constructor(private ticketService: TicketService) {}

//   getIconPath = getIconPath;

//   async ngOnInit() {
//     try {
//       const { teams } = await this.ticketService.getTeams();
//       this.teams.set(teams);
//       console.log('Teams loaded:', teams);
//     } catch (error) {
//       console.error('Load teams error:', error);
//     }
//   }

//   async deleteTeam(id: string) {
//     try {
//       await this.ticketService.deleteTeam(id);
//       this.teams.update(ts => ts.filter(t => t.id !== id));
//       console.log('Team deleted:', id);
//     } catch (error) {
//       console.error('Delete team error:', error);
//     }
//   }

//   editTeam(team: FlatTeam) {
//     this.edit.emit(team);  
//     this.editingTeam.set(team); 
//   }

//   viewTeam(team: FlatTeam) {
//     this.view.emit(team); 
//   }

//   onTeamUpdate(updatedTeam: FlatTeam) {
//     this.teams.update(ts => ts.map(t => t.id === updatedTeam.id ? updatedTeam : t));
//     this.editingTeam.set(null); 
//   }

//   trackById(index: number, item: FlatTeam): string {
//     return item.id;
//   }
// }