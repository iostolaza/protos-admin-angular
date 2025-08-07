// src/app/core/services/layout.service.ts

/*
Description: 
Consolidated service for managing layout states like sidebar collapse, dark mode, and mobile menu.
Uses signals for reactive state management and media queries for initial dark mode.
Merged from ThemeService for clean architecture.
*/

// Imports
import { Injectable, signal, effect } from '@angular/core';

// Injectable service
@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  // Signals for layout states
  sidebarCollapsed = signal(false);
  isDarkMode = signal(false);
  showMobileMenu = signal(false);

  // Constructor: Initialize dark mode based on prefers-color-scheme
  constructor() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDarkMode.set(prefersDark);

    // Effect: Toggle dark class on document
    effect(() => {
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  // Toggle sidebar collapse
  toggleSidebar() {
    this.sidebarCollapsed.update(value => !value);
  }

  // Toggle dark mode
  toggleDarkMode() {
    this.isDarkMode.update(value => !value);
  }

  // Toggle mobile menu visibility
  toggleMobileMenu() {
    this.showMobileMenu.update(value => !value);
  }
}
