import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../../../amplify/data/resource';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';

@Component({
  selector: 'app-generate-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularSvgIconModule, NgIf],
  templateUrl: './generate-team.component.html',
})
export class GenerateTeamComponent implements OnInit {
  form!: FormGroup;
  users = signal<Schema['User']['type'][]>([]);
  errorMessage = signal('');
  loadingUsers = signal(true); 
  getIconPath = getIconPath;

  constructor(private fb: FormBuilder, private ticketService: TicketService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4)]],
      description: [''],
      inviteUserIds: this.fb.array([]),
    });
  }

  get inviteUserIds(): FormArray { 
    return this.form.get('inviteUserIds') as FormArray;
  }

  addInvite(): void { 
    this.inviteUserIds.push(this.fb.control('', Validators.required));
    console.log('Added invite, current FormArray:', this.inviteUserIds.controls);
  }

  removeInvite(index: number): void { 
    this.inviteUserIds.removeAt(index);
    console.log('Removed invite at index:', index);
  }

  async ngOnInit() {
    this.loadingUsers.set(true);
    try {
      const { users } = await this.ticketService.getAllUsers();
      this.users.set(users);
      console.log('Users loaded:', users); 
      if (users.length === 0) {
        this.errorMessage.set('No users available. Add users in Cognito first.');
      }
    } catch (err) {
      console.error('Load users error:', err);
      this.errorMessage.set('Failed to load users');
    } finally {
      this.loadingUsers.set(false);
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.errorMessage.set('Form invalid');
      console.log('Form invalid, value:', this.form.value); 
      return;
    }
    try {
      const { userId } = await getCurrentUser();
      const values = this.form.value;
      const team = {
        name: values.name,
        description: values.description || null,
        teamLeadId: userId,
      };
      const newTeam = await this.ticketService.createTeam(team);
      if (newTeam && values.inviteUserIds.length > 0) {
        for (const inviteId of values.inviteUserIds) {
          await this.ticketService.addTeamMember(newTeam.id, inviteId);
        }
      }
      this.form.reset();
      this.inviteUserIds.clear(); 
      this.errorMessage.set('');
      console.log('Team created successfully'); 
    } catch (err) {
      console.error('Submit error:', err);
      this.errorMessage.set('Failed to create team');
    }
  }
}