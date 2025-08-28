
import { Injectable, inject } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

@Injectable({ providedIn: 'root' })
export class ContactsService {
  async getContacts(nextToken?: string | null) {
    const userId = await this.getCurrentUserId();
    const { data, nextToken: newToken } = await client.models.Friend.list({
      filter: { userId: { eq: userId } },
      nextToken,
    });
    const friendIds = data.map(f => f.friendId);
    const friends = await Promise.all(friendIds.map(id => client.models.User.get({ id })));
    return { friends: friends.map(f => f.data!), nextToken: newToken };
  }

  async searchPool(query: string, nextToken?: string | null) {
    const { data, nextToken: newToken } = await client.models.User.list({ nextToken });
    return data.filter(u => u.email.includes(query) || `${u.firstName} ${u.lastName}`.includes(query));
  }

  async addContact(friendId: string) {
    const userId = await this.getCurrentUserId();
    await client.models.Friend.create({ userId, friendId });
  }

  async deleteContact(friendId: string) {
    const userId = await this.getCurrentUserId();
    const { data } = await client.models.Friend.list({ filter: { userId: { eq: userId }, friendId: { eq: friendId } } });
    if (data[0]) await client.models.Friend.delete({ id: data[0].id });
  }

  private async getCurrentUserId() {
    const { userId } = await getCurrentUser();
    return userId;
  }
}