import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MessageService } from '../../core/services/message.service';
import { UserService } from '../../core/services/user.service';
import { getIconPath } from '../../core/services/icon-preloader.service';
import type { Schema } from '../../../../amplify/data/resource';
import { Subscription } from 'rxjs';
import { getUrl } from 'aws-amplify/storage';

interface Conversation {
  channel: Schema['Channel']['type'];
  otherUser: { id: string; name: string; avatar?: string; email: string };
  lastMessage?: Schema['Message']['type'];
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule, MatSidenavModule, MatListModule, MatIconModule, MatInputModule, MatFormFieldModule,
    MatButtonModule, MatToolbarModule, FormsModule, MatProgressSpinnerModule, AngularSvgIconModule // Added
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Messages implements OnInit, OnDestroy {
  getIconPath = getIconPath;

  constructor(private messageService: MessageService, private userService: UserService, private cdr: ChangeDetectorRef) {}

  conversations: Conversation[] = [];
  filteredConversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  selectedChannelId: string | null = null;
  messages: Schema['Message']['type'][] = [];
  currentUserId: string = '';
  currentUserName: string = '';
  currentUserEmail: string = '';
  currentUserAvatar: string = '';
  newMessage: string = '';
  file: File | null = null;
  searchQuery: string = '';
  loadingMessages: boolean = false;
  subscriptions: Subscription[] = [];

  async ngOnInit() {
    try {
      this.currentUserId = await this.messageService.getCurrentUserId();
      const userProfile = this.userService.user$();
      if (userProfile) {
        this.currentUserName = `${userProfile.firstName} ${userProfile.lastName}`;
        this.currentUserEmail = userProfile.email;
        this.currentUserAvatar = userProfile.profileImageUrl || 'default.png';
      }
      await this.loadConversations();
      // Per-conversation real-time subs for sidebar updates
      this.conversations.forEach(conv => {
        const sub = this.messageService.subscribeMessages(conv.channel.id, (newMsg) => {
          this.updateConversationsOnNewMessage(newMsg);
          this.cdr.detectChanges();
        });
        this.subscriptions.push(sub);
      });
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  async loadConversations() {
    const channels = await this.messageService.getUserChannels(this.currentUserId);
    this.conversations = await Promise.all(channels.map(async (channel) => {
      const otherUserId = await this.messageService.getOtherUserId(channel.id, this.currentUserId);
      const otherUser = await this.messageService.getUserById(otherUserId);
      const lastMsg = await this.messageService.getLastMessage(channel.id);
      return {
        channel,
        otherUser: { id: otherUserId, name: `${otherUser.firstName} ${otherUser.lastName}`, avatar: await this.messageService.getAvatarUrl(otherUser.profileImageKey || ''), email: otherUser.email },
        lastMessage: lastMsg ?? undefined
      };
    }));
    this.conversations.sort((a, b) => (new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()));
    this.filteredConversations = [...this.conversations];
    this.cdr.detectChanges();
  }

  filterConversations() {
    this.filteredConversations = this.conversations.filter(conv =>
      conv.otherUser.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
      (conv.lastMessage?.content || '').toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    this.cdr.detectChanges();
  }

  async selectConversation(conv: Conversation) {
    this.selectedConversation = conv;
    this.selectedChannelId = conv.channel.id;
    this.loadingMessages = true;
    this.messages = await this.messageService.getMessages(conv.channel.id);
    this.loadingMessages = false;
    const sub = this.messageService.subscribeMessages(conv.channel.id, (newMsg) => {
      this.messages = [...this.messages, newMsg];
      this.cdr.detectChanges();
    });
    this.subscriptions.push(sub);
    this.cdr.detectChanges();
  }

  async sendMessage() {
    if (this.newMessage.trim() && this.selectedChannelId) {
      await this.messageService.sendMessage(this.selectedChannelId, this.newMessage);
      this.newMessage = '';
      this.cdr.detectChanges();
    }
  }

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.file = target.files[0];
      this.cdr.detectChanges();
    }
  }

  async sendWithFile() {
    if (this.file && this.selectedChannelId) {
      const attachment = await this.messageService.uploadAttachment(this.file);
      await this.messageService.sendMessage(this.selectedChannelId, this.newMessage, attachment);
      this.file = null;
      this.newMessage = '';
      this.cdr.detectChanges();
    }
  }

async getAttachmentUrl(path: string): Promise<string> {
    try {
      const { url } = await getUrl({ path, options: { expiresIn: 3600 } });
      return url.toString();
    } catch (error) {
      console.error('Get attachment URL error:', error);
      return '';  // Or fallback
    }
  }

  isImage(path: string): boolean {
    return /\.(jpg|jpeg|png|gif)$/i.test(path);
  }

  getFileName(path: string): string {
    return path.split('/').pop() || 'file';
  }

  getAvatarForMessage(senderId: string): string {
    const sender = this.conversations.find(c => c.otherUser.id === senderId)?.otherUser;
    return sender?.avatar || 'assets/default.png';
  }

  updateConversationsOnNewMessage(newMsg: Schema['Message']['type']) {
    const convIndex = this.conversations.findIndex(c => c.channel.id === newMsg.channelId);
    if (convIndex > -1) {
      this.conversations[convIndex].lastMessage = newMsg;
      this.conversations.sort((a, b) => (new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime()));
      this.filteredConversations = [...this.conversations];
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
