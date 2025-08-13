
/* Edited emergency contact card. */

import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';

@Component({
  selector: 'app-emergency-contact-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card text-card-foreground p-6 rounded-lg shadow-custom border border-border flex flex-col h-full">
      <h2 class="text-xl font-bold mb-4 text-primary">Emergency Contact</h2>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-muted-foreground">Name</label>
              <input formControlName="name" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Phone</label>
              <input formControlName="phone" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Email</label>
              <input formControlName="email" type="email" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm text-muted-foreground">Address</label>
              <input formControlName="address" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" (click)="toggleEdit()" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-muted">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Save</button>
          </div>
        </form>
      } @else {
        <div class="grid grid-cols-2 gap-4 text-foreground">
          <div><strong class="text-muted-foreground">Name:</strong> <span class="text-foreground">{{ user?.emergencyContact?.name }}</span></div>
          <div><strong class="text-muted-foreground">Phone:</strong> <span class="text-foreground">{{ user?.emergencyContact?.phone }}</span></div>
          <div><strong class="text-muted-foreground">Email:</strong> <span class="text-foreground">{{ user?.emergencyContact?.email }}</span></div>
          <div class="col-span-2"><strong class="text-muted-foreground">Address:</strong> <span class="text-foreground">{{ user?.emergencyContact?.address }}</span></div>
        </div>
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Edit</button>
      }
    </div>
  `,
})
export class EmergencyContactCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: UserProfile | null = null;

constructor(private fb: FormBuilder, private userService: UserService) {
  this.form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
  });
  effect(() => {
    const u = this.userService.user$();
    this.user = u;
    this.form.patchValue(u?.emergencyContact || {});
  });
}

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  async save() {
    if (this.form.valid && this.user) {
      const updatedContact = { ...this.user.emergencyContact, ...this.form.value };
      const updated = { ...this.user, emergencyContact: updatedContact };
      await this.userService.save(updated);
      this.toggleEdit();
    }
  }
}