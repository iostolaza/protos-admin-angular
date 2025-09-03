// src/app/core/services/contact.service.ts
import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';

type FriendType = Schema['Friend']['type'];
type UserType = Schema['User']['type'];
type ChannelType = Schema['Channel']['type'];
type UserChannelType = Schema['UserChannel']['type'];

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private client = generateClient<Schema>();

  async getFriends(userId: string, nextToken: string | null = null) {
    try {
      const { data, nextToken: newToken, errors } = await this.client.models.Friend.list({
        filter: { userId: { eq: userId } },
        nextToken: nextToken ?? undefined,
      });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
      const friendsWithDate = await Promise.all(
        data.map(async (f: FriendType) => {
          const { data: userData, errors: userErrors } = await this.client.models.User.get({
            id: f.friendId,
          });
          if (userErrors) throw new Error(userErrors.map((e: any) => e.message).join(', '));
          return { ...userData, createdAt: f.createdAt } as NonNullable<UserType>;
        })
      );
      return { friends: friendsWithDate, nextToken: newToken ?? null };
    } catch (error: unknown) {
      console.error('Get friends error:', error);
      return { friends: [], nextToken: null };
    }
  }

  async getUsers(searchText: string, nextToken: string | null = null) {
    try {
      const { data: users, nextToken: newToken, errors } = await this.client.models.User.list({
        filter: searchText
          ? {
              or: [
                { firstName: { contains: searchText } },
                { lastName: { contains: searchText } },
                { username: { contains: searchText } },
                { email: { contains: searchText } },
              ],
            }
          : {},
        nextToken: nextToken ?? undefined,
      });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
      const usersPicked = users.map((u: UserType) => ({
        id: u.id,
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        username: u.username ?? '',
        email: u.email,
        profileImageKey: u.profileImageKey ?? null,
        createdAt: u.createdAt,
      }));
      return { users: usersPicked, nextToken: newToken ?? null };
    } catch (error: unknown) {
      console.error('Get users error:', error);
      return { users: [], nextToken: null };
    }
  }

  async addFriend(userId: string, friendId: string) {
    try {
      const { errors } = await this.client.models.Friend.create({ userId, friendId });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Add friend error:', error);
    }
  }

  async removeFriend(userId: string, friendId: string) {
    try {
      const { errors } = await this.client.models.Friend.delete({ userId, friendId });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Remove friend error:', error);
    }
  }

  async getOrCreateChannel(friendId: string): Promise<ChannelType> {
    try {
      const { userId: currentUserId } = await getCurrentUser();
      const { data: userChannels, errors } = await this.client.models.UserChannel.list({
        filter: { userId: { eq: currentUserId } },
      });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
      const potentialChannel = userChannels.reduce((acc: Record<string, number>, uc: UserChannelType) => {
        acc[uc.channelId] = (acc[uc.channelId] || 0) + 1;
        return acc;
      }, {});
      const channelId = Object.keys(potentialChannel).find(id => potentialChannel[id] > 1);
      if (channelId) {
        const { data, errors: getErrors } = await this.client.models.Channel.get({ id: channelId });
        if (getErrors) throw new Error(getErrors.map((e: any) => e.message).join(', '));
        if (data) return data;
      }
      const { data: newChannel, errors: createErrors } = await this.client.models.Channel.create({
        name: `Chat with ${friendId}`,
      });
      if (createErrors) throw new Error(createErrors.map((e: any) => e.message).join(', '));
      await this.client.models.UserChannel.create({ userId: currentUserId, channelId: newChannel!.id });
      await this.client.models.UserChannel.create({ userId: friendId, channelId: newChannel!.id });
      return newChannel!;
    } catch (error: unknown) {
      console.error('Get or create channel error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      const { errors } = await this.client.models.User.delete({ id: userId });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Delete user error:', error);
    }
  }

  // Added to match ContactsComponent usage
  async getContacts(nextToken: string | null = null) {
    try {
      const { userId } = await getCurrentUser();
      return await this.getFriends(userId, nextToken); // Updated to getFriends with nextToken
    } catch (error) {
      console.error('Get contacts error:', error);
      return { friends: [], nextToken: null };
    }
  }

  // Added to match ContactsComponent usage
  async searchPool(searchQuery: string, nextToken: string | null = null) {
    return await this.getUsers(searchQuery, nextToken);
  }

  // Added to match ContactsComponent usage
  async addContact(contactId: string) {
    try {
      const { userId } = await getCurrentUser();
      await this.addFriend(userId, contactId);
    } catch (error) {
      console.error('Add contact error:', error);
    }
  }

  // Added to match ContactsComponent usage
  async deleteContact(contactId: string) {
    try {
      const { userId } = await getCurrentUser();
      await this.removeFriend(userId, contactId);
    } catch (error) {
      console.error('Delete contact error:', error);
    }
  }
}