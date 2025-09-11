import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { Observable } from 'rxjs';

type TicketType = Schema['Ticket']['type'];
type TeamType = Schema['Team']['type'];
type TeamMemberType = Schema['TeamMember']['type'];
type UserType = Schema['User']['type'];

export interface FlatTicket extends Omit<TicketType, 'requester' | 'assignee' | 'team'> {
  requesterName?: string;
  assigneeName?: string;
  teamName?: string;
}

export interface FlatTeam extends Omit<TeamType, 'teamLead' | 'members'> {
  teamLeadName?: string;
  memberCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class TicketService {
  private client = generateClient<Schema>();

  async getTickets(nextToken: string | null = null): Promise<{ tickets: FlatTicket[]; nextToken: string | null }> {
    try {
      const accumulated: FlatTicket[] = [];
      let token = nextToken;
      do {
        const { data, nextToken: newToken, errors } = await this.client.models.Ticket.list({ nextToken: token ?? undefined });
        if (errors) throw new Error(errors.map(e => e.message).join(', '));
        const extended = await Promise.all(
          data.map(async (t: TicketType) => {
            const requesterRes = await t.requester();
            const requester = requesterRes.data;
            const assigneeRes = t.assigneeId ? await t.assignee() : { data: null };
            const assignee = assigneeRes.data;
            const teamRes = await t.team();
            const team = teamRes.data;
            return {
              ...t,
              requesterName: `${requester?.firstName ?? ''} ${requester?.lastName ?? ''}`,
              assigneeName: assignee ? `${assignee.firstName ?? ''} ${assignee.lastName ?? ''}` : '',
              teamName: team?.name ?? '',
            } as FlatTicket;
          })
        );
        accumulated.push(...extended);
        token = newToken ?? null;
      } while (token);
      return { tickets: accumulated, nextToken: null };
    } catch (error) {
      console.error('Get tickets error:', error);
      return { tickets: [], nextToken: null };
    }
  }

  async createTicket(ticket: Partial<TicketType>): Promise<TicketType | null> {
    try {
      if (!ticket.title || !ticket.description || !ticket.status || !ticket.estimated || !ticket.requesterId || !ticket.teamId) {
        throw new Error('Missing required ticket fields');
      }
      const { data, errors } = await this.client.models.Ticket.create(ticket as TicketType);
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      return data;
    } catch (error) {
      console.error('Create ticket error:', error);
      return null;
    }
  }

  async updateTicket(ticket: Partial<TicketType>): Promise<TicketType | null> {
    try {
      if (!ticket.id) throw new Error('ID required for update');
      const { data, errors } = await this.client.models.Ticket.update(ticket as TicketType);
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      return data;
    } catch (error) {
      console.error('Update ticket error:', error);
      return null;
    }
  }

  async deleteTicket(id: string): Promise<void> {
    try {
      const { errors } = await this.client.models.Ticket.delete({ id });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
    } catch (error) {
      console.error('Delete ticket error:', error);
    }
  }

  async getTeams(nextToken: string | null = null): Promise<{ teams: FlatTeam[]; nextToken: string | null }> {
    try {
      const accumulated: FlatTeam[] = [];
      let token = nextToken;
      do {
        const { data, nextToken: newToken, errors } = await this.client.models.Team.list({ nextToken: token ?? undefined });
        if (errors) throw new Error(errors.map(e => e.message).join(', '));
        const extended = await Promise.all(
          data.map(async (t: TeamType) => {
            const leadRes = await t.teamLead();
            const lead = leadRes.data;
            const membersRes = await t.members();
            const members = membersRes.data;
            return {
              ...t,
              teamLeadName: `${lead?.firstName ?? ''} ${lead?.lastName ?? ''}`,
              memberCount: members.length,
            } as FlatTeam;
          })
        );
        accumulated.push(...extended);
        token = newToken ?? null;
      } while (token);
      return { teams: accumulated, nextToken: null };
    } catch (error) {
      console.error('Get teams error:', error);
      return { teams: [], nextToken: null };
    }
  }

  async getUserTeams(userId: string): Promise<FlatTeam[]> {
    try {
      const { data: members, errors } = await this.client.models.TeamMember.listTeamMemberByUserId({ userId });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      const teams = await Promise.all(members.map(async (m: TeamMemberType) => {
        const teamRes = await m.team();
        const team = teamRes.data;
        if (!team) return null;
        const leadRes = await team.teamLead();
        const lead = leadRes.data;
        return {
          ...team,
          teamLeadName: `${lead?.firstName ?? ''} ${lead?.lastName ?? ''}`,
        } as FlatTeam;
      }));
      return teams.filter((t): t is FlatTeam => t !== null);
    } catch (error) {
      console.error('Get user teams error:', error);
      return [];
    }
  }

  async getTeamMembers(teamId: string): Promise<UserType[]> {
    try {
      const { data: members, errors } = await this.client.models.TeamMember.listTeamMemberByTeamId({ teamId });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      const users = await Promise.all(members.map(async (m: TeamMemberType) => {
        const userRes = await m.user();
        return userRes.data;
      }));
      return users.filter((u): u is UserType => u !== null);
    } catch (error) {
      console.error('Get team members error:', error);
      return [];
    }
  }

  async createTeam(team: Partial<TeamType>): Promise<TeamType | null> {
    try {
      if (!team.name || !team.teamLeadId) throw new Error('Missing required team fields');
      const { data, errors } = await this.client.models.Team.create(team as TeamType);
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      return data;
    } catch (error) {
      console.error('Create team error:', error);
      return null;
    }
  }

  async deleteTeam(id: string): Promise<void> {
    try {
      const { errors } = await this.client.models.Team.delete({ id });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
    } catch (error) {
      console.error('Delete team error:', error);
    }
  }

  observeTickets(): Observable<void> {
    return new Observable(observer => {
      const sub = this.client.models.Ticket.observeQuery().subscribe({
        next: () => observer.next(),
        error: (err) => observer.error(err),
      });
      return () => sub.unsubscribe();
    });
  }

  observeTeams(): Observable<void> {
    return new Observable(observer => {
      const sub = this.client.models.Team.observeQuery().subscribe({
        next: () => observer.next(),
        error: (err) => observer.error(err),
      });
      return () => sub.unsubscribe();
    });
  }
}