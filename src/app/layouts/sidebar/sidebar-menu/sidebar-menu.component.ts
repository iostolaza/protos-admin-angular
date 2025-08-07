// src/app/layouts/sidebar/sidebar-menu/sidebar-menu.ts

/*
Description: 
Standalone sidebar menu component with toggle and icons.
Uses MenuService for state.
References:
- Angular standalone: https://angular.dev/guide/standalone-components (v20.1.0)
- Imports: https://angular.dev/guide/imports (relative paths)
*/

// Imports
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { SubMenuItem } from '../../../core/models/menu.model';
import { MenuService } from '../../../core/services/menu.service';
import { SidebarSubmenuComponent } from '../sidebar-submenu/sidebar-submenu.component';
import { ICONS, getIconPath, IconName } from '../../../core/services/icon-preloader.service';  // Fixed: Relative path from sidebar-menu to icon-preloader


// Standalone component
@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [
    CommonModule, NgClass, NgTemplateOutlet,
    RouterLink, RouterLinkActive, AngularSvgIconModule,
    SidebarSubmenuComponent
  ],
  templateUrl: './sidebar-menu.component.html',  // Assuming suffix-less
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarMenuComponent {
  ICONS = ICONS;
  getIconPath = getIconPath;

  constructor(public menuService: MenuService) {}

  trackByLabel(index: number, item: { label: string }) { return item.label; }

  public toggleMenu(subMenu: SubMenuItem) {
    this.menuService.toggleMenu(subMenu);
  }

  /**
   * Type-safe icon getter: only allows IconName keys, else fallback to 'menu'
   */
  menuIcon(icon: string | undefined): string {
    const fallback: IconName = 'menu';
    return getIconPath(
      (icon && Object.hasOwn(ICONS, icon) ? icon : fallback) as IconName
    );
  }
}