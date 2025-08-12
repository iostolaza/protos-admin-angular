
/* Edited address card. */

import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card text-card-foreground p-6 rounded-lg shadow-custom">
      <h2 class="text-lg font-semibold mb-4 text-foreground">Address</h2>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm text-muted-foreground">Address Line 1</label>
              <input formControlName="line1" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">City</label>
              <input formControlName="city" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">State</label>
              <input formControlName="state" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">ZIP Code</label>
              <input formControlName="zip" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Country</label>
              <input formControlName="country" class="w-full p-2 border border-border rounded bg-background text-foreground" />
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
            <div class="col-span-2"><strong>Address Line 1:</strong> {{ user.address.line1 }}</div>
            <div><strong>City:</strong> {{ user.address.city }}</div>
            <div><strong>State:</strong> {{ user.address.state }}</div>
            <div><strong>ZIP Code:</strong> {{ user.address.zip }}</div>
            <div><strong>Country:</strong> {{ user.address.country }}</div>
          </div>
        }
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Edit</button>
      }
    </div>
  `,
})
export class AddressCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: User | null = null;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.form = this.fb.group({
      line1: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required],
    });
    this.userService.user$.subscribe(u => {
      this.user = u;
      this.form.patchValue(u?.address || {});
    });
  }

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  save() {
    if (this.form.valid && this.user) {
      const updatedAddress = { ...this.user.address, ...this.form.value };
      const updated = { ...this.user, address: updatedAddress };
      this.userService.save(updated);
      this.toggleEdit();
    }
  }
}