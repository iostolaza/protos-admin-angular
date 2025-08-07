import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MenuService } from '../../core/services/menu.service';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { ICONS, getIconPath } from '../../core/services/icon-preloader.service';  

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, AngularSvgIconModule, SidebarMenuComponent],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  ICONS = ICONS;
  getIconPath = getIconPath;

  constructor(public menuService: MenuService) {}

  public toggleSidebar() {
    this.menuService.toggleSidebar();
  }
}
