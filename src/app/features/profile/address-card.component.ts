
/* Edited address card. */

import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';


@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card text-card-foreground p-6 rounded-lg shadow-custom border border-border flex flex-col h-full">
      <h2 class="text-xl font-bold mb-4 text-primary">Address</h2>
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
            <div class="col-span-2"><strong class="text-muted-foreground">Address Line 1:</strong> <span class="text-foreground">{{ user.address.line1 }}</span></div>
            <div><strong class="text-muted-foreground">City:</strong> <span class="text-foreground">{{ user.address.city }}</span></div>
            <div><strong class="text-muted-foreground">State:</strong> <span class="text-foreground">{{ user.address.state }}</span></div>
            <div><strong class="text-muted-foreground">ZIP Code:</strong> <span class="text-foreground">{{ user.address.zip }}</span></div>
            <div><strong class="text-muted-foreground">Country:</strong> <span class="text-foreground">{{ user.address.country }}</span></div>
          </div>
        }
        <div class="mt-4 flex justify-end">
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Edit</button>
      </div>
      }
    </div>
  `,
})
export class AddressCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: UserProfile | null = null;



// In class:
constructor(private fb: FormBuilder, private userService: UserService) {
  this.form = this.fb.group({
    line1: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zip: ['', Validators.required],
    country: ['', Validators.required],
  });
  effect(() => {
    const u = this.userService.user$();
    this.user = u;
    this.form.patchValue(u?.address || {});
  });
}

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  async save() {
    if (this.form.valid && this.user) {
      const updatedAddress = { ...this.user.address, ...this.form.value };
      const updated = { ...this.user, address: updatedAddress };
      await this.userService.save(updated);
      this.toggleEdit();
    }
}
}