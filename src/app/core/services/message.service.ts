
import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../amplify/data/resource';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

const client = generateClient<Schema>();

interface ChatItem { id: string; name: string; snippet?: string; avatar?: string; timestamp?: Date; }
interface Message { text: string; sender: string; senderAvatar?: string; isSelf?: boolean; timestamp?: Date; read?: boolean; }

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

  getRecentChats() { return this.recentChats.asReadonly(); }
  getMessages() { return this.messages.asReadonly(); }
  getSearchQuery() { return this.searchQuery.asReadonly(); }
  setSearchQuery(value: string) { this.searchQuery.set(value); }
  setSelectedChannel(id: string) { this.selectedChannel.set(id); }

  async getCurrentUserId(): Promise<string> {
    const { userId } = await getCurrentUser();
    console.log('Current user ID:', userId);
    return userId;
  }

  async getUserChannels(userId: string): Promise<Schema['Channel']['type'][]> {
    const { data: userChannels, errors } = await this.client.models.UserChannel.list({ filter: { userId: { eq: userId } } });
    console.log('User channels response:', { userChannels, errors });
    const channelIds = userChannels.map(uc => uc.channelId);
    const channels = await Promise.all(channelIds.map(async (id) => {
      const { data, errors } = await this.client.models.Channel.get({ id });
      console.log('Channel get response:', { id, data, errors });
      return data;
    }));
    return channels.filter((c): c is Schema['Channel']['type'] => c !== null);
  }

  async getOtherUserId(channelId: string, currentUserId: string): Promise<string> {
    const { data: userChannels, errors } = await this.client.models.UserChannel.list({ filter: { channelId: { eq: channelId } } });
    console.log('Other user channels response:', { userChannels, errors });
    const userIds = userChannels.map(uc => uc.userId);
    return userIds.find(id => id !== currentUserId) || '';
  }

  async getUserById(userId: string): Promise<Schema['User']['type']> {
    if (this.userCache.has(userId)) return this.userCache.get(userId)!;
    const { data, errors } = await this.client.models.User.get({ id: userId });
    console.log('User by ID response:', { userId, data, errors });
    if (!data) throw new Error('User not found');
    this.userCache.set(userId, data);
    return data;
  }

  async deleteMessage(id: string): Promise<void> {
    const { errors } = await this.client.models.Message.delete({ id });
    console.log('Delete message response:', { id, errors });
  }

  async getLastMessage(channelId: string): Promise<Schema['Message']['type'] | null> {
    const { data, errors } = await this.client.models.Message.messagesByChannelAndTimestamp(
      { channelId },
      { sortDirection: 'DESC', limit: 1 }
    );
    console.log('Last message response:', { channelId, data, errors });
    return data?.[0] ?? null;
  }

  async loadRecentChats() {
    try {
      const userId = await this.getCurrentUserId();
      const channels = await this.getUserChannels(userId);
      const chats: ChatItem[] = await Promise.all(channels.map(async (channel) => {
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
      console.log('Recent chats loaded:', chats);
      this.recentChats.set(chats);
    } catch (error) {
      console.error('Load recent chats error:', error);
      this.recentChats.set([]);
    }
  }

  async loadMessages(channelId: string) {
    try {
      const messages = await this.fetchMessages(channelId);
      const currentUserId = await this.getCurrentUserId();
      const mapped: Message[] = await Promise.all(
        messages.map(async (msg) => {
          const sender = await this.getUserById(msg.senderId);
          return {
            text: msg.content,
            sender: `${sender.firstName} ${sender.lastName}`,
            senderAvatar: await this.getAvatarUrl(sender.profileImageKey || ''),
            isSelf: msg.senderId === currentUserId,
            timestamp: new Date(msg.timestamp),
            read: msg.readBy?.includes(currentUserId),
          };
        })
      );
      console.log('Messages loaded:', mapped);
      this.messages.set(mapped);
    } catch (error) {
      console.error('Load messages error:', error);
      this.messages.set([]);
    }
  }

  async searchChats(query: string): Promise<ChatItem[]> {
    try {
      const userId = await this.getCurrentUserId();
      const channels = await this.getUserChannels(userId);
      const chats: ChatItem[] = await Promise.all(channels.map(async (channel) => {
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
      const filteredChats = chats.filter(chat =>
        chat.name.toLowerCase().includes(query.toLowerCase()) ||
        (chat.snippet && chat.snippet.toLowerCase().includes(query.toLowerCase()))
      );
      console.log('Search chats result:', filteredChats);
      return filteredChats.sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0));
    } catch (error) {
      console.error('Search chats error:', error);
      return [];
    }
  }

  async getContacts(): Promise<Schema['User']['type'][]> {
    const currentUserId = await this.getCurrentUserId();
    const { data, errors } = await this.client.models.User.list();
    console.log('Get contacts response:', { data, errors });
    return data.filter(user => user.id !== currentUserId);
  }

  async getOrCreateChannel(contactId: string): Promise<Schema['Channel']['type']> {
    const currentUserId = await this.getCurrentUserId();
    const { data: userChannels, errors } = await this.client.models.UserChannel.list({
      filter: { or: [{ userId: { eq: currentUserId } }, { userId: { eq: contactId } }] },
    });
    console.log('User channels for channel creation:', { userChannels, errors });
    const potentialChannel = userChannels.reduce((acc, uc) => {
      acc[uc.channelId] = (acc[uc.channelId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const channelId = Object.keys(potentialChannel).find(id => potentialChannel[id] === 2);
    if (channelId) {
      const { data, errors } = await this.client.models.Channel.get({ id: channelId });
      console.log('Existing channel response:', { channelId, data, errors });
      if (!data) throw new Error('Channel not found');
      return data;
    }
    const { data: newChannel, errors } = await this.client.models.Channel.create({ name: `Chat with ${contactId}` });
    console.log('Create channel response:', { newChannel, errors });
    if (!newChannel) throw new Error('Failed to create channel');
    await this.client.models.UserChannel.create({ userId: currentUserId, channelId: newChannel.id });
    await this.client.models.UserChannel.create({ userId: contactId, channelId: newChannel.id });
    return newChannel;
  }

  async fetchMessages(channelId: string): Promise<Schema['Message']['type'][]> {
    const currentUserId = await this.getCurrentUserId();
    const { data: messages, errors } = await this.client.models.Message.list({
      filter: { channelId: { eq: channelId } },
    });
    console.log('Fetch messages response:', { channelId, messages, errors });
    for (const msg of messages) {
      if (!msg.readBy?.includes(currentUserId)) {
        const { errors } = await this.client.models.Message.update({
          id: msg.id,
          readBy: [...(msg.readBy || []), currentUserId],
        });
        console.log('Update message readBy response:', { id: msg.id, errors });
      }
    }
    return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  subscribeMessages(channelId: string | null, onNewMessage: (msg: Schema['Message']['type']) => void): Observable<{ items: Schema['Message']['type'][] }> {
    const filter = channelId ? { channelId: { eq: channelId } } : undefined;
    return this.client.models.Message.observeQuery({ filter }).pipe(
      tap((snapshot: { items: Schema['Message']['type'][] }) => {
        const newMsg = snapshot.items[snapshot.items.length - 1];
        if (newMsg) {
          console.log('New message received:', newMsg);
          onNewMessage(newMsg);
        }
      })
    );
  }

  async sendMessage(channelId: string, content: string, attachment?: string) {
    const currentUserId = await this.getCurrentUserId();
    const { errors } = await this.client.models.Message.create({
      content,
      senderId: currentUserId,
      channelId,
      timestamp: new Date().toISOString(),
      attachment,
      readBy: [currentUserId],
    });
    console.log('Send message response:', { channelId, content, errors });
  }

  async uploadAttachment(file: File): Promise<string> {
    try {
      const path = ({ identityId }: { identityId?: string }) => `profile/${identityId || ''}/attachments/${file.name}`;
      const result = await uploadData({
        path,
        data: file,
      }).result;
      console.log('Upload attachment success:', result.path);
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
      console.log('Avatar URL:', url.toString());
      return url.toString();
    } catch (error) {
      console.error('Get avatar URL error:', error);
      return 'assets/profile/avatar-default.svg';
    }
  }

  async deleteChat(channelId: string) {
    try {
      const userId = await this.getCurrentUserId();
      const { data: userChannels, errors } = await this.client.models.UserChannel.list({
        filter: { userId: { eq: userId }, channelId: { eq: channelId } },
      });
      console.log('User channels for deletion:', { userChannels, errors });
      if (userChannels.length > 0) {
        const { errors } = await this.client.models.UserChannel.delete({ id: userChannels[0].id });
        console.log('Delete user channel response:', { id: userChannels[0].id, errors });
      }
      await this.loadRecentChats();
    } catch (error) {
      console.error('Delete chat error:', error);
    }
  }
}
