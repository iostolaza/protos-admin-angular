// src/app/core/services/message.service.ts
import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../amplify/data/resource';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const client = generateClient<Schema>();

interface ChatItem { id: string; name: string; snippet?: string; avatar?: string; timestamp?: Date; }
interface Message { text: string; sender: string; isSelf?: boolean; timestamp?: Date; read?: boolean; }

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private client = generateClient<Schema>();
  private recentChats = signal<ChatItem[]>([]);
  private messages = signal<Message[]>([]);
  private searchQuery = signal<string>('');
  private selectedChannel = signal<string | null>(null);

  getRecentChats() { return this.recentChats.asReadonly(); }
  getMessages() { return this.messages.asReadonly(); }
  getSearchQuery() { return this.searchQuery.asReadonly(); }
  setSearchQuery(value: string) { this.searchQuery.set(value); }
  setSelectedChannel(id: string) { this.selectedChannel.set(id); }

  async getCurrentUserId(): Promise<string> {
    const { userId } = await getCurrentUser();
    return userId;
  }

  async getUserChannels(userId: string): Promise<Schema['Channel']['type'][]> {
    const { data: userChannels } = await this.client.models.UserChannel.list({ filter: { userId: { eq: userId } } });
    const channelIds = userChannels.map(uc => uc.channelId);
    const channels = await Promise.all(channelIds.map(id => this.client.models.Channel.get({ id })));
    return channels.map(c => c.data!).filter(Boolean);
  }

  async getOtherUserId(channelId: string, currentUserId: string): Promise<string> {
    const { data: userChannels } = await this.client.models.UserChannel.list({ filter: { channelId: { eq: channelId } } });
    const userIds = userChannels.map(uc => uc.userId);
    return userIds.find(id => id !== currentUserId) || '';
  }

  async getUserById(userId: string): Promise<Schema['User']['type']> {
    const { data } = await this.client.models.User.get({ id: userId });
    if (!data) throw new Error('User not found');
    return data;
  }

  async getLastMessage(channelId: string): Promise<Schema['Message']['type'] | null> {
    const { data } = await this.client.models.Message.messagesByChannelAndTimestamp(
      { channelId },
      { sortDirection: 'DESC', limit: 1 }
    );
    return data?.[0] ?? null;
  }

  async loadRecentChats() {
    try {
      const userId = await this.getCurrentUserId();
      const channels = await this.getUserChannels(userId);
      const chats: ChatItem[] = await Promise.all(channels.map(async (channel: Schema['Channel']['type']) => {
        const otherUserId = await this.getOtherUserId(channel.id, userId);
        const otherUser = await this.getUserById(otherUserId);
        const lastMsg = await this.getLastMessage(channel.id);
        return {
          id: channel.id,
          name: `${otherUser.firstName} ${otherUser.lastName}`,
          snippet: lastMsg?.content,
          avatar: await this.getAvatarUrl(otherUser.profileImageKey || ''),
          timestamp: lastMsg?.timestamp ? new Date(lastMsg.timestamp) : undefined
        };
      }));
      chats.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
      this.recentChats.set(chats);
    } catch (error) {
      console.error('Load recent chats error:', error);
      this.recentChats.set([]); // Fallback
    }
  }

  async loadMessages(channelId: string) {
    try {
      const messages = await this.fetchMessages(channelId);
      const currentUserId = await this.getCurrentUserId();
      const mapped: Message[] = messages.map(msg => ({
        text: msg.content,
        sender: msg.senderId,
        isSelf: msg.senderId === currentUserId,
        timestamp: new Date(msg.timestamp),
        read: msg.readBy?.includes(currentUserId)
      }));
      this.messages.set(mapped);
    } catch (error) {
      console.error('Load messages error:', error);
      this.messages.set([]); // Fallback
    }
  }

  async getContacts(): Promise<Schema['User']['type'][]> {
    const currentUserId = await this.getCurrentUserId();
    const { data } = await this.client.models.User.list();
    return data.filter(user => user.id !== currentUserId);
  }

  async getOrCreateChannel(contactId: string): Promise<Schema['Channel']['type']> {
    const currentUserId = await this.getCurrentUserId();
    const { data: userChannels } = await this.client.models.UserChannel.list({
      filter: { or: [{ userId: { eq: currentUserId } }, { userId: { eq: contactId } }] },
    });
    const potentialChannel = userChannels.reduce((acc, uc) => {
      acc[uc.channelId] = (acc[uc.channelId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const channelId = Object.keys(potentialChannel).find(id => potentialChannel[id] === 2);
    if (channelId) {
      const { data } = await this.client.models.Channel.get({ id: channelId });
      if (!data) throw new Error('Channel not found');
      return data;
    }
    const { data: newChannel } = await this.client.models.Channel.create({ name: `Chat with ${contactId}` });
    if (!newChannel) throw new Error('Failed to create channel');
    await this.client.models.UserChannel.create({ userId: currentUserId, channelId: newChannel.id });
    await this.client.models.UserChannel.create({ userId: contactId, channelId: newChannel.id });
    return newChannel;
  }

  async fetchMessages(channelId: string): Promise<Schema['Message']['type'][]> {
    const currentUserId = await this.getCurrentUserId();
    const { data: messages } = await this.client.models.Message.list({
      filter: { channelId: { eq: channelId } },
    });
    for (const msg of messages) {
      if (!msg.readBy?.includes(currentUserId)) {
        await this.client.models.Message.update({
          id: msg.id,
          readBy: [...(msg.readBy || []), currentUserId],
        });
      }
    }
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

subscribeMessages(channelId: string | null, onNewMessage: (msg: Schema['Message']['type']) => void): Observable<{ items: Schema['Message']['type'][] }> {
    const filter = channelId ? { channelId: { eq: channelId } } : undefined;
    return this.client.models.Message.observeQuery({ filter }).pipe(
      tap((snapshot: { items: Schema['Message']['type'][] }) => {
        const newMsg = snapshot.items[snapshot.items.length - 1];
        if (newMsg) onNewMessage(newMsg);
      })
    );
  }

  async sendMessage(channelId: string, content: string, attachment?: string) {
    const currentUserId = await this.getCurrentUserId();
    await this.client.models.Message.create({
      content,
      senderId: currentUserId,
      channelId,
      timestamp: new Date().toISOString(),
      attachment,
      readBy: [currentUserId],
    });
  }

  async uploadAttachment(file: File): Promise<string> {
    try {
      const path = ({ identityId }: { identityId?: string }) => `profile/${identityId || ''}/attachments/${file.name}`;
      const result = await uploadData({
        path,
        data: file,
      }).result;
      return result.path;
    } catch (error) {
      console.error('Upload attachment error:', error);
      throw error;
    }
  }

  async getAvatarUrl(profileImageKey: string): Promise<string> {
    if (!profileImageKey) {
      return 'assets/profile/avatar-default.svg';
    }
    try {
      const { url } = await getUrl({ path: profileImageKey });
      return url.toString();
    } catch (error) {
      console.error('Get avatar URL error:', error);
      return 'assets/profile/avatar-default.svg';
    }
  }

  async deleteChat(channelId: string) {
    try {
      const userId = await this.getCurrentUserId();
      const { data: userChannels } = await this.client.models.UserChannel.list({
        filter: { userId: { eq: userId }, channelId: { eq: channelId } },
      });
      if (userChannels.length > 0) {
        await this.client.models.UserChannel.delete({ id: userChannels[0].id });
      }
      await this.loadRecentChats();
    } catch (error) {
      console.error('Delete chat error:', error);
    }
  }
}