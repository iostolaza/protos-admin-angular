// Profile menu component with dropdown, matching typical dashboard patterns.
// Standalone, OnPush, uses signals for state.
// References:
// - Angular docs: https://angular.dev/guide/signals (v20.1.0)
// - Angular animations: https://angular.dev/guide/animations/reusable (v20.1.0)
// - Fixed NG998103 by importing CommonModule (includes NgIf: https://angular.dev/api/common/CommonModule)
// - Tailwind CSS for styling (v4.x: https://tailwindcss.com/docs)
// - Angular change detection: https://angular.dev/guide/components/change-detection (v20.1.0)

import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MenuService } from '../../../core/services/menu.service';  // For logout if needed

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './profile-menu.component.html',
  animations: [
    trigger('openClose', [
      state('open', style({ opacity: 1, transform: 'scaleY(1)' })),
      state('closed', style({ opacity: 0, transform: 'scaleY(0)' })),
      transition('open => closed', [animate('0.2s')]),
      transition('closed => open', [animate('0.2s')]),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMenuComponent {
  private router = inject(Router);
  private menuService = inject(MenuService);

  isOpen = signal(false);
  profileMenu = signal([
    { title: 'Profile', route: '/main-layout/profile' },
    { title: 'Settings', route: '/main-layout/settings' },
    { title: 'Logout', action: 'logout' },
  ]);

  toggleMenu() {
    this.isOpen.update((v) => !v);
  }

  onMenuItemClick(item: { title: string; route?: string; action?: string }) {
    if (item.route) {
      this.router.navigate([item.route]);
    } else if (item.action === 'logout') {
      this.menuService.logout();
    }
    this.isOpen.set(false);
  }
}
