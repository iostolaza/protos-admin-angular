/* Edited vehicle card: bg-card, buttons bg-primary text-primary-foreground, cancel bg-secondary. */
 
import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';
 
@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-card.component.html',
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
    const u = this.userService.user();
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