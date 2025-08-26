import { Component, input } from '@angular/core';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  templateUrl: './chat-header.component.html',
})
export class ChatHeaderComponent {
  recipient = input<string>('');
  avatar = input<string>('');
}
