// src/app/features/ticket-management/edit-team/edit-team.component.ts

import { Component, Input, Output, OnInit, OnDestroy, signal, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule, FormGroup } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import type { Schema } from '../../../../../amplify/data/resource';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';
import { Subject, takeUntil } from 'rxjs';
import { FlatTeam } from '../../../core/models/tickets.model';
import { getCurrentUser } from 'aws-amplify/auth';  // Added import

type UserType = Schema['User']['type'];

@Component({
  selector: 'app-team-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, AngularSvgIconModule],
  templateUrl: './edit-team.component.html',
})
export class TeamEditComponent implements OnInit, OnDestroy {
  @Input() team!: FlatTeam;
  @Output() update = new EventEmitter<FlatTeam>();
  @Output() cancel = new EventEmitter<void>();

  members = signal<UserType[]>([]);
  users = signal<UserType[]>([]);
  selectedUserId = '';
  errorMessage = signal<string | null>(null);
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
      name: [this.team.name, Validators.required],
      description: [this.team.description || ''],
    });

    try {
      await this.loadMembers();
    } catch (err) {
      console.error('Load members error:', err);
      this.errorMessage.set('Failed to load members: ' + (err as Error).message);
    }

    try {
      const allUsers = await this.userService.getAllUsers();
      this.users.set(
        allUsers.filter(
          (u) => !this.members().some((m) => m.cognitoId === u.cognitoId)
        )
      );
    } catch (err) {
      console.error('Load all users error:', err);
      this.errorMessage.set('Failed to load users: ' + (err as Error).message);
    }

    this.ticketService
      .observeTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadMembers());
  }

  private async loadMembers() {
    const members = await this.ticketService.getTeamMembers(this.team.id);
    this.members.set(members || []); // Ensure array
  }

  async addMember() {
    if (!this.selectedUserId) return;
    try {
      const { userId } = await getCurrentUser(); // Ensure auth context
      await this.ticketService.addTeamMember(this.team.id, this.selectedUserId);
      await this.loadMembers();
      this.users.update((curr) =>
        curr.filter((u) => u.cognitoId !== this.selectedUserId)
      );
      this.selectedUserId = '';
      this.errorMessage.set(null);
    } catch (err) {
      console.error('Add member error:', err);
      this.errorMessage.set('Failed to add member: ' + (err as Error).message);
    }
  }

  async removeMember(userId: string) {
    if (confirm('Remove member?')) {
      try {
        await this.ticketService.deleteTeamMember(this.team.id, userId);
        await this.loadMembers();
        this.errorMessage.set(null);
      } catch (err) {
        console.error('Remove member error:', err);
        this.errorMessage.set('Failed to remove member: ' + (err as Error).message);
      }
    }
  }

  async updateTeam() {
    if (this.form.invalid) return;
    try {
      const updatedData = {
        ...this.team,
        name: this.form.value.name,
        description: this.form.value.description || null,
        updatedAt: new Date().toISOString(),
      };
      await this.ticketService.updateTeam(updatedData);
      this.update.emit(updatedData as FlatTeam);
      this.errorMessage.set(null);
    } catch (err) {
      console.error('Update team error:', err);
      this.errorMessage.set('Failed to update team: ' + (err as Error).message);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}