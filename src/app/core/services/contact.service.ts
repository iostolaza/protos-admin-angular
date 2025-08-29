// src/app/core/services/contact.service.ts
import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import { InputContact } from '../models/contact';

const client = generateClient<Schema>();

@Injectable({ providedIn: 'root' })
export class ContactsService {
  async getContacts(nextToken?: string | null): Promise<{ friends: InputContact[], nextToken: string | null | undefined }> {
    const userId = await this.getCurrentUserId();
    const { data, nextToken: newToken } = await client.models.Friend.list({
      filter: { userId: { eq: userId } },
      nextToken,
    });
    const friendsWithDate = await Promise.all(data.map(async (f) => {
      const { data: userData } = await client.models.User.list({ filter: { owner: { eq: f.friendId } } });
      const user = userData[0];
      if (!user) throw new Error(`User with owner ${f.friendId} not found`);
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        profileImageKey: user.profileImageKey,
        status: user.status,
        dateAdded: f.createdAt
      } as InputContact;
    }));
    return { friends: friendsWithDate, nextToken: newToken };
  }

  async searchPool(query: string, nextToken?: string | null): Promise<{ users: InputContact[], nextToken: string | null | undefined }> {
    if (!query) return { users: [], nextToken: null };
    const { data, nextToken: newToken } = await client.models.User.list({
      filter: { or: [{ firstName: { contains: query } }, { lastName: { contains: query } }, { email: { contains: query } }, { username: { contains: query } }] },
      nextToken,
    });
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
  }

  async addContact(friendId: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    await client.models.Friend.create({ userId, friendId });
  }

  async deleteContact(friendId: string): Promise<void> {
    const userId = await this.getCurrentUserId();
    const { data } = await client.models.Friend.list({ filter: { userId: { eq: userId }, friendId: { eq: friendId } } });
    if (data[0]) await client.models.Friend.delete({ id: data[0].id });
  }

  async initiateMessage(friendId: string): Promise<string> {
    const userId = await this.getCurrentUserId();
    const { data: userChannels } = await client.models.UserChannel.list({
      filter: { or: [{ userId: { eq: userId } }, { userId: { eq: friendId } }] },
    });
    const potentialChannel = userChannels.reduce((acc, uc) => {
      acc[uc.channelId] = (acc[uc.channelId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const channelId = Object.keys(potentialChannel).find(id => potentialChannel[id] === 2);
    if (channelId) {
      const { data } = await client.models.Channel.get({ id: channelId });
      if (!data) throw new Error('Channel not found');
      return channelId;
    }
    const { data: newChannel } = await client.models.Channel.create({ name: `Chat with ${friendId}` });
    if (!newChannel) throw new Error('Failed to create channel');
    await client.models.UserChannel.create({ userId, channelId: newChannel.id });
    await client.models.UserChannel.create({ userId: friendId, channelId: newChannel.id });
    return newChannel.id;
  }

  async deleteUser(userId: string): Promise<void> {
    const currentUserId = await this.getCurrentUserId();
    const { data } = await client.models.User.list({ filter: { owner: { eq: userId } } });
    const user = data[0];
    if (!user) throw new Error(`User with owner ${userId} not found`);
    if (user.owner !== currentUserId) throw new Error('Not authorized to delete this user');
    await client.models.User.delete({ id: user.id });
  }

  private async getCurrentUserId(): Promise<string> {
    const { userId } = await getCurrentUser();
    return userId;
  }
}