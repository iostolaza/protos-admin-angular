/*
  Sidebar component using standalone Angular v20+ syntax.
  Injects MenuService for sidebar state management, aligning with menu/submenu components.
  OnPush change detection for performance.
  References: Angular v20 docs (standalone components, signals); angular-svg-icon ^20.x.
*/
import { NgClass, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MenuService } from '../../core/services/menu.service';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [NgClass, NgIf, AngularSvgIconModule, SidebarMenuComponent],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  menuService = inject(MenuService);

  toggleSidebar() {
    this.menuService.toggleSidebar();
  }
}