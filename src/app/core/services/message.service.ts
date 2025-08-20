import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../amplify/data/resource';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private client = generateClient<Schema>();

  async getCurrentUserId(): Promise<string> {
    const { userId } = await getCurrentUser();
    return userId;
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

  async getMessages(channelId: string): Promise<Schema['Message']['type'][]> {
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

  subscribeMessages(channelId: string | null, onNewMessage: (msg: Schema['Message']['type']) => void) {
    const filter = channelId ? { channelId: { eq: channelId } } : undefined;
    return this.client.models.Message.observeQuery({ filter }).subscribe({
      next: ({ items }) => {
        const newMsg = items[items.length - 1];
        if (newMsg) onNewMessage(newMsg);
      },
    });
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
    const currentUserId = await this.getCurrentUserId();
    const result = await uploadData({
      path: `profile/${currentUserId}/attachments/${file.name}`,
      data: file,
    }).result;
    return result.path;
  }

  async getAvatarUrl(profileImageKey: string): Promise<string> {
    const { url } = await getUrl({ path: profileImageKey });
    return url.toString();
  }

  async getUserChannels(userId: string): Promise<Schema['Channel']['type'][]> {
    const { data: userChannels } = await this.client.models.UserChannel.list({ filter: { userId: { eq: userId } } });
    const channelIds = userChannels.map(uc => uc.channelId);
    const channels = await Promise.all(channelIds.map(id => this.client.models.Channel.get({ id })));
    return channels.map(c => c.data!).filter(Boolean);
  }

  async getUserById(userId: string): Promise<Schema['User']['type']> {
    const { data } = await this.client.models.User.get({ id: userId });
    if (!data) throw new Error('User not found');
    return data;
  }

  async getLastMessage(channelId: string): Promise<Schema['Message']['type'] | null> {
    const { data } = await this.client.queries.messagesByChannelAndTimestamp({
      channelId,
      sortDirection: 'DESC',
      limit: 1,
    });
    return data?.items[0] || null;
  }

  // Helper: Get other user ID for 1:1 channel
  async getOtherUserId(channelId: string, currentUserId: string): Promise<string> {
    const { data: userChannels } = await this.client.models.UserChannel.list({ filter: { channelId: { eq: channelId } } });
    const userIds = userChannels.map(uc => uc.userId);
    return userIds.find(id => id !== currentUserId) || '';
  }
}
