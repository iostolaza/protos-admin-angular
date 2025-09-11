import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TicketService, FlatTicket, FlatTeam } from '../../core/services/ticket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../core/services/icon-preloader.service';

@Component({
  selector: 'app-ticket-management',
  templateUrl: './ticket-management.component.html',
  // styleUrl: './ticket-management.component.scss',
  standalone: true,
  imports: [CommonModule, AngularSvgIconModule],
})
export class TicketManagementComponent implements OnInit, OnDestroy {
  tickets = signal<FlatTicket[]>([]);
  teams = signal<FlatTeam[]>([]);
  tab = signal('tickets'); // Default tab
  updatedAgo = signal('a moment ago');
  openTickets = signal(0);
  recentTickets = signal<FlatTicket[]>([]);
  private destroy$ = new Subject<void>();

  constructor(private ticketService: TicketService, private router: Router) {}

  getIconPath = getIconPath;

  async ngOnInit(): Promise<void> {
    await this.loadTickets();
    await this.loadTeams();
    this.setupRealTime();
    this.updateSummary();
  }

  private async loadTickets(): Promise<void> {
    const { tickets } = await this.ticketService.getTickets();
    this.tickets.set(tickets);
    this.updateSummary();
  }

  private async loadTeams(): Promise<void> {
    const { teams } = await this.ticketService.getTeams();
    this.teams.set(teams);
  }

  switchTab(newTab: string) {
    this.tab.set(newTab);
    this.router.navigate([`/main-layout/ticket-management/${newTab}`]);
  }

  private updateSummary(): void {
    this.openTickets.set(this.tickets().filter(t => t.status === 'OPEN').length);
    this.recentTickets.set(
      this.tickets()
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
    );
    this.updatedAgo.set(this.computeUpdatedAgo());
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