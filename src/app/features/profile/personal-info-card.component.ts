
/* Edited personal info card: Semantic classes, image upload. */

import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';

@Component({
  selector: 'app-personal-info-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card text-card-foreground p-6 rounded-lg shadow-custom border border-border flex flex-col h-full">
      <h2 class="text-xl font-bold mb-4 text-primary">Personal Information</h2>
      <div class="mb-4">
          <img [src]="profileImageUrl || '/assets/profile/avatar-default.svg'" alt="Profile" class="w-20 h-20 rounded-full" aria-label="Profile image">
        @if (editMode()) {
          <input type="file" (change)="uploadImage($event)" accept="image/*" aria-label="Upload profile image" class="mt-2">
        }
      </div>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-muted-foreground">First Name</label>
              <input formControlName="firstName" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Last Name</label>
              <input formControlName="lastName" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Username</label>
              <input formControlName="username" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Email</label>
              <input formControlName="email" type="email" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm text-muted-foreground">Access Level</label>
              <input formControlName="accessLevel" class="w-full p-2 border border-border rounded bg-muted text-foreground" />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" (click)="toggleEdit()" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-muted">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Save</button>
          </div>
        </form>
      } @else {
        @if (user) {
          <div class="grid grid-cols-2 gap-4 text-foreground">
            <div><strong class="text-muted-foreground">First Name:</strong> <span class="text-foreground">{{ user.firstName }}</span></div>
            <div><strong class="text-muted-foreground">Last Name:</strong> <span class="text-foreground">{{ user.lastName }}</span></div>
            <div><strong class="text-muted-foreground">Username:</strong> <span class="text-foreground">{{ user.username }}</span></div>
            <div><strong class="text-muted-foreground">Email:</strong> <span class="text-foreground">{{ user.email }}</span></div>
            <div class="col-span-2"><strong class="text-muted-foreground">Access Level:</strong> <span class="text-foreground">{{ user.accessLevel }}</span></div>
          </div>
        }
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Edit</button>
      }
    </div>
  `,
})
export class PersonalInfoCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: UserProfile | null = null;
  profileImageUrl: string | null = null;

constructor(private fb: FormBuilder, private userService: UserService) {
  this.form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    accessLevel: [{ value: '', disabled: true }],
  });
  effect(() => {
    const u = this.userService.user$();
    this.user = u;
    this.form.patchValue(u || {});
    this.profileImageUrl = u?.profileImageUrl || '/assets/profile/avatar-default.svg';
  });
}
  toggleEdit() {
    this.editMode.update(m => !m);
  }

  async save() {
    if (this.form.valid && this.user) {
      const updated = { ...this.user, ...this.form.getRawValue() };
      await this.userService.save(updated);
      this.toggleEdit();
    }
  }

  async uploadImage(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file && this.user) {
      const key = await this.userService.uploadProfileImage(file);
      if (key) {
        const updated = { ...this.user, profileImageKey: key };
        await this.userService.save(updated);
      }
    }
  }
}