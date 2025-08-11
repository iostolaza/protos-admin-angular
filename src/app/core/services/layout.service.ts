// src/app/core/services/layout.service.ts

/*
Description: 
Consolidated service for managing layout states like sidebar visibility, dark mode, and mobile menu.
Uses signals for reactive state management and media queries for initial dark mode.
Renamed sidebarCollapsed to showSideBar for consistency with MenuService usage.
References:
- Angular signals: https://angular.dev/guide/signals (v20.1.0)
- Media queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries (prefers-color-scheme)
*/

import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  // Signals for layout states
  showSideBar = signal(true);  // Renamed from sidebarCollapsed (inverse logic: true = shown/expanded)
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

  // Toggle sidebar visibility
  toggleSidebar() {
    this.showSideBar.update(value => !value);
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