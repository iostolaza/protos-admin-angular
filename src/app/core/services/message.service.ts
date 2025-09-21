// src/app/core/services/message.service.ts (Full edited script)
import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../amplify/data/resource';
import { Observable, from, Subject, Subscription } from 'rxjs';
import { tap, takeUntil, debounceTime } from 'rxjs/operators';
import { Hub } from 'aws-amplify/utils';

interface ChatItem { id: string; name: string; snippet: string; avatar: string; timestamp?: Date; otherUserId: string; }
interface Message { id: string; text: string; sender: string; senderAvatar?: string; isSelf?: boolean; timestamp?: Date; read?: boolean; }

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private client = generateClient<Schema>();
  private recentChats = signal<ChatItem[]>([]);
  private messages = signal<Message[]>([]);
  private searchQuery = signal<string>('');
  private selectedChannel = signal<string | null>(null);
  private userCache = new Map<string, Schema['User']['type']>();
  private destroy$ = new Subject<void>();
  private reloadSubject = new Subject<void>();
  private subscriptions: Subscription[] = [];

  constructor() {
    this.setupRealTimeSubscriptions();
    this.monitorConnectionState();
    this.reloadSubject.pipe(debounceTime(500), takeUntil(this.destroy$)).subscribe(() => this.loadRecentChats());
  }

  private monitorConnectionState() {
    Hub.listen('api', (data: any) => {
      const { payload } = data;
      if (payload.event === 'CONNECTION_STATE_CHANGE') {
        console.log('API connection state:', payload.data.connectionState);
      }
    });
  }

  getRecentChats() { return this.recentChats.asReadonly(); }
  getMessages() { return this.messages.asReadonly(); }
  getSearchQuery() { return this.searchQuery.asReadonly(); }
  setSearchQuery(value: string) { this.searchQuery.set(value); }
  setSelectedChannel(id: string) { this.selectedChannel.set(id); }

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

  getUserChannels(userCognitoId: string): Observable<Schema['UserChannel']['type'][]> {
    const userChannels$ = new Subject<Schema['UserChannel']['type'][]>();
    const destroyer$ = new Subject<void>();

    this.client.models.UserChannel.observeQuery({
      filter: { userCognitoId: { eq: userCognitoId } }
    }).pipe(
      takeUntil(destroyer$)
    ).subscribe({
      next: ({ items }) => userChannels$.next(items),
      error: (err) => userChannels$.error(err),
      complete: () => userChannels$.complete()
    });

    userChannels$.subscribe({ complete: () => destroyer$.next() });
    return userChannels$.asObservable();
  }

  async getOtherUserId(channelId: string, currentUserCognitoId: string): Promise<string | null> {
    const { data: userChannels, errors } = await this.client.models.UserChannel.listUserChannelByChannelId({ channelId });
    this.handleErrors(errors, 'List user channels failed');
    const userCognitoIds = userChannels.map(uc => uc.userCognitoId);
    return userCognitoIds.find(id => id !== currentUserCognitoId) || null;
  }

  async getUserById(userCognitoId: string): Promise<Schema['User']['type']> {
    if (!userCognitoId) throw new Error('Invalid user ID');
    if (this.userCache.has(userCognitoId)) return this.userCache.get(userCognitoId)!;
    const { data, errors } = await this.client.models.User.get({ cognitoId: userCognitoId });
    this.handleErrors(errors, 'Get user failed');
    if (!data) throw new Error('User not found');
    this.userCache.set(userCognitoId, data);
    return data;
  }

  async deleteMessage(id: string): Promise<void> {
    const { errors } = await this.client.models.Message.delete({ id });
    this.handleErrors(errors, 'Delete message failed');
  }

  async getLastMessage(channelId: string): Promise<Schema['Message']['type'] | null> {
    const { data, errors } = await this.client.models.Message.listMessageByChannelIdAndTimestamp({ channelId }, { sortDirection: 'DESC', limit: 1 });
    this.handleErrors(errors, 'List messages failed');
    return data[0] ?? null;
  }

  async loadRecentChats() {
    try {
      const userCognitoId = await this.getCurrentUserId();
      this.getUserChannels(userCognitoId).pipe(takeUntil(this.destroy$)).subscribe(userChannels => {
        Promise.all(userChannels.map(async uc => {
          const { data: channel, errors } = await this.client.models.Channel.get({ id: uc.channelId });
          this.handleErrors(errors);
          if (!channel) return null;
          return channel;
        })).then(async channelResults => {
          const channels = channelResults.filter((c): c is NonNullable<typeof c> => !!c);
          const chats = await Promise.all(channels.map(async channel => {
            const otherUserCognitoId = await this.getOtherUserId(channel.id, userCognitoId);
            if (!otherUserCognitoId) return null;
            const otherUser = await this.getUserById(otherUserCognitoId);
            const lastMsg = await this.getLastMessage(channel.id);
            return {
              id: channel.id,
              name: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim(),
              snippet: lastMsg?.content ?? '',
              avatar: await this.getAvatarUrl(otherUser.profileImageKey || ''),
              timestamp: lastMsg?.timestamp ? new Date(lastMsg.timestamp) : undefined,
              otherUserId: otherUserCognitoId
            };
          }));
          const filteredChats = chats.filter((c) => !!c) as ChatItem[];
          filteredChats.sort((a, b) => (b?.timestamp?.getTime() || 0) - (a?.timestamp?.getTime() || 0));
          this.recentChats.set(filteredChats);
        }).catch(error => console.error('Process channels error:', error));
      });
    } catch (error) {
      console.error('Load recent chats error:', error);
      this.recentChats.set([]);
    }
  }

  async loadMessages(channelId: string) {
    try {
      const messages = await this.fetchMessages(channelId);
      const currentUserCognitoId = await this.getCurrentUserId();
      const mapped = await Promise.all(messages.map(async msg => {
        const sender = await this.getUserById(msg.senderCognitoId);
        return {
          id: msg.id,
          text: msg.content ?? '',
          sender: `${sender.firstName || ''} ${sender.lastName || ''}`,
          senderAvatar: await this.getAvatarUrl(sender.profileImageKey || ''),
          isSelf: msg.senderCognitoId === currentUserCognitoId,
          timestamp: new Date(msg.timestamp),
          read: msg.readBy?.includes(currentUserCognitoId) ?? false,
        };
      }));
      this.messages.set(mapped);
    } catch (error) {
      console.error('Load messages error:', error);
      this.messages.set([]);
    }
  }

  async searchChats(query: string): Promise<ChatItem[]> {
    try {
      const userCognitoId = await this.getCurrentUserId();
      const userChannels = await this.getUserChannels(userCognitoId).pipe(takeUntil(this.destroy$)).toPromise() ?? [];
      const chats = await Promise.all(userChannels.map(async uc => {
        const otherUserCognitoId = await this.getOtherUserId(uc.channelId, userCognitoId);
        if (!otherUserCognitoId) return null;
        const otherUser = await this.getUserById(otherUserCognitoId);
        const lastMsg = await this.getLastMessage(uc.channelId);
        return {
          id: uc.channelId,
          name: `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim(),
          snippet: lastMsg?.content ?? '',
          avatar: await this.getAvatarUrl(otherUser.profileImageKey || ''),
          timestamp: lastMsg?.timestamp ? new Date(lastMsg.timestamp) : undefined,
          otherUserId: otherUserCognitoId
        };
      }));
      const filteredChats = chats.filter((c) => !!c) as ChatItem[];
      filteredChats.sort((a, b) => (b?.timestamp?.getTime() || 0) - (a?.timestamp?.getTime() || 0));
      return filteredChats.filter(chat => 
        chat.name.toLowerCase().includes(query.toLowerCase()) || chat.snippet.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Search chats error:', error);
      return [];
    }
  }

  async getContacts(): Promise<Schema['User']['type'][]> {
    const currentUserCognitoId = await this.getCurrentUserId();
    const { data, errors } = await this.client.models.User.list();
    this.handleErrors(errors, 'List users failed');
    return data.filter(user => user.cognitoId !== currentUserCognitoId);
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

  async fetchMessages(channelId: string): Promise<Schema['Message']['type'][]> {
    const currentUserCognitoId = await this.getCurrentUserId();
    const { data: messages, errors } = await this.client.models.Message.listMessageByChannelIdAndTimestamp({ channelId }, { sortDirection: 'ASC' });
    this.handleErrors(errors);
    for (const msg of messages) {
      if (!msg.readBy?.includes(currentUserCognitoId)) {
        const readBy = [...(msg.readBy || []), currentUserCognitoId];
        const { errors: updateErrors } = await this.client.models.Message.update({ id: msg.id, readBy, updatedAt: new Date().toISOString() });
        this.handleErrors(updateErrors);
      }
    }
    return messages;
  }

  subscribeMessages(channelId: string | null): Observable<{ items: Schema['Message']['type'][], isSynced: boolean }> {
    const filter = channelId ? { channelId: { eq: channelId } } : undefined;
    return this.client.models.Message.observeQuery({ filter }).pipe(
      tap(snapshot => {
        if (channelId) this.updateMessagesFromSnapshot(snapshot.items);
      })
    );
  }

  private async updateMessagesFromSnapshot(items: Schema['Message']['type'][]) {
    const currentUserCognitoId = await this.getCurrentUserId();
    const mapped = await Promise.all(items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()).map(async msg => {
      const sender = await this.getUserById(msg.senderCognitoId);
      return {
        id: msg.id,
        text: msg.content ?? '',
        sender: `${sender.firstName || ''} ${sender.lastName || ''}`,
        senderAvatar: await this.getAvatarUrl(sender.profileImageKey || ''),
        isSelf: msg.senderCognitoId === currentUserCognitoId,
        timestamp: new Date(msg.timestamp),
        read: msg.readBy?.includes(currentUserCognitoId) ?? false,
      };
    }));
    this.messages.set(mapped);
  }

  async sendMessage(channelId: string, content: string, attachment?: string): Promise<Schema['Message']['type']> {
    const currentUserCognitoId = await this.getCurrentUserId();
    const now = new Date().toISOString();
    const { data, errors } = await this.client.models.Message.create({
      content,
      senderCognitoId: currentUserCognitoId,
      channelId,
      timestamp: now,
      attachment,
      readBy: [currentUserCognitoId],
      createdAt: now,
      updatedAt: now,
    });
    this.handleErrors(errors);
    return data!;
  }

  async uploadAttachment(file: File): Promise<string> {
    const path = ({ identityId }: { identityId?: string }) => `profile/${identityId || ''}/attachments/${file.name}`;
    const result = await uploadData({ path, data: file }).result;
    return result.path;
  }

  async getAvatarUrl(profileImageKey: string): Promise<string> {
    if (!profileImageKey) return 'assets/profile/avatar-default.svg';
    const { url } = await getUrl({ path: profileImageKey });
    return url.toString();
  }

  async deleteChat(channelId: string) {
    const userCognitoId = await this.getCurrentUserId();
    const { data: userChannel, errors } = await this.client.models.UserChannel.get({ userCognitoId, channelId });
    this.handleErrors(errors);
    if (userChannel) {
      const { errors: deleteErrors } = await this.client.models.UserChannel.delete({ userCognitoId, channelId });
      this.handleErrors(deleteErrors);
    }
    this.reloadSubject.next();
  }

  private async setupRealTimeSubscriptions() {
    const userCognitoId = await this.getCurrentUserId();
    this.subscriptions.push(
      this.client.models.UserChannel.observeQuery({ filter: { userCognitoId: { eq: userCognitoId } } }).pipe(
        takeUntil(this.destroy$)
      ).subscribe(snapshot => {
        if (snapshot.isSynced) this.reloadSubject.next();
      })
    );

    this.subscriptions.push(
      this.client.models.Message.onCreate().subscribe({
        next: async (msg) => {
          const channelId = msg.channelId;
          const { data: uc } = await this.client.models.UserChannel.get({ userCognitoId, channelId });
          if (uc) this.reloadSubject.next();  // Reload recent if user's channel
        },
        error: err => console.error('Message onCreate error:', err)
      })
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}