import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MenuService } from '../../../core/services/menu.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { getIconPath } from '../../../core/services/icon-preloader.service';

type ProfileItem = { title: string; icon: 'user-circle' | 'cog' | 'logout'; route?: string; action?: 'logout' };

@Component({
  selector: 'app-profile-menu',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, AngularSvgIconModule],
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

  getIconPath = getIconPath;

  isOpen = signal(false);
  profileMenu = signal<ProfileItem[]>([
    { title: 'Profile',  icon: 'user-circle', route: '/main-layout/profile' },
    { title: 'Settings', icon: 'cog',         route: '/main-layout/settings' },
    { title: 'Logout',   icon: 'logout',      action: 'logout' }
  ]);

  toggleMenu() { this.isOpen.update((v) => !v); }

  onMenuItemClick(item: ProfileItem) {
    if (item.route) {
      this.router.navigate([item.route]);
    } else if (item.action === 'logout') {
      this.menuService.logout();
    }
    this.isOpen.set(false);
  }
}
