
/* Edited contact prefs card. */

import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';

@Component({
  selector: 'app-contact-prefs-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card text-card-foreground p-6 rounded-lg shadow-custom border border-border flex flex-col h-full">
      <h2 class="text-xl font-bold mb-4 text-primary">Contact Preferences</h2>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center">
              <input type="checkbox" formControlName="email" class="mr-2 border-border" />
              <label class="text-foreground">Email</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" formControlName="push" class="mr-2 border-border" />
              <label class="text-foreground">Push Notifications</label>
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" (click)="toggleEdit()" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-muted">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Save</button>
          </div>
        </form>
      } @else if (user) {
        <div class="grid grid-cols-2 gap-4 text-foreground">
          <div><strong class="text-muted-foreground">Email:</strong> <span class="text-foreground">{{ user.contactPrefs.email ? 'Enabled' : 'Disabled' }}</span></div>
          <div><strong class="text-muted-foreground">Push Notifications:</strong> <span class="text-foreground">{{ user.contactPrefs.push ? 'Enabled' : 'Disabled' }}</span></div>
        </div>
        <div class="mt-4 flex justify-end">
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Edit</button>
        </div>
      }
    </div>
  `,
})
export class ContactPrefsCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: UserProfile | null = null;

constructor(private fb: FormBuilder, private userService: UserService) {
  this.form = this.fb.group({
    email: [false],
    push: [false],
  });
  effect(() => {
    const u = this.userService.user$();
    this.user = u;
    this.form.patchValue(u?.contactPrefs || {});
  });
}

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  async save() {
    if (this.form.valid && this.user) {
      const updatedPrefs = { ...this.user.contactPrefs, ...this.form.value };
      const updated = { ...this.user, contactPrefs: updatedPrefs };
      await this.userService.save(updated);
      this.toggleEdit();
    }
  }
}