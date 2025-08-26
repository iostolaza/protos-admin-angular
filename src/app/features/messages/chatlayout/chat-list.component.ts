import { Component, inject, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';

interface ChatItem { id: string; name: string; snippet?: string; avatar?: string; timestamp?: Date; }

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './chat-list.component.html',
})
export class ChatListComponent {
  chats = input<ChatItem[]>([]);
  @Output() chatSelected = new EventEmitter<ChatItem>();
}
