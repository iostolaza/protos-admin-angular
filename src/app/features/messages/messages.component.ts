import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../core/services/message.service'; // Adjusted path based on your structure
import type { Schema } from '../../../../amplify/data/resource'; // Adjust path if needed
import { Subscription } from 'rxjs';

// Extended type for contacts with computed avatar URL
type Contact = Schema['User']['type'] & {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  id: string; // Implicit in Amplify models
  avatar?: string;
  // Add other fields if needed for type safety
};

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatToolbarModule,
    FormsModule
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Messages implements OnInit, OnDestroy {
  private messageService: MessageService;
  private cdr: ChangeDetectorRef;

  contacts: Contact[] = [];
  messages: Schema['Message']['type'][] = [];
  selectedChannelId: string | null = null;
  selectedContact: string = '';
  selectedAvatar: string = '';
  subscription: Subscription | undefined;
  currentUserId: string = '';
  newMessage: string = '';
  file: File | null = null;

  constructor(messageService: MessageService, cdr: ChangeDetectorRef) {
    this.messageService = messageService;
    this.cdr = cdr;
  }

  async ngOnInit() {
    try {
      this.currentUserId = await this.messageService.getCurrentUserId();
      const rawContacts = await this.messageService.getContacts();
      this.contacts = await Promise.all(
        rawContacts.map(async (c) => ({
          ...c,
          avatar: c.profileImageKey ? await this.messageService.getAvatarUrl(c.profileImageKey) : 'default.png',
        }))
      );
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  }

  async selectContact(contact: Contact) {
    this.selectedContact = `${contact.firstName} ${contact.lastName}`;
    this.selectedAvatar = contact.avatar || 'default.png';
    try {
      const channel = await this.messageService.getOrCreateChannel(contact.id);
      this.selectedChannelId = channel.id;
      this.messages = await this.messageService.getMessages(channel.id);
      // Subscribe for real-time
      this.subscription = this.messageService.subscribeMessages(channel.id, (newMsg) => {
        this.messages = [...this.messages, newMsg]; // Immutable update for OnPush
        this.cdr.detectChanges();
      });
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error selecting contact:', error);
    }
  }

  async sendMessage() {
    if (this.newMessage.trim() && this.selectedChannelId) {
      try {
        await this.messageService.sendMessage(this.selectedChannelId, this.newMessage);
        this.newMessage = '';
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error sending message:', error);
      }
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
      try {
        const attachment = await this.messageService.uploadAttachment(this.file);
        await this.messageService.sendMessage(this.selectedChannelId, this.newMessage, attachment);
        this.file = null;
        this.newMessage = '';
        this.cdr.detectChanges();
      } catch (error) {
        console.error('Error sending file:', error);
      }
    }
  }

  // Sync helper to get avatar for messages (uses preloaded contacts)
  getAvatarForMessage(senderId: string): string {
    const sender = this.contacts.find(c => c.id === senderId);
    return sender?.avatar || 'default.png';
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }
}