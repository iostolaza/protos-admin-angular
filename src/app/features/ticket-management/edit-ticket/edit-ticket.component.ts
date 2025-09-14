// src/app/features/ticket-management/edit-ticket/edit-ticket.component.ts

import { Component, Input, Output, EventEmitter, signal, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { TicketService } from '../../../core/services/ticket.service';
import { FlatTicket } from '../../../core/models/tickets.model';



@Component({
  selector: 'app-edit-ticket',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './edit-ticket.component.html',
})
export class EditTicketComponent implements OnInit {
  @Input() ticket!: FlatTicket;
  @Output() update = new EventEmitter<FlatTicket>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  errorMessage = signal<string | null>(null);
  users = signal<any[]>([]);

  constructor(private fb: FormBuilder, private ticketService: TicketService, private userService: UserService) {}

  async ngOnInit() {
    this.form = this.fb.group({
      title: [this.ticket.title, Validators.required],
      description: [this.ticket.description || ''],
      status: [this.ticket.status, Validators.required],
      assigneeId: [this.ticket.assigneeId || ''],
      estimated: [this.ticket.estimated ? new Date(this.ticket.estimated).toISOString().split('T')[0] : '', Validators.required],
    });
    await this.fetchUsers();
  }

  async fetchUsers() {
    const allUsers = await this.userService.getAllUsers();
    this.users.set(allUsers);
  }

  async updateTicket() {
    if (this.form.valid) {
      const updatedPayload = {
        id: this.ticket.id,
        title: this.form.value.title,
        description: this.form.value.description,
        status: this.form.value.status,
        assigneeId: this.form.value.assigneeId,
        estimated: new Date(this.form.value.estimated).toISOString(),
      };
      const updatedBackend = await this.ticketService.updateTicket(updatedPayload);
      if (updatedBackend) {
        const updated: FlatTicket = {
          ...this.ticket,
          ...updatedPayload,
        };
        this.update.emit(updated);
      }
    } else {
      this.errorMessage.set('Form invalid');
    }
  }
}