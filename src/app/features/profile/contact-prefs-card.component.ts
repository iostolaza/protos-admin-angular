import { Component, effect, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService, UserProfile } from '../../core/services/user.service';

@Component({
  selector: 'app-contact-prefs-card',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact-prefs-card.component.html',
})
export class ContactPrefsCardComponent {
  editMode = signal(false);
  form: FormGroup;
  user: UserProfile | null = null;

  constructor(private fb: FormBuilder, private userService: UserService) {
    this.form = this.fb.group({
      email: [false],
      push: [false],
    });

    // 👇 fix: subscribe/effect to update this.user correctly
    effect(() => {
      const u = this.userService.user(); // assuming user is a signal
      this.user = u;
      if (u?.contactPrefs) {
        this.form.patchValue(u.contactPrefs);
      }
    });
  }

  toggleEdit() {
    this.editMode.update(m => !m);
  }

  async save() {
    if (this.form.valid && this.user) {
      const updatedPrefs = { ...this.user.contactPrefs, ...this.form.value };
      const updated = { ...this.user, contactPrefs: updatedPrefs };
      await this.userService.save(updated);
      this.toggleEdit();
    }
  }
}
