/*
 * SettingsComponent: Modular settings with cards.
 * Extend theme toggle, add forms/selects.
 * Best practice: Use signals, localStorage for persist.
 * Cite: https://medium.com/@sehban.alam/angular-2025-new-style-guide-standards-and-how-to-apply-them-3277eef541a3
 */
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  passwordForm: FormGroup;
  timezone = 'UTC'; // Mock, use luxon for real
  language = 'English'; // Prep for i18n

  constructor(private fb: FormBuilder, public themeService: ThemeService) {
    this.passwordForm = this.fb.group({
      current: ['', Validators.required],
      new: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', Validators.required],
    }, { validators: this.passwordMatch });
  }

  passwordMatch(group: FormGroup) {
    return group.get('new')?.value === group.get('confirm')?.value
      ? null
      : { mismatch: true };
  }

  savePassword() {
    if (this.passwordForm.valid) {
      // Call backend, e.g., Amplify Auth.changePassword
      console.log('Password changed');
    }
  }

  setTimezone(event: Event) {
    this.timezone = (event.target as HTMLSelectElement).value;
    // Persist to localStorage/backend
  }

  setLanguage(event: Event) {
    this.language = (event.target as HTMLSelectElement).value;
    // Trigger i18n change
  }
}
