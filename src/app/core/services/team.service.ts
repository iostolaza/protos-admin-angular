// src/app/core/services/team.service.ts

import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { UserService } from './user.service'; // Assuming existing

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private client = generateClient<Schema>();
  public teams = signal<Schema['Team']['type'][]>([]);
  public members = signal<Schema['User']['type'][]>([]); // For current team

  constructor(private userService: UserService) {}

  async createTeam(name: string, inviteUserIds: string[]) {
    try {
      const { userId } = await getCurrentUser();
      const leadUser = this.userService.user();
      const teamLeadName = `${leadUser?.firstName || ''} ${leadUser?.lastName || ''}`.trim() || 'Unknown';
      const now = new Date().toISOString();

      const { data: team, errors } = await this.client.models.Team.create({
        name,
        description: '',
        teamLeadCognitoId: userId,
        teamLeadName,
        memberCount: inviteUserIds.length,
        createdAt: now,
        updatedAt: now,
      });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));

      for (const userId of inviteUserIds) {
        await this.client.models.TeamMember.create({
          teamId: team.id,
          userCognitoId: userId,
          createdAt: now,
          updatedAt: now,
        });
      }
      this.teams.update(t => [...t, team]);
      return team;
    } catch (error) {
      console.error('Create team error:', error);
      throw error;
    }
  }

  async getTeams() {
    try {
      const { data, errors } = await this.client.models.Team.list();
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      this.teams.set(data);
      return data;
    } catch (error) {
      console.error('Get teams error:', error);
      return [];
    }
  }

  async getTeam(id: string) {
    try {
      const { data, errors } = await this.client.models.Team.get({ id });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      return data;
    } catch (error) {
      console.error('Get team error:', error);
      return null;
    }
  }

  async updateTeam(id: string, updates: { name?: string; description?: string }) {
    try {
      const { data, errors } = await this.client.models.Team.update({
        id,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      this.teams.update(t => t.map(team => team.id === id ? data : team));
      return data;
    } catch (error) {
      console.error('Update team error:', error);
      throw error;
    }
  }

  async deleteTeam(id: string) {
    try {
      // Delete members first
      const { data: members } = await this.client.models.TeamMember.list({ filter: { teamId: { eq: id } } });
      for (const member of members) {
        await this.client.models.TeamMember.delete({ id: member.id });
      }
      const { errors } = await this.client.models.Team.delete({ id });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      this.teams.update(t => t.filter(team => team.id !== id));
    } catch (error) {
      console.error('Delete team error:', error);
      throw error;
    }
  }

  async getTeamMembers(teamId: string) {
    try {
      const { data: members, errors } = await this.client.models.TeamMember.list({ filter: { teamId: { eq: teamId } } });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      const users = await Promise.all(members.map(async m => {
        const { data: user } = await this.client.models.User.get({ cognitoId: m.userCognitoId });
        return user;
      }));
      this.members.set(users.filter(u => u !== null) as Schema['User']['type'][]);
      return this.members();
    } catch (error) {
      console.error('Get members error:', error);
      return [];
    }
  }

  async addMember(teamId: string, userCognitoId: string) {
    try {
      const now = new Date().toISOString();
      const { errors } = await this.client.models.TeamMember.create({
        teamId,
        userCognitoId,
        createdAt: now,
        updatedAt: now,
      });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      // Update count
      const team = await this.getTeam(teamId);
      if (team) {
        await this.updateTeam(teamId, { });
        await this.client.models.Team.update({ id: teamId, memberCount: (team.memberCount || 0) + 1 });
      }
      await this.getTeamMembers(teamId);
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  }

  async removeMember(teamId: string, userCognitoId: string) {
    try {
      const { data: member } = await this.client.models.TeamMember.list({ filter: { teamId: { eq: teamId }, userCognitoId: { eq: userCognitoId } } });
      if (member[0]) {
        await this.client.models.TeamMember.delete({ id: member[0].id });
        // Update count
        const team = await this.getTeam(teamId);
        if (team) {
          await this.client.models.Team.update({ id: teamId, memberCount: Math.max(0, (team.memberCount || 0) - 1) });
        }
        await this.getTeamMembers(teamId);
      }
    } catch (error) {
      console.error('Remove member error:', error);
      throw error;
    }
  }
}