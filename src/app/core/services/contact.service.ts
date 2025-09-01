import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import { InputContact } from '../models/contact';

const client = generateClient<Schema>();

@Injectable({ providedIn: 'root' })
export class ContactsService {
  async getContacts(nextToken?: string | null): Promise<{ friends: InputContact[], nextToken: string | null | undefined }> {
    try {
      const userId = await this.getCurrentUserId();
      const { data, nextToken: newToken, errors } = await client.models.Friend.list({
        filter: { userId: { eq: userId } },
        nextToken,
      });
      console.log('Get contacts response:', { data, errors, nextToken });
      const friendsWithDate = await Promise.all(data.map(async (f) => {
        const { data: userData, errors: userErrors } = await client.models.User.get({ id: f.friendId });
        console.log('User data for friend:', { friendId: f.friendId, userData, userErrors });
        if (!userData) throw new Error(`User with id ${f.friendId} not found`);
        return {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          email: userData.email,
          profileImageKey: userData.profileImageKey,
          status: userData.status,
          dateAdded: f.createdAt
        } as InputContact;
      }));
      return { friends: friendsWithDate, nextToken: newToken };
    } catch (error) {
      console.error('Get contacts error:', error);
      return { friends: [], nextToken: null };
    }
  }

  async searchPool(query: string, nextToken?: string | null): Promise<{ users: InputContact[], nextToken: string | null | undefined }> {
    try {
      if (!query) return { users: [], nextToken: null };
      const { data, nextToken: newToken, errors } = await client.models.User.list({
        filter: { or: [{ firstName: { contains: query } }, { lastName: { contains: query } }, { email: { contains: query } }, { username: { contains: query } }] },
        nextToken,
      });
      console.log('Search pool response:', { query, data, errors, nextToken });
      const usersPicked = data.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
        email: u.email,
        profileImageKey: u.profileImageKey,
        status: u.status
      }) as InputContact);
      return { users: usersPicked, nextToken: newToken };
    } catch (error) {
      console.error('Search pool error:', error);
      return { users: [], nextToken: null };
    }
  }

  async addContact(friendId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const { errors } = await client.models.Friend.create({ userId, friendId });
      console.log('Add contact response:', { userId, friendId, errors });
      if (errors) {
        throw new Error(`Add contact failed: ${errors.map(e => e.message).join(', ')}`);
      }
    } catch (error) {
      console.error('Add contact error:', error);
      throw error;
    }
  }

  async deleteContact(friendId: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      const { data, errors } = await client.models.Friend.list({ filter: { userId: { eq: userId }, friendId: { eq: friendId } } });
      console.log('Delete contact list response:', { userId, friendId, data, errors });
      if (errors) {
        throw new Error(`List friends failed: ${errors.map(e => e.message).join(', ')}`);
      }
      if (data[0]) {
        const { errors: deleteErrors } = await client.models.Friend.delete({ id: data[0].id });
        console.log('Delete contact response:', { friendId, deleteErrors });
        if (deleteErrors) {
          throw new Error(`Delete contact failed: ${deleteErrors.map(e => e.message).join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Delete contact error:', error);
      throw error;
    }
  }

  async initiateMessage(friendId: string): Promise<string> {
    try {
      const userId = await this.getCurrentUserId();
      const { data: userChannels, errors } = await this.client.models.UserChannel.list({
        filter: { or: [{ userId: { eq: userId } }, { userId: { eq: friendId } }] },
      });
      console.log('Initiate message user channels:', { userChannels, errors });
      if (errors) {
        throw new Error(`List user channels failed: ${errors.map(e => e.message).join(', ')}`);
      }
      const potentialChannel = userChannels.reduce((acc, uc) => {
        acc[uc.channelId] = (acc[uc.channelId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const channelId = Object.keys(potentialChannel).find(id => potentialChannel[id] === 2);
      if (channelId) {
        const { data, errors } = await this.client.models.Channel.get({ id: channelId });
        console.log('Existing channel for message:', { channelId, data, errors });
        if (!data) throw new Error('Channel not found');
        return channelId;
      }
      const { data: newChannel, errors: createErrors } = await this.client.models.Channel.create({ name: `Chat with ${friendId}` });
      console.log('Create channel response:', { newChannel, createErrors });
      if (createErrors) {
        throw new Error(`Create channel failed: ${createErrors.map(e => e.message).join(', ')}`);
      }
      if (!newChannel) throw new Error('Failed to create channel');
      await this.client.models.UserChannel.create({ userId, channelId: newChannel.id });
      await this.client.models.UserChannel.create({ userId: friendId, channelId: newChannel.id });
      return newChannel.id;
    } catch (error) {
      console.error('Initiate message error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const currentUserId = await this.getCurrentUserId();
      const { data, errors } = await client.models.User.list({ filter: { owner: { eq: userId } } });
      console.log('Delete user list response:', { userId, data, errors });
      if (errors) {
        throw new Error(`List users failed: ${errors.map(e => e.message).join(', ')}`);
      }
      const user = data[0];
      if (!user) throw new Error(`User with owner ${userId} not found`);
      if (user.owner !== currentUserId) throw new Error('Not authorized to delete this user');
      const { errors: deleteErrors } = await client.models.User.delete({ id: user.id });
      console.log('Delete user response:', { userId, deleteErrors });
      if (deleteErrors) {
        throw new Error(`Delete user failed: ${deleteErrors.map(e => e.message).join(', ')}`);
      }
    } catch (error) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  private async getCurrentUserId(): Promise<string> {
    const { userId } = await getCurrentUser();
    console.log('Current user ID:', userId);
    return userId;
  }
}
