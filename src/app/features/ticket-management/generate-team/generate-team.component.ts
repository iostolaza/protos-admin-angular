import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { getCurrentUser } from 'aws-amplify/auth';

@Component({
  selector: 'app-generate-team',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generate-team.component.html',
})
export class GenerateTeamComponent {
  form!: FormGroup;
  errorMessage = signal('');

  constructor(private fb: FormBuilder, private ticketService: TicketService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(4)]],
      description: [''],
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
      const team = {
        name: values.name,
        description: values.description || null,
        teamLeadId: userId,
      };
      await this.ticketService.createTeam(team);
      this.form.reset();
      this.errorMessage.set('');
    } catch (err) {
      console.error('Submit error:', err);
      this.errorMessage.set('Failed to create team');
    }
  }
}