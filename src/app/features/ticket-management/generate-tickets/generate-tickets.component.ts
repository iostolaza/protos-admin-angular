import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TicketService, FlatTeam } from '../../../core/services/ticket.service';
import { getCurrentUser } from 'aws-amplify/auth';
import { Subject, takeUntil } from 'rxjs';
import type { Schema } from '../../../../../amplify/data/resource';

@Component({
  selector: 'app-generate-tickets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generate-tickets.component.html',
})
export class GenerateTicketsComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  teams = signal<FlatTeam[]>([]);
  members = signal<Schema['User']['type'][]>([]);
  errorMessage = signal('');
  private destroy$ = new Subject<void>();

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
      const teams = await this.ticketService.getUserTeams(userId);
      this.teams.set(teams);
    } catch (err) {
      console.error('Init error:', err);
      this.errorMessage.set('Failed to load teams');
    }

    this.form.get('teamId')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (teamId) => {
        if (teamId) {
          try {
            const members = await this.ticketService.getTeamMembers(teamId);
            this.members.set(members);
          } catch (err) {
            console.error('Load members error:', err);
            this.errorMessage.set('Failed to load members');
          }
        } else {
          this.members.set([]);
        }
      });
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
        status: 'OPEN' as const,  // Explicit enum literal
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