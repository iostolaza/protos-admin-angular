// src/app/core/services/contact.service.ts 

import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { Observable, Subject, from } from 'rxjs'; 
import { takeUntil, switchMap } from 'rxjs/operators';
import { InputContact } from '../models/contact';  

type FriendType = Schema['Friend']['type'];
type UserType = Schema['User']['type'];

@Injectable({
  providedIn: 'root',
})
export class ContactService {
  private client = generateClient<Schema>();
  private destroy$ = new Subject<void>();

  async deleteUser(userCognitoId: string) {
    try {
      const { errors } = await this.client.models.User.delete({
        cognitoId: userCognitoId,
      });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Delete user error:', error);
    }
  }

  async addContact(contactCognitoId: string) {
    try {
      const { userId } = await getCurrentUser();
      await this.addFriend(userId, contactCognitoId);
    } catch (error) {
      console.error('Add contact error:', error);
    }
  }

  async deleteContact(contactCognitoId: string) {
    try {
      const { userId } = await getCurrentUser();
      await this.removeFriend(userId, contactCognitoId);
    } catch (error) {
      console.error('Delete contact error:', error);
    }
  }

  private handleErrors(errors?: { message: string }[], message: string = 'Operation failed'): void {
    if (errors?.length) {
      throw new Error(`${message}: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  async getCurrentUserId(): Promise<string> {
    const session = await fetchAuthSession();
    if (!session.tokens) {
      throw new Error('User not authenticated');
    }
    const { userId } = await getCurrentUser();
    return userId;
  }

  async getUserById(userCognitoId: string): Promise<Schema['User']['type']> {
    if (!userCognitoId) throw new Error('Invalid user ID');
    const { data, errors } = await this.client.models.User.get({ cognitoId: userCognitoId });
    this.handleErrors(errors, 'Get user failed');
    if (!data) throw new Error('User not found');
    return data;
  }

  getContacts(): Observable<UserType[]> {
    const contacts$ = new Subject<UserType[]>();
    const destroyer$ = new Subject<void>();

    from(getCurrentUser()).pipe(
      switchMap(({ userId }) => this.client.models.Friend.observeQuery({
        filter: { userCognitoId: { eq: userId } }
      })),
      takeUntil(destroyer$)
    ).subscribe({
      next: async ({ items, isSynced }) => {
        console.log('Friend observeQuery snapshot:', { items: items.length, isSynced });
        const uniqueFriends = new Map<string, FriendType>(); // Dedupe if bidirectional
        items.forEach(f => uniqueFriends.set(f.friendCognitoId, f));
        const users = await Promise.all(
          Array.from(uniqueFriends.values()).map(async (f: FriendType) => {
            const { data: userData, errors: userErrors } = await this.client.models.User.get({
              cognitoId: f.friendCognitoId,
            });
            if (userErrors) throw new Error(userErrors.map((e: any) => e.message).join(', '));
            return { ...userData, createdAt: f.createdAt } as NonNullable<UserType>;
          })
        );
        contacts$.next(users);
      },
      error: (err) => contacts$.error(err),
      complete: () => contacts$.complete()
    });

    contacts$.subscribe({ complete: () => destroyer$.next() });

    return contacts$.asObservable();
  }

  searchPool(searchText: string): Observable<InputContact[]> {
    const users$ = new Subject<InputContact[]>();
    const destroyer$ = new Subject<void>();

    const filter = searchText
      ? {
          or: [
            { firstName: { contains: searchText } },
            { lastName: { contains: searchText } },
            { username: { contains: searchText } },
            { email: { contains: searchText } },
          ],
        }
      : undefined;

    this.client.models.User.observeQuery({ filter }).pipe(
      takeUntil(destroyer$)
    ).subscribe({
      next: ({ items }) => {
        console.log('User observeQuery snapshot for search:', { items: items.length });
        const usersPicked = items.map((u: UserType) => ({
          cognitoId: u.cognitoId,
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          username: u.username ?? '',
          email: u.email,
          profileImageKey: u.profileImageKey ?? null,
          createdAt: u.createdAt,
        } as InputContact));
        users$.next(usersPicked);
      },
      error: (err) => users$.error(err),
      complete: () => users$.complete()
    });

    users$.subscribe({ complete: () => destroyer$.next() });

    return users$.asObservable();
  }

  private async addFriend(userCognitoId: string, friendCognitoId: string) {
    try {
      const { errors } = await this.client.models.Friend.create({ userCognitoId, friendCognitoId }); // Amplify auto-populates timestamps
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
      // Bidirectional
      const { errors: reverseErrors } = await this.client.models.Friend.create({ userCognitoId: friendCognitoId, friendCognitoId: userCognitoId });
      if (reverseErrors) throw new Error(reverseErrors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Add friend error:', error);
    }
  }

  private async removeFriend(userCognitoId: string, friendCognitoId: string) {
    try {
      const { errors } = await this.client.models.Friend.delete({ userCognitoId, friendCognitoId });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
      // Bidirectional - ignore if reverse not found
      await this.client.models.Friend.delete({ userCognitoId: friendCognitoId, friendCognitoId: userCognitoId }).catch(() => console.warn('Reverse friend record not found'));
    } catch (error: unknown) {
      console.error('Remove friend error:', error);
    }
  }

  async getOrCreateChannel(contactCognitoId: string): Promise<Schema['Channel']['type']> {
    const currentUserCognitoId = await this.getCurrentUserId();
    try {
      await this.getUserById(contactCognitoId);
    } catch {
      throw new Error('Contact not found');
    }
    const { data: userChannels, errors } = await this.client.models.UserChannel.list({
      filter: { or: [{ userCognitoId: { eq: currentUserCognitoId } }, { userCognitoId: { eq: contactCognitoId } }] },
    });
    this.handleErrors(errors);
    const potentialChannels = userChannels.reduce((acc: Record<string, number>, uc) => {
      acc[uc.channelId] = (acc[uc.channelId] || 0) + 1;
      return acc;
    }, {});
    const potentialChannelId = Object.keys(potentialChannels).find(id => potentialChannels[id] === 2);
    if (potentialChannelId) {
      const { data, errors: getErrors } = await this.client.models.Channel.get({ id: potentialChannelId });
      this.handleErrors(getErrors);
      if (!data) throw new Error('Channel not found');
      return data;
    }
    let attempts = 3;
    while (attempts > 0) {
      try {
        const now = new Date().toISOString();
        const directKey = [currentUserCognitoId, contactCognitoId].sort().join('_');
        const { data: newChannel, errors: createErrors } = await this.client.models.Channel.create({
          name: `Chat with ${contactCognitoId}`,
          creatorCognitoId: currentUserCognitoId,
          type: 'direct',
          directKey,
          createdAt: now,
          updatedAt: now
        });
        this.handleErrors(createErrors);
        if (!newChannel) throw new Error('Failed to create channel');
        const { errors: senderErr } = await this.client.models.UserChannel.create({ userCognitoId: currentUserCognitoId, channelId: newChannel.id, createdAt: now, updatedAt: now });
        this.handleErrors(senderErr);
        const { errors: receiverErr } = await this.client.models.UserChannel.create({ userCognitoId: contactCognitoId, channelId: newChannel.id, createdAt: now, updatedAt: now });
        this.handleErrors(receiverErr);
        const { data: verify } = await this.client.models.UserChannel.list({ filter: { channelId: { eq: newChannel.id } } });
        if (verify.length === 2) {
          await this.client.models.Channel.update({ id: newChannel.id, updatedAt: new Date().toISOString() });
          return newChannel;
        }
        throw new Error('Verification failed');
      } catch (err) {
        attempts--;
        if (attempts === 0) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Failed after retries');
  }
}