import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { SubMenuItem } from '../../../core/models/menu.model';
import { MenuService } from '../../../core/services/menu.service';
import { SidebarSubmenuComponent } from '../sidebar-submenu/sidebar-submenu.component';
import { ICONS, getIconPath, IconName } from 'src/app/core/services/icon-preloader.service'; // Make sure IconName is imported!

@Component({
  selector: 'app-sidebar-menu',
  standalone: true,
  imports: [
    CommonModule, NgClass, NgTemplateOutlet,
    RouterLink, RouterLinkActive, AngularSvgIconModule,
    SidebarSubmenuComponent
  ],
  templateUrl: './sidebar-menu.component.html',
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
