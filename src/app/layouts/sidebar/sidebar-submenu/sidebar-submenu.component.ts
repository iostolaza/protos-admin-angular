import { CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { SubMenuItem } from '../../../core/models/menu.model';
import { MenuService } from '../../../core/services/menu.service';
import { ICONS, getIconPath } from '../../../icons-registry'; // <-- adjust path

@Component({
  selector: 'app-sidebar-submenu',
  standalone: true,
  imports: [
    CommonModule, NgClass, NgTemplateOutlet,
    RouterLinkActive, RouterLink, AngularSvgIconModule
  ],
  templateUrl: './sidebar-submenu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarSubmenuComponent {
  @Input() public submenu!: SubMenuItem;
  ICONS = ICONS;
  getIconPath = getIconPath;

  constructor(public menuService: MenuService) {}

  public toggleMenu(menu: SubMenuItem) {
    this.menuService.toggleSubMenu(menu);
  }
}
