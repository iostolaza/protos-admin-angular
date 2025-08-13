
/* Edited vehicle card: bg-card, buttons bg-primary text-primary-foreground, cancel bg-secondary. */

import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card text-card-foreground p-6 rounded-lg shadow-custom border border-border flex flex-col h-full">
      <h2 class="text-xl font-bold mb-4 text-primary">Vehicle Information</h2>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-muted-foreground">Make</label>
              <input formControlName="make" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Model</label>
              <input formControlName="model" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Color</label>
              <input formControlName="color" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">License Number</label>
              <input formControlName="license" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
            <div>
              <label class="block text-sm text-muted-foreground">Year</label>
              <input formControlName="year" class="w-full p-2 border border-border rounded bg-background text-foreground" />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" (click)="toggleEdit()" class="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-muted">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Save</button>
          </div>
        </form>
      } @else {
        <div class="grid grid-cols-2 gap-4 text-foreground">
          <div><strong class="text-muted-foreground">Make:</strong> <span class="text-foreground">{{ user?.vehicle?.make }}</span></div>
          <div><strong class="text-muted-foreground">Model:</strong> <span class="text-foreground">{{ user?.vehicle?.model }}</span></div>
          <div><strong class="text-muted-foreground">Color:</strong> <span class="text-foreground">{{ user?.vehicle?.color }}</span></div>
          <div><strong class="text-muted-foreground">License Number:</strong> <span class="text-foreground">{{ user?.vehicle?.license }}</span></div>
          <div><strong class="text-muted-foreground">Year:</strong> <span class="text-foreground">{{ user?.vehicle?.year }}</span></div>
        </div>
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90">Edit</button>
      }
    </div>
  `,
})
export class VehicleCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: UserProfile | null = null;

constructor(private fb: FormBuilder, private userService: UserService) {
  this.form = this.fb.group({
    make: [''],
    model: [''],
    color: [''],
    license: [''],
    year: [''],
  });
  effect(() => {
    const u = this.userService.user$();
    this.user = u;
    this.form.patchValue(u?.vehicle || {});
  });
}

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  async save() {
    if (this.form.valid && this.user) {
      const updatedVehicle = { ...this.user.vehicle, ...this.form.value };
      const updated = { ...this.user, vehicle: updatedVehicle };
      await this.userService.save(updated);
      this.toggleEdit();
    }
  }
}