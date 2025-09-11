
// src/app/features/ticket-management/generate-tickets/generate-tickets.component.ts

import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common'; // Explicit NgIf import to resolve linter error
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TicketService, FlatTeam } from '../../../core/services/ticket.service';
import { getCurrentUser } from 'aws-amplify/auth';
import { Subject, takeUntil } from 'rxjs';
import type { Schema } from '../../../../../amplify/data/resource';

@Component({
  selector: 'app-generate-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf], // Add NgIf explicitly if linter persists
  templateUrl: './generate-tickets.component.html',
})
export class GenerateTicketsComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  teams = signal<FlatTeam[]>([]);
  members = signal<Schema['User']['type'][]>([]);
  errorMessage = signal('');
  loadingTeams = signal(true); // New: For loading state
  loadingMembers = signal(false); // New: For assignee loading
  private destroy$ = new Subject<void>();
  private currentUserId = '';  

  constructor(private fb: FormBuilder, private ticketService: TicketService) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(4)]],
      labels: [''],
      description: ['', Validators.required],
      teamId: ['', Validators.required],
      assigneeId: [''],
      estimated: ['', Validators.required],
    });
  }

  async ngOnInit() {
    try {
      const { userId } = await getCurrentUser();
      this.currentUserId = userId;  
      console.log('Current User ID:', this.currentUserId); // Test: Log user ID
      await this.loadTeams();  
    } catch (err) {
      console.error('Init error:', err);
      this.errorMessage.set('Failed to initialize form');
    }

    this.form.get('teamId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (teamId) => {
        console.log('Team ID changed:', teamId); // Test: Log team selection
        if (teamId) {
          this.loadingMembers.set(true);
          try {
            const members = await this.ticketService.getTeamMembers(teamId);
            this.members.set(members);
            console.log('Members loaded for team:', members); // Test: Log loaded members
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
      console.log('Calling getUserTeams with userId:', this.currentUserId); 
      const teams = await this.ticketService.getUserTeams(this.currentUserId);
      this.teams.set(teams);
      console.log('Teams loaded:', teams); 
    } catch (err) {
      console.error('Load teams error:', err);
      this.errorMessage.set('Failed to load teams');
    } finally {
      this.loadingTeams.set(false);
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
      const ticket = {
        title: values.title,
        labels: values.labels ? [values.labels] : [],
        description: values.description,
        status: 'OPEN' as const,
        estimated: values.estimated,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requesterId: userId,
        assigneeId: values.assigneeId || null,
        teamId: values.teamId,
      };
      await this.ticketService.createTicket(ticket);
      this.form.reset();
      this.errorMessage.set('');
      console.log('Ticket created successfully'); // Test: Log success
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