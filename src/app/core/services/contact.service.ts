// src/app/core/services/contact.service.ts
import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';
import { InputContact } from '../models/contact'; // Import extended type

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
      const userRes = await client.models.User.get({ id: f.friendId });
      const user = userRes.data!;
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
      filter: { or: [{ firstName: { contains: query } }, { lastName: { contains: query } }, { email: { contains: query } }] },
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

  private async getCurrentUserId(): Promise<string> {
    const { userId } = await getCurrentUser();
    return userId;
  }
}