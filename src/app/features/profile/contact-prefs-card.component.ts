/*
 * ContactPrefsCardComponent: Editable card for contact preferences.
 * Uses reactive form, subscribes to service.
 */
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-contact-prefs-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card p-6 rounded-lg shadow-md">
      <h2 class="text-lg font-semibold mb-4">Contact Preferences</h2>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center">
              <input type="checkbox" formControlName="email" class="mr-2" />
              <label>Email</label>
            </div>
            <div class="flex items-center">
              <input type="checkbox" formControlName="push" class="mr-2" />
              <label>Push Notifications</label>
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" (click)="toggleEdit()" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded">Save</button>
          </div>
        </form>
      } @else if (user) {
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Email:</strong> {{ user.contactPrefs.email ? 'Enabled' : 'Disabled' }}</div>
          <div><strong>Push Notifications:</strong> {{ user.contactPrefs.push ? 'Enabled' : 'Disabled' }}</div>
        </div>
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-white rounded">Edit</button>
      }
    </div>
  `,
})
export class ContactPrefsCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: User | null = null;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.form = this.fb.group({
      email: [false],
      push: [false],
    });
    this.userService.user$.subscribe(u => {
      this.user = u;
      this.form.patchValue(u?.contactPrefs || {});
    });
  }

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  save() {
    if (this.form.valid && this.user) {
      const updatedPrefs = { ...this.user.contactPrefs, ...this.form.value };
      const updated = { ...this.user, contactPrefs: updatedPrefs };
      this.userService.save(updated);
      this.toggleEdit();
    }
  }
}
