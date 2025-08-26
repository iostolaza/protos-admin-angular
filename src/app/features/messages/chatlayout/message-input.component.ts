import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './message-input.component.html',
})
export class MessageInputComponent {
  newMessage = '';
  file: File | null = null;
  @Output() send = new EventEmitter<string>();
  @Output() sendWithFile = new EventEmitter<{text: string, file: File}>();

  onSend() {
    if (this.file) {
      this.sendWithFile.emit({text: this.newMessage, file: this.file});
    } else if (this.newMessage.trim()) {
      this.send.emit(this.newMessage);
    }
    this.newMessage = '';
    this.file = null;
  }

  onFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      this.file = target.files[0];
    }
  }
}
