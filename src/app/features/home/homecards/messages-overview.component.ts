import { Component, inject, OnInit, signal } from '@angular/core';
import { MessageService } from '../../../core/services/message.service';

@Component({
  selector: 'app-messages-overview',
  standalone: true,
  imports: [],
  template: `
    <div class="rounded-lg bg-card flex items-center justify-center text-center w-full h-full">
      <div>
        <h3>Messages Overview</h3>
        <p>Unread: {{ unread() }}</p>
      </div>
    </div>
  `,
})
export class MessagesOverviewComponent implements OnInit {
  private messageService = inject(MessageService);
  unread = signal(0);

  async ngOnInit() {
    this.unread.set(5);
    // this.unread.set(await this.messageService.getUnreadCount() || 5);
  }
}
