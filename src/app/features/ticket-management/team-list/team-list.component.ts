import { Component, OnInit, signal } from '@angular/core';
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
  constructor(private ticketService: TicketService) {}

  getIconPath = getIconPath;

  async ngOnInit() {
    const { teams } = await this.ticketService.getTeams();
    this.teams.set(teams);
  }

  async deleteTeam(id: string) {
    await this.ticketService.deleteTeam(id);
    this.teams.update(ts => ts.filter(t => t.id !== id));
  }

  trackById(index: number, item: FlatTeam): string {
    return item.id;
  }
}