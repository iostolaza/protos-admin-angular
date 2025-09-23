// src/app/core/services/contact.service.ts
import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { Observable } from 'rxjs';

type FriendType = Schema['Friend']['type'];
type UserType = Schema['User']['type'];
type ChannelType = Schema['Channel']['type'];
type UserChannelType = Schema['UserChannel']['type'];

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private client = generateClient<Schema>();

async getFriends(ownerCognitoId: string, nextToken: string | null = null): Promise<{ friends: (UserType & { addedAt: string })[]; nextToken: string | null }> {
  try {
    const { data, nextToken: newToken, errors } = await this.client.models.Friend.listFriendByOwnerCognitoIdAndAddedAt(
      { ownerCognitoId },
      { nextToken: nextToken ?? undefined }
    );
    if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    const friendsWithDate = await Promise.all(
      data.map(async (f: FriendType) => {
        const { data: userData, errors: userErrors } = await this.client.models.User.get({
          cognitoId: f.friendCognitoId,
        });
        if (userErrors) throw new Error(userErrors.map((e: any) => e.message).join(', '));
        return { ...userData, addedAt: f.addedAt } as NonNullable<UserType & { addedAt: string }>;
      })
    );
    return { friends: friendsWithDate, nextToken: newToken ?? null };
  } catch (error: unknown) {
    console.error('Get friends error:', error);
    return { friends: [], nextToken: null };
  }
}
  async getUsers(searchText: string, nextToken: string | null = null): Promise<{ users: Partial<UserType>[]; nextToken: string | null }> {
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
        cognitoId: u.cognitoId,
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

  async addFriend(ownerCognitoId: string, friendCognitoId: string): Promise<void> {
    try {
      const { errors } = await this.client.models.Friend.create({
        ownerCognitoId,
        friendCognitoId,
        addedAt: new Date().toISOString(),
      });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Add friend error:', error);
    }
  }

  async removeFriend(ownerCognitoId: string, friendCognitoId: string): Promise<void> {
    try {
      const { errors } = await this.client.models.Friend.delete({ ownerCognitoId, friendCognitoId });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Remove friend error:', error);
    }
  }

  async getOrCreateChannel(friendCognitoId: string): Promise<ChannelType> {
    try {
      const { userId: currentUserId } = await getCurrentUser();
      const directKey = [currentUserId, friendCognitoId].sort().join('_');
      const { data: channels, errors } = await this.client.models.Channel.listChannelByDirectKey({ directKey });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
      if (channels.length > 0) return channels[0];

      const { data: newChannel, errors: createErrors } = await this.client.models.Channel.create({
        name: `Chat with ${friendCognitoId}`,
        creatorCognitoId: currentUserId,
        type: 'direct',
        directKey,
      });
      if (createErrors) throw new Error(createErrors.map((e: any) => e.message).join(', '));
      await this.client.models.UserChannel.create({ userCognitoId: currentUserId, channelId: newChannel!.id });
      await this.client.models.UserChannel.create({ userCognitoId: friendCognitoId, channelId: newChannel!.id });
      return newChannel!;
    } catch (error: unknown) {
      console.error('Get or create channel error:', error);
      throw error;
    }
  }

  async deleteUser(cognitoId: string): Promise<void> {
    try {
      const { errors } = await this.client.models.User.delete({ cognitoId });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Delete user error:', error);
    }
  }

  async getContacts(nextToken: string | null = null): Promise<{ friends: (UserType & { addedAt: string })[]; nextToken: string | null }> {
    try {
      const { userId } = await getCurrentUser();
      return await this.getFriends(userId, nextToken);
    } catch (error) {
      console.error('Get contacts error:', error);
      return { friends: [], nextToken: null };
    }
  }

  async searchPool(searchQuery: string, nextToken: string | null = null): Promise<{ users: Partial<UserType>[]; nextToken: string | null }> {
    return await this.getUsers(searchQuery, nextToken);
  }

  async addContact(contactCognitoId: string): Promise<void> {
    try {
      const { userId } = await getCurrentUser();
      await this.addFriend(userId, contactCognitoId);
    } catch (error) {
      console.error('Add contact error:', error);
    }
  }

  async deleteContact(contactCognitoId: string): Promise<void> {
    try {
      const { userId } = await getCurrentUser();
      await this.removeFriend(userId, contactCognitoId);
    } catch (error) {
      console.error('Delete contact error:', error);
    }
  }

  // NEW: Real-time observation for Friend model changes.
  observeContacts(): Observable<void> {
    return new Observable(observer => {
      const sub = this.client.models.Friend.observeQuery().subscribe({
        next: () => observer.next(),
        error: (err) => observer.error(err),
      });
      return () => sub.unsubscribe();
    });
  }
}