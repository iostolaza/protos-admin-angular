
// src/app/features/settings/settings.component.ts: Updated to use LayoutService for dark mode toggle

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutService } from '../../core/services/layout.service';  // Use merged LayoutService

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class Settings {
  constructor(public layoutService: LayoutService) {}  // Inject LayoutService

  toggleThemeMode() {
    this.layoutService.toggleDarkMode();  // Call toggleDarkMode from LayoutService
  }
}