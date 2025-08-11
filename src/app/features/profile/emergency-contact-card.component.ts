/*
 * EmergencyContactCardComponent: Editable card for emergency contact.
 * Uses reactive form, subscribes to service.
 */
import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-emergency-contact-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="bg-card p-6 rounded-lg shadow-md">
      <h2 class="text-lg font-semibold mb-4">Emergency Contact</h2>
      @if (editMode()) {
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm">Name</label>
              <input formControlName="name" class="w-full p-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm">Phone</label>
              <input formControlName="phone" class="w-full p-2 border rounded" />
            </div>
            <div>
              <label class="block text-sm">Email</label>
              <input formControlName="email" type="email" class="w-full p-2 border rounded" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm">Address</label>
              <input formControlName="address" class="w-full p-2 border rounded" />
            </div>
          </div>
          <div class="mt-4 flex justify-end gap-2">
            <button type="button" (click)="toggleEdit()" class="px-4 py-2 bg-gray-300 rounded">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-primary text-white rounded">Save</button>
          </div>
        </form>
      } @else { 
        <div class="grid grid-cols-2 gap-4">
          <div><strong>Name:</strong> {{ user?.emergencyContact?.name }}</div>
          <div><strong>Phone:</strong> {{ user?.emergencyContact?.phone }}</div>
          <div><strong>Email:</strong> {{ user?.emergencyContact?.email }}</div>
          <div class="col-span-2"><strong>Address:</strong> {{ user?.emergencyContact?.address }}</div>
        </div>
        <button (click)="toggleEdit()" class="mt-4 px-4 py-2 bg-primary text-white rounded">Edit</button>
      }
    </div>
  `,
})
export class EmergencyContactCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: User | null = null;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
    });
    this.userService.user$.subscribe(u => {
      this.user = u;
      this.form.patchValue(u?.emergencyContact || {});
    });
  }

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  save() {
    if (this.form.valid && this.user) {
      const updatedContact = { ...this.user.emergencyContact, ...this.form.value };
      const updated = { ...this.user, emergencyContact: updatedContact };
      this.userService.save(updated);
      this.toggleEdit();
    }
  }
}
