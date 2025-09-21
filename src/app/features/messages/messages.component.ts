// src/app/features/messages/messages.component.ts
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService } from '../../core/services/message.service';
import { UserService } from '../../core/services/user.service';
import { getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../amplify/data/resource';
import { UserProfileComponent } from './chatlayout/user-profile.component';
import { ChatSearchComponent } from './chatlayout/chat-search.component';
import { ChatListComponent } from './chatlayout/chat-list.component';
import { ChatHeaderComponent } from './chatlayout/chat-header.component';
import { ChatMessagesComponent } from './chatlayout/chat-messages.component';
import { MessageInputComponent } from './chatlayout/message-input.component';
import { ActivatedRoute } from '@angular/router';

interface ChatItem { id: string; name: string; snippet?: string; avatar?: string; timestamp?: Date; }
interface Message { id: string; text: string; sender: string; senderAvatar?: string; isSelf?: boolean; timestamp?: Date; read?: boolean; }  // Added id
interface Conversation {
  channel: { id: string };
  otherUser: { id: string; name: string; avatar?: string; email: string };
  lastMessage?: Schema['Message']['type'];
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, FormsModule, UserProfileComponent, ChatSearchComponent, ChatListComponent, ChatHeaderComponent, ChatMessagesComponent, MessageInputComponent],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesComponent implements OnInit, OnDestroy {
  private messageService = inject(MessageService);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  conversations = signal<Conversation[]>([]);
  filteredConversations = computed(() => this.conversations().filter((conv: Conversation) =>
    conv.otherUser.name.toLowerCase().includes(this.searchQuery().toLowerCase()) ||
    (conv.lastMessage?.content || '').toLowerCase().includes(this.searchQuery().toLowerCase())
  ));
  filteredChats = computed(() => this.filteredConversations().map((conv: Conversation) => ({
    id: conv.channel.id,
    name: conv.otherUser.name,
    snippet: conv.lastMessage?.content,
    avatar: conv.otherUser.avatar,
    timestamp: conv.lastMessage?.timestamp ? new Date(conv.lastMessage.timestamp) : undefined
  } as ChatItem)));
  messages = signal<Message[]>([]);
  selectedConversation = signal<Conversation | null>(null);
  searchQuery = signal<string>('');
  loadingMessages = signal<boolean>(false);
  newMessage = signal<string>('');
  file = signal<File | null>(null);
  currentUserId = '';
  private destroy$ = new Subject<void>();
  private chatSub: Subscription | null = null;
  private messageCache = new Map<string, Message[]>();
  subscriptions: Subscription[] = [];

  async ngOnInit() {
    try {
      this.currentUserId = await this.messageService.getCurrentUserId();
      await this.messageService.loadRecentChats();
      // Map to Conversation
      this.conversations.set(this.messageService.getRecentChats()().map((chat: ChatItem) => ({
        channel: { id: chat.id },
        otherUser: { id: '', name: chat.name, avatar: chat.avatar, email: '' },
        lastMessage: { content: chat.snippet || '', timestamp: chat.timestamp?.toISOString() || '' } as Schema['Message']['type']
      })));
      
      const channelId = this.route.snapshot.paramMap.get('channelId');
      if (channelId) {
        let chat = this.messageService.getRecentChats()().find(c => c.id === channelId);
        if (chat) {
          await this.selectConversation(chat);
        } else {
          console.error('Channel not found:', channelId);
        }
      }
      
      // Global sub only for recent chats updates
      this.subscriptions.push(this.messageService.subscribeMessages(null).pipe(takeUntil(this.destroy$)).subscribe());
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
  }

  async selectConversation(chat: ChatItem) {
    const conv = this.conversations().find((c: Conversation) => c.channel.id === chat.id);
    if (conv) {
      if (this.chatSub) {
        this.chatSub.unsubscribe();
        this.chatSub = null;
      }
      this.selectedConversation.set(conv);
      this.loadingMessages.set(true);
      try {
        const channelId = conv.channel.id;
        if (this.messageCache.has(channelId)) {
          this.messages.set(this.messageCache.get(channelId)!);
        } else {
          await this.messageService.loadMessages(channelId);
          const loadedMessages = this.messageService.getMessages()();
          this.messages.set(loadedMessages);
          this.messageCache.set(channelId, loadedMessages);
        }
        // Channel-specific sub sets full messages from snapshot
        this.chatSub = this.messageService.subscribeMessages(channelId).pipe(takeUntil(this.destroy$)).subscribe();
      } catch (error) {
        console.error('Load messages error:', error);
      } finally {
        this.loadingMessages.set(false);
      }
    }
  }

  async send(text: string) {
    this.newMessage.set(text);
    if (this.newMessage().trim() && this.selectedConversation()?.channel.id) {
      await this.messageService.sendMessage(this.selectedConversation()!.channel.id, this.newMessage());
      this.newMessage.set('');
    }
  }

  async sendWithFile(data: {text: string; file: File}) {
    this.newMessage.set(data.text);
    this.file.set(data.file);
    if (this.file() && this.selectedConversation()?.channel.id) {
      const attachment = await this.messageService.uploadAttachment(this.file()!);
      await this.messageService.sendMessage(this.selectedConversation()!.channel.id, this.newMessage(), attachment);
      this.newMessage.set('');
      this.file.set(null);
    }
  }

  async getAttachmentUrl(path: string): Promise<string> {
    try {
      const { url } = await getUrl({ path, options: { expiresIn: 3600 } });
      return url.toString();
    } catch (error) {
      console.error('Get attachment URL error:', error);
      return '';
    }
  }

  isImage(path: string): boolean {
    return /\.(jpg|jpeg|png|gif)$/i.test(path);
  }

  getFileName(path: string): string {
    return path.split('/').pop() || 'file';
  }

  trackByTimestamp(index: number, msg: Message): Date | undefined {
    return msg.timestamp;
  }

  updateConversationsOnNewMessage(newMsg: Schema['Message']['type']) {
    const conv = this.conversations().find((c: Conversation) => c.channel.id === newMsg.channelId);
    if (conv) {
      const updated = {...conv, lastMessage: newMsg};
      this.conversations.update((convs: Conversation[]) => convs.map((c: Conversation) => c.channel.id === newMsg.channelId ? updated : c).sort((a: Conversation, b: Conversation) => new Date(b.lastMessage?.timestamp || '0').getTime() - new Date(a.lastMessage?.timestamp || '0').getTime()));
    }
  }

  async deleteConversation(channelId: string) {
    if (confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      await this.messageService.deleteChat(channelId);
      this.conversations.update((convs: Conversation[]) => convs.filter((c: Conversation) => c.channel.id !== channelId));
      this.messageCache.delete(channelId);
      if (this.selectedConversation()?.channel.id === channelId) {
        this.selectedConversation.set(null);
        this.messages.set([]);
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.chatSub) this.chatSub.unsubscribe();
  }
}