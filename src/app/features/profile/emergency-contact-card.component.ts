/* Edited emergency contact card. */
 
import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';
 
@Component({
  selector: 'app-emergency-contact-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './emergency-contact-card.component.html',
})
export class EmergencyContactCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: UserProfile | null = null;
 
constructor(private fb: FormBuilder, private userService: UserService) {
  this.form = this.fb.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    address: ['', Validators.required],
  });
  effect(() => {
    
    const u = this.userService.user();
    this.user = u;
    this.form.patchValue(u?.emergencyContact || {});
  });
}
 
  toggleEdit() {
    this.editMode.update(m => !m);
  }
 
  async save() {
    if (this.form.valid && this.user) {
      const updatedContact = { ...this.user.emergencyContact, ...this.form.value };
      const updated = { ...this.user, emergencyContact: updatedContact };
      await this.userService.save(updated);
      this.toggleEdit();
    }
  }
}