import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  showSideBar = signal(true);
  isDarkMode = signal(false);
  showMobileMenu = signal(false);

  constructor() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDarkMode.set(prefersDark);

    effect(() => {
      if (this.isDarkMode()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  toggleSidebar() {
    this.showSideBar.update(value => !value);
  }

  toggleDarkMode() {
    this.isDarkMode.update(value => !value);
  }

  toggleMobileMenu() {
    this.showMobileMenu.update(value => !value);
  }
}
