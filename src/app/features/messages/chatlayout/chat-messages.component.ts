import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatePipe } from '@angular/common';

interface Message { text: string; isSelf?: boolean; timestamp?: Date; read?: boolean; }

@Component({
  selector: 'app-chat-messages',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './chat-messages.component.html',
})
export class ChatMessagesComponent {
  messages = input<Message[]>([]);

  trackByTimestamp(index: number, msg: Message): Date | undefined {
    return msg.timestamp;
  }
}
