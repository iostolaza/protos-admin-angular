import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
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

  // --- Ticket CRUD Operations ---
  async getTicketById(id: string): Promise<FlatTicket | null> {
    try {
      console.log('Fetching ticket with ID:', id);
      const { data, errors } = await this.client.models.Ticket.get({ id });
      if (errors) throw new Error(`Failed to fetch ticket: ${errors.map(e => e.message).join(', ')}`);
      if (!data) {
        console.log('No ticket found for ID:', id);
        return null;
      }
      const requesterRes = await data.requester();
      const requester = requesterRes.data;
      const assigneeRes = data.assigneeId ? await data.assignee() : { data: null };
      const assignee = assigneeRes.data;
      const teamRes = await data.team();
      const team = teamRes.data;
      const ticket: FlatTicket = {
        ...data,
        requesterName: `${requester?.firstName ?? ''} ${requester?.lastName ?? ''}`.trim(),
        assigneeName: assignee ? `${assignee.firstName ?? ''} ${assignee.lastName ?? ''}`.trim() : '',
        teamName: team?.name ?? '',
      };
      console.log('Ticket fetched:', ticket);
      return ticket;
    } catch (error) {
      console.error('Get ticket by ID error:', error);
      return null;
    }
  }

  async getTickets(nextToken: string | null = null): Promise<{ tickets: FlatTicket[]; nextToken: string | null }> {
    try {
      const accumulated: FlatTicket[] = [];
      let token = nextToken;
      do {
        console.log('Fetching tickets with nextToken:', token);
        const { data, nextToken: newToken, errors } = await this.client.models.Ticket.list({ nextToken: token ?? undefined });
        if (errors) throw new Error(`Failed to list tickets: ${errors.map(e => e.message).join(', ')}`);
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
              requesterName: `${requester?.firstName ?? ''} ${requester?.lastName ?? ''}`.trim(),
              assigneeName: assignee ? `${assignee.firstName ?? ''} ${assignee.lastName ?? ''}`.trim() : '',
              teamName: team?.name ?? '',
            } as FlatTicket;
          })
        );
        accumulated.push(...extended);
        token = newToken ?? null;
      } while (token);
      console.log('All tickets fetched:', accumulated);
      return { tickets: accumulated, nextToken: null };
    } catch (error) {
      console.error('Get tickets error:', error);
      return { tickets: [], nextToken: null };
    }
  }

  async createTicket(ticket: Partial<TicketType>): Promise<TicketType | null> {
    try {
      if (!ticket.title) throw new Error('Missing ticket title');
      if (!ticket.description) throw new Error('Missing ticket description');
      if (!ticket.status) throw new Error('Missing ticket status');
      if (!ticket.estimated) throw new Error('Missing ticket estimated date');
      if (!ticket.requesterId) throw new Error('Missing ticket requester ID');
      if (!ticket.teamId) throw new Error('Missing ticket team ID');
      const { data, errors } = await this.client.models.Ticket.create({
        ...ticket,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as TicketType);
      if (errors) throw new Error(`Failed to create ticket: ${errors.map(e => e.message).join(', ')}`);
      console.log('Ticket created:', data);
      return data;
    } catch (error) {
      console.error('Create ticket error:', error);
      return null;
    }
  }

  async updateTicket(ticket: Partial<TicketType>): Promise<TicketType | null> {
    try {
      if (!ticket.id) throw new Error('Ticket ID required for update');
      const { data, errors } = await this.client.models.Ticket.update({
        ...ticket,
        updatedAt: new Date().toISOString(),
      } as TicketType);
      if (errors) throw new Error(`Failed to update ticket: ${errors.map(e => e.message).join(', ')}`);
      console.log('Ticket updated:', data);
      return data;
    } catch (error) {
      console.error('Update ticket error:', error);
      return null;
    }
  }

  async deleteTicket(id: string): Promise<void> {
    try {
      const { errors } = await this.client.models.Ticket.delete({ id });
      if (errors) throw new Error(`Failed to delete ticket: ${errors.map(e => e.message).join(', ')}`);
      console.log('Ticket deleted:', id);
    } catch (error) {
      console.error('Delete ticket error:', error);
    }
  }

  // --- Team CRUD Operations ---
  async getTeams(nextToken: string | null = null): Promise<{ teams: FlatTeam[]; nextToken: string | null }> {
    try {
      const accumulated: FlatTeam[] = [];
      let token = nextToken;
      do {
        console.log('Fetching teams with nextToken:', token);
        const { data, nextToken: newToken, errors } = await this.client.models.Team.list({ nextToken: token ?? undefined });
        if (errors) throw new Error(`Failed to list teams: ${errors.map(e => e.message).join(', ')}`);
        const extended = await Promise.all(
          data.map(async (t: TeamType) => {
            const leadRes = await t.teamLead();
            const lead = leadRes.data;
            const membersRes = await t.members();
            const members = membersRes.data;
            return {
              ...t,
              teamLeadName: `${lead?.firstName ?? ''} ${lead?.lastName ?? ''}`.trim(),
              memberCount: members.length,
            } as FlatTeam;
          })
        );
        accumulated.push(...extended);
        token = newToken ?? null;
      } while (token);
      console.log('All teams fetched:', accumulated);
      return { teams: accumulated, nextToken: null };
    } catch (error) {
      console.error('Get teams error:', error);
      return { teams: [], nextToken: null };
    }
  }

  async getUserTeams(userId: string): Promise<FlatTeam[]> {
    try {
      console.log('Fetching user teams for userId:', userId);
      const { data: members, errors } = await this.client.models.TeamMember.listTeamMemberByUserId({ userId });
      if (errors) throw new Error(`Failed to list team members: ${errors.map(e => e.message).join(', ')}`);
      if (!members) {
        console.log('No team members found for userId:', userId);
        return [];
      }
      const teams = await Promise.all(members.map(async (m: TeamMemberType) => {
        const teamRes = await m.team();
        const team = teamRes.data;
        if (!team) return null;
        const leadRes = await team.teamLead();
        const lead = leadRes.data;
        return {
          ...team,
          teamLeadName: `${lead?.firstName ?? ''} ${lead?.lastName ?? ''}`.trim(),
        } as FlatTeam;
      }));
      const filteredTeams = teams.filter((t): t is FlatTeam => t !== null);
      console.log('User teams fetched:', filteredTeams);
      return filteredTeams;
    } catch (error) {
      console.error('Get user teams error:', error);
      return [];
    }
  }

  async getTeamMembers(teamId: string): Promise<UserType[]> {
    try {
      console.log('Fetching members for teamId:', teamId);
      const { data: members, errors } = await this.client.models.TeamMember.listTeamMemberByTeamId({ teamId });
      if (errors) throw new Error(`Failed to list team members: ${errors.map(e => e.message).join(', ')}`);
      const users = await Promise.all(members.map(async (m: TeamMemberType) => {
        const userRes = await m.user();
        return userRes.data;
      }));
      const filteredUsers = users.filter((u): u is UserType => u !== null);
      console.log('Team members fetched:', filteredUsers);
      return filteredUsers;
    } catch (error) {
      console.error('Get team members error:', error);
      return [];
    }
  }

  async createTeam(team: Partial<TeamType>): Promise<TeamType | null> {
    try {
      if (!team.name) throw new Error('Missing team name');
      if (!team.teamLeadId) throw new Error('Missing team lead ID');
      const { data, errors } = await this.client.models.Team.create({
        ...team,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as TeamType);
      if (errors) throw new Error(`Failed to create team: ${errors.map(e => e.message).join(', ')}`);
      console.log('Team created:', data);
      return data;
    } catch (Error) {
      console.error('Create team error:', Error);
      return null;
    }
  }

  async updateTeam(team: Partial<TeamType>): Promise<TeamType | null> {
    try {
      if (!team.id) throw new Error('Team ID required for update');
      const { data, errors } = await this.client.models.Team.update({
        ...team,
        updatedAt: new Date().toISOString(),
      } as TeamType);
      if (errors) throw new Error(`Failed to update team: ${errors.map(e => e.message).join(', ')}`);
      console.log('Team updated:', data);
      return data;
    } catch (error) {
      console.error('Update team error:', error);
      return null;
    }
  }

  async addTeamMember(teamId: string, userId: string): Promise<TeamMemberType | null> {
    try {
      const { data, errors } = await this.client.models.TeamMember.create({ teamId, userId });
      if (errors) throw new Error(`Failed to add team member: ${errors.map(e => e.message).join(', ')}`);
      console.log('Team member added:', data);
      return data;
    } catch (error) {
      console.error('Add team member error:', error);
      return null;
    }
  }

  async deleteTeamMember(teamId: string, userId: string): Promise<void> {
    try {
      console.log('Deleting team member for teamId:', teamId, 'userId:', userId);
      const { data, errors } = await this.client.models.TeamMember.listTeamMemberByTeamId({ teamId });
      if (errors) throw new Error(`Failed to list team members: ${errors.map(e => e.message).join(', ')}`);
      const target = data.find(m => m.userId === userId);
      if (!target) {
        console.log('No team member found for deletion');
        return;
      }
      const { errors: delErrors } = await this.client.models.TeamMember.delete({ id: target.id });
      if (delErrors) throw new Error(`Failed to delete team member: ${delErrors.map(e => e.message).join(', ')}`);
      console.log('Team member deleted:', target.id);
    } catch (error) {
      console.error('Delete team member error:', error);
    }
  }

  async deleteTeam(id: string): Promise<void> {
    try {
      console.log('Deleting team with ID:', id);
      const { errors } = await this.client.models.Team.delete({ id });
      if (errors) throw new Error(`Failed to delete team: ${errors.map(e => e.message).join(', ')}`);
      console.log('Team deleted:', id);
    } catch (error) {
      console.error('Delete team error:', error);
    }
  }

  // --- Real-Time Subscriptions ---
  observeTickets(): Observable<void> {
    return new Observable(observer => {
      console.log('Subscribing to ticket updates');
      const sub = this.client.models.Ticket.observeQuery().subscribe({
        next: () => {
          console.log('Ticket update observed');
          observer.next();
        },
        error: (err) => {
          console.error('Observe tickets error:', err);
          observer.error(err);
        },
      });
      return () => {
        console.log('Unsubscribing from ticket updates');
        sub.unsubscribe();
      };
    });
  }

  observeTeams(): Observable<void> {
    return new Observable(observer => {
      console.log('Subscribing to team updates');
      const sub = this.client.models.Team.observeQuery().subscribe({
        next: () => {
          console.log('Team update observed');
          observer.next();
        },
        error: (err) => {
          console.error('Observe teams error:', err);
          observer.error(err);
        },
      });
      return () => {
        console.log('Unsubscribing from team updates');
        sub.unsubscribe();
      };
    });
  }
}