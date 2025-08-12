/*
  Main layout component for the app structure.
  Includes top menu, sidebar, main content, and footer.
  Uses MenuService for sidebar state, LayoutService for dark mode/mobile.
  OnPush change detection for performance; standalone per Angular v20+.
  Handles scroll reset on navigation end.
  References: Angular v20 docs (https://angular.dev/guide/components/standalone, https://angular.dev/guide/routing/common-router-tasks#scrolling-to-top).
*/
import { Component, inject, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopMenuComponent } from '../top-menu/top-menu.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { LayoutService } from '../../core/services/layout.service';
import { Router, NavigationEnd, Event } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, TopMenuComponent, SidebarComponent, FooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnInit {
  layout = inject(LayoutService);
  private router = inject(Router);
  private mainContent: HTMLElement | null = null;

  ngOnInit(): void {
    this.mainContent = document.getElementById('main-content');
    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        if (this.mainContent) {
          this.mainContent.scrollTop = 0;
        }
      }
    });
  }
}