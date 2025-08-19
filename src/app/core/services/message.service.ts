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

  // Get current user ID
  async getCurrentUserId(): Promise<string> {
    const { userId } = await getCurrentUser();
    return userId;
  }

  // Fetch contacts (all users except self)
  async getContacts(): Promise<Schema['User']['type'][]> {
    const currentUserId = await this.getCurrentUserId();
    const { data } = await this.client.models.User.list();
    return data.filter(user => user.id !== currentUserId);
  }

  // Get or create 1:1 channel with a contact (extend for groups)
  async getOrCreateChannel(contactId: string): Promise<Schema['Channel']['type']> {
    const currentUserId = await this.getCurrentUserId();
    // Query existing channels where members are exactly [current, contact]
    const { data: userChannels } = await this.client.models.UserChannel.list({
      filter: { or: [{ userId: { eq: currentUserId } }, { userId: { eq: contactId } }] },
    });
    // Find channel with exactly these two users (simplified; group by channelId)
    const potentialChannel = userChannels.reduce((acc, uc) => {
      acc[uc.channelId] = (acc[uc.channelId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const channelId = Object.keys(potentialChannel).find(id => potentialChannel[id] === 2);

    if (channelId) {
      const { data } = await this.client.models.Channel.get({ id: channelId });
      if (!data) {
        throw new Error('Channel not found');
      }
      return data;
    }

    // Create new channel if not found
    const { data: newChannel } = await this.client.models.Channel.create({ name: `Chat with ${contactId}` });
    if (!newChannel) {
      throw new Error('Failed to create channel');
    }
    await this.client.models.UserChannel.create({ userId: currentUserId, channelId: newChannel.id });
    await this.client.models.UserChannel.create({ userId: contactId, channelId: newChannel.id });
    return newChannel;
  }

  // Fetch messages for a channel, mark as read
  async getMessages(channelId: string): Promise<Schema['Message']['type'][]> {
    const currentUserId = await this.getCurrentUserId();
    const { data: messages } = await this.client.models.Message.list({
      filter: { channelId: { eq: channelId } },
    });
    // Mark unread messages as read (update readBy)
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

  // Subscribe to new messages in a channel
  subscribeMessages(channelId: string, onNewMessage: (msg: Schema['Message']['type']) => void) {
    return this.client.models.Message.observeQuery({
      filter: { channelId: { eq: channelId } },
    }).subscribe({
      next: ({ items }) => {
        const newMsg = items[items.length - 1]; // Latest
        if (newMsg) onNewMessage(newMsg);
      },
    });
  }

  // Send message
  async sendMessage(channelId: string, content: string, attachment?: string) {
    const currentUserId = await this.getCurrentUserId();
    await this.client.models.Message.create({
      content,
      senderId: currentUserId,
      channelId,
      timestamp: new Date().toISOString(),
      attachment,
      readBy: [currentUserId], // Sender has read it
    });
  }

  // Upload file/attachment and get S3 key
  async uploadAttachment(file: File): Promise<string> {
    const currentUserId = await this.getCurrentUserId();
    const result = await uploadData({
      path: `profile/${currentUserId}/attachments/${file.name}`,
      data: file,
    }).result;
    return result.path;
  }

  // Get avatar URL from S3
  async getAvatarUrl(profileImageKey: string): Promise<string> {
    const { url } = await getUrl({ path: profileImageKey });
    return url.toString();
  }
}