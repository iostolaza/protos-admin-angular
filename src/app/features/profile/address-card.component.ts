/* Edited address card. */
 
import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';
 
 
@Component({
  selector: 'app-address-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './address-card.component.html',
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