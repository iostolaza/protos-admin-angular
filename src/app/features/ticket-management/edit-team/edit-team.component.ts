// src/app/features/ticket-management/edit-team/edit-team.component.ts

import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule, FormGroup } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import type { Schema } from '../../../../../amplify/data/resource';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';
import { Subject, takeUntil } from 'rxjs';
import { FlatTeam } from '../../../core/models/tickets.model';

type UserType = Schema['User']['type'];

@Component({
  selector: 'app-team-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AngularSvgIconModule],
  templateUrl: './edit-team.component.html',
})
export class TeamEditComponent implements OnInit, OnDestroy {
  @Input() team!: FlatTeam;

  members = signal<UserType[]>([]);
  users = signal<UserType[]>([]);
  selectedUserId = '';
  errorMessage = signal('');
  getIconPath = getIconPath;

  private destroy$ = new Subject<void>();
  form!: FormGroup;  

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private userService: UserService
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
    });

    this.form.patchValue({
      name: this.team.name,
      description: this.team.description || '',
    });

    await this.loadMembers();

    const allUsers = await this.userService.getAllUsers();
    this.users.set(
      allUsers.filter(
        (u) => !this.members().some((m) => m.cognitoId === u.cognitoId)
      )
    );

    this.ticketService
      .observeTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadMembers());
  }

  private async loadMembers() {
    const members = await this.ticketService.getTeamMembers(this.team.id);
    this.members.set(members);
  }

  async addMember() {
    if (!this.selectedUserId) return;
    try {
      await this.ticketService.addTeamMember(this.team.id, this.selectedUserId);
      await this.loadMembers();

      this.users.update((curr) =>
        curr.filter((u) => u.cognitoId !== this.selectedUserId)
      );

      this.selectedUserId = '';
      this.errorMessage.set('');
    } catch {
      this.errorMessage.set('Failed to add member');
    }
  }

  async removeMember(userId: string) {
    if (confirm('Remove member?')) {
      try {
        await this.ticketService.deleteTeamMember(this.team.id, userId);
        await this.loadMembers();
        this.errorMessage.set('');
      } catch {
        this.errorMessage.set('Failed to remove member');
      }
    }
  }

  async updateTeam() {
    if (this.form.invalid) return;
    try {
      await this.ticketService.updateTeam({
        id: this.team.id,
        name: this.form.value.name!,
        description: this.form.value.description || null,
        updatedAt: new Date().toISOString(),
      });
      this.errorMessage.set('');
    } catch {
      this.errorMessage.set('Failed to update team');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}