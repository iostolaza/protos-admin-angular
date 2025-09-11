import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../../../../amplify/data/resource';
import { AngularSvgIconModule } from 'angular-svg-icon';  // NEW
import { getIconPath } from '../../../core/services/icon-preloader.service';  // NEW

@Component({
  selector: 'app-generate-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularSvgIconModule],  // NEW: Add
  templateUrl: './generate-team.component.html',
})
export class GenerateTeamComponent implements OnInit {
  form!: FormGroup;
  users = signal<Schema['User']['type'][]>([]);
  errorMessage = signal('');
  getIconPath = getIconPath;  // NEW

  constructor(private fb: FormBuilder, private ticketService: TicketService, private userService: UserService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4)]],
      description: [''],
      inviteUserIds: this.fb.array([]),  // NEW: FormArray for multi
    });
  }

  get inviteUserIds(): FormArray { 
    return this.form.get('inviteUserIds') as FormArray;
  }

  addInvite(): void { 
    this.inviteUserIds.push(this.fb.control('', Validators.required));
  }

  removeInvite(index: number): void { 
    this.inviteUserIds.removeAt(index);
  }

  async ngOnInit() {
    try {
      const users = await this.userService.getAllUsers();
      this.users.set(users);
    } catch (err) {
      console.error('Load users error:', err);
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.errorMessage.set('Form invalid');
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
    } catch (err) {
      console.error('Submit error:', err);
      this.errorMessage.set('Failed to create team');
    }
  }
}