/*
 * VehicleCardComponent: Editable card for vehicle info.
 * Uses reactive form, subscribes to service.
 */
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card p-6 rounded-lg shadow-md">
      <h2 class="text-lg font-semibold mb-4">Vehicle Information</h2>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm">Make</label>
              <input formControlName="make" class="w-full p-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm">Model</label>
              <input formControlName="model" class="w-full p-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm">Color</label>
              <input formControlName="color" class="w-full p-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm">License Number</label>
              <input formControlName="license" class="w-full p-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm">Year</label>
              <input formControlName="year" class="w-full p-2 border rounded" />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" (click)="toggleEdit()" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded">Save</button>
          </div>
        </form>
      } @else {
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Make:</strong> {{ user?.vehicle?.make }}</div>
          <div><strong>Model:</strong> {{ user?.vehicle?.model }}</div>
          <div><strong>Color:</strong> {{ user?.vehicle?.color }}</div>
          <div><strong>License Number:</strong> {{ user?.vehicle?.license }}</div>
          <div><strong>Year:</strong> {{ user?.vehicle?.year }}</div>
        </div>
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-white rounded">Edit</button>
      }
    </div>
  `,
})
export class VehicleCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: User | null = null;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.form = this.fb.group({
      make: [''],
      model: [''],
      color: [''],
      license: [''],
      year: [''],
    });
    this.userService.user$.subscribe(u => {
      this.user = u;
      this.form.patchValue(u?.vehicle || {});
    });
  }

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  save() {
    if (this.form.valid && this.user) {
      const updatedVehicle = { ...this.user.vehicle, ...this.form.value };
      const updated = { ...this.user, vehicle: updatedVehicle };
      this.userService.save(updated);
      this.toggleEdit();
    }
  }
}
