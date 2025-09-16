
// src/app/features/ticket-management/ticket-management.component.ts

import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../core/services/ticket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../core/services/icon-preloader.service';
import { TicketListComponent } from './ticket-list/ticket-list.component';  
import { TeamListComponent } from './team-list/team-list.component';  
import { GenerateTicketsComponent } from './generate-tickets/generate-tickets.component'; 
import { GenerateTeamComponent } from './generate-team/generate-team.component'; 
import { TeamEditComponent } from './edit-team/edit-team.component'; 
import { TicketDetailsComponent } from './ticket-details/ticket-details.component';
import { EditTicketComponent } from './edit-ticket/edit-ticket.component';
import { TeamDetailsComponent } from './team-details/team-details.component';  
import { FlatTicket, FlatTeam } from '../../core/models/tickets.model';
import { StatusPipe } from '../../core/pipes/status.pipe';  
import { StatusClassPipe } from '../../core/pipes/status-class.pipe';  

@Component({
  selector: 'app-ticket-management',
  templateUrl: './ticket-management.component.html',
  standalone: true,
  imports: [
    CommonModule, 
    AngularSvgIconModule, 
    TicketListComponent,  
    TeamListComponent,  
    GenerateTicketsComponent, 
    GenerateTeamComponent,
    TeamEditComponent,
    TicketDetailsComponent,
    EditTicketComponent,
    TeamDetailsComponent,  
    StatusPipe,  
    StatusClassPipe  
  ],
})
export class TicketManagementComponent implements OnInit, OnDestroy {
  tickets = signal<FlatTicket[]>([]);
  teams = signal<FlatTeam[]>([]);
  selectedTeam = signal<FlatTeam | null>(null);
  editingTeam = signal<FlatTeam | null>(null); 
  selectedTicket = signal<FlatTicket | null>(null);
  editingTicket = signal<FlatTicket | null>(null);
  tab = signal('tickets');
  updatedAgo = signal('a moment ago');
  private destroy$ = new Subject<void>();

  openTickets = computed(() => this.tickets().filter(t => t.status === 'OPEN').length);
  recentTickets = computed(() => 
    this.tickets()
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  );

  constructor(private ticketService: TicketService) {}  

  getIconPath = getIconPath;

  async ngOnInit(): Promise<void> {
    await this.loadTickets();
    await this.loadTeams();
    this.setupRealTime();
    this.updatedAgo.set(this.computeUpdatedAgo());
  }

  private async loadTickets(): Promise<void> {
    const { tickets } = await this.ticketService.getTickets();
    this.tickets.set(tickets);
  }

  private async loadTeams(): Promise<void> {
    const { teams } = await this.ticketService.getTeams();
    this.teams.set(teams);
  }

  switchTab(newTab: string) {
    this.tab.set(newTab); 
  }

  viewTeam(team: FlatTeam) { 
    this.selectedTeam.set(team);
    this.editingTeam.set(null);
  }

  editTeam(team: FlatTeam) {  
    this.editingTeam.set(team);
    this.selectedTeam.set(null);
  }

  onTeamUpdate(updatedTeam: FlatTeam) { 
    this.teams.update(teams => teams.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    this.editingTeam.set(null);
    this.selectedTeam.set(updatedTeam);  
  }

  viewDetails(ticket: FlatTicket) {
    this.selectedTicket.set(ticket);
    this.editingTicket.set(null);
  }

  startEditing(ticket: FlatTicket) {
    this.editingTicket.set(ticket);
    this.selectedTicket.set(null);
  }

  onTicketUpdate(updatedTicket: FlatTicket) {
    this.tickets.update(tickets => tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    this.editingTicket.set(null);
    this.selectedTicket.set(updatedTicket);
  }

  private computeUpdatedAgo(): string {
    const tickets = this.tickets();
    if (tickets.length === 0) return 'never';
    const maxDate = Math.max(...tickets.map(t => new Date(t.createdAt).getTime()));
    const diffMs = Date.now() - maxDate;
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'a moment ago';
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  private setupRealTime() {
    this.ticketService.observeTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTickets());
    this.ticketService.observeTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadTeams());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}