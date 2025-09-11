import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { TicketService, FlatTeam } from '../../../core/services/ticket.service';
import { getCurrentUser } from 'aws-amplify/auth';
import { Subject, takeUntil } from 'rxjs';
import type { Schema } from '../../../../../amplify/data/resource';

@Component({
  selector: 'app-generate-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf],
  templateUrl: './generate-tickets.component.html',
})
export class GenerateTicketsComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  teams = signal<FlatTeam[]>([]);
  members = signal<Schema['User']['type'][]>([]);
  errorMessage = signal('');
  successMessage = signal('');
  loadingTeams = signal(true);
  loadingMembers = signal(false);
  private destroy$ = new Subject<void>();
  private currentUserId = '';

  constructor(private fb: FormBuilder, private ticketService: TicketService) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(4)]],
      labels: [''],
      description: ['', Validators.required],
      teamId: ['', Validators.required],
      assigneeId: [''],
      estimated: ['', [Validators.required, this.futureDateValidator]],
    });
  }

  futureDateValidator = (control: AbstractControl): ValidationErrors | null => {
    const date = new Date(control.value);
    const now = new Date();
    return date > now ? null : { pastDate: true };
  };

  async ngOnInit() {
    try {
      const { userId } = await getCurrentUser();
      this.currentUserId = userId;
      console.log('Current User ID:', this.currentUserId);
      await this.loadTeams();
    } catch (err) {
      console.error('Init error:', err);
      this.errorMessage.set('Failed to initialize form');
    }

    this.form.get('teamId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (teamId) => {
        console.log('Team ID changed:', teamId);
        if (teamId) {
          this.loadingMembers.set(true);
          try {
            const members = await this.ticketService.getTeamMembers(teamId);
            this.members.set(members);
            console.log('Members loaded for team:', members);
          } catch (err) {
            console.error('Load members error:', err);
            this.errorMessage.set('Failed to load members');
          } finally {
            this.loadingMembers.set(false);
          }
        } else {
          this.members.set([]);
        }
      });

    this.ticketService.observeTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Teams real-time update triggered');
        this.loadTeams();
      });
  }

  private async loadTeams(): Promise<void> {
    this.loadingTeams.set(true);
    try {
      console.log('Calling getTeams'); // Test log
      const { teams } = await this.ticketService.getTeams(); // Change to getTeams
      this.teams.set(teams);
      console.log('Teams loaded:', teams); // Test log
    } catch (err) {
      console.error('Load teams error:', err);
      this.errorMessage.set('Failed to load teams');
    } finally {
      this.loadingTeams.set(false);
    }
  }

  async submit() {
    if (this.form.invalid) {
      const errors = [];
      if (this.form.get('title')?.errors) errors.push('Title is required and must be at least 4 characters');
      if (this.form.get('description')?.errors) errors.push('Description is required');
      if (this.form.get('teamId')?.errors) errors.push('Team is required');
      if (this.form.get('estimated')?.hasError('pastDate')) errors.push('Estimated date must be in the future');
      this.errorMessage.set(`Form invalid: ${errors.join(', ')}`);
      console.log('Form invalid, value:', this.form.value);
      return;
    }
    this.successMessage.set('');
    this.errorMessage.set('');
    try {
      const { userId } = await getCurrentUser();
      const values = this.form.value;
      const ticket = {
        title: values.title,
        labels: values.labels ? [values.labels] : [],
        description: values.description,
        status: 'OPEN' as const,
        estimated: values.estimated,
        requesterId: userId,
        assigneeId: values.assigneeId || null,
        teamId: values.teamId,
      };
      await this.ticketService.createTicket(ticket);
      this.form.reset();
      this.successMessage.set('Ticket created successfully');
      console.log('Ticket created successfully');
    } catch (err) {
      console.error('Submit error:', err);
      this.errorMessage.set('Failed to create ticket');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}