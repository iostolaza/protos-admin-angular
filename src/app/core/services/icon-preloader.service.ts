/*
Service: icon-preloader.service.ts
- Single source of truth for icon file paths (ICONS map)
- Type-safe IconName from map keys
- getIconPath(name) to resolve icon URLs
- Optional preloadIcons() to warm the cache via angular-svg-icon

Docs:
- angular-svg-icon registry & caching: https://www.npmjs.com/package/angular-svg-icon
- APP initializer: https://angular.dev/api/core/provideAppInitializer
*/

import { Injectable } from '@angular/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';

// Central, typed map of icons → file paths
export const ICONS = {
  'arrow-long-left': 'assets/icons/heroicons/outline/arrow-long-left.svg',
  'arrow-long-right': 'assets/icons/heroicons/outline/arrow-long-right.svg',
  'arrow-sm-right': 'assets/icons/heroicons/outline/arrow-sm-right.svg',
  'arrow-sm-up': 'assets/icons/heroicons/outline/arrow-sm-up.svg',
  'bell': 'assets/icons/heroicons/outline/bell.svg',
  'bookmark': 'assets/icons/heroicons/outline/bookmark.svg',
  'calendar-date-range': 'assets/icons/heroicons/outline/calendar-date-range.svg',
  'camera': 'assets/icons/heroicons/outline/camera.svg',
  'chart-bar': 'assets/icons/heroicons/outline/chart-bar.svg',
  'chart-pie': 'assets/icons/heroicons/outline/chart-pie.svg',
  'chat-bubble-bottom-center-text': 'assets/icons/heroicons/outline/chat-bubble-bottom-center-text.svg',
  'chat-bubble-left-right': 'assets/icons/heroicons/outline/chat-bubble-left-right.svg',
  'chat-bubble-oval-left-ellipsis': 'assets/icons/heroicons/outline/chat-bubble-oval-left-ellipsis.svg',
  'clock': 'assets/icons/heroicons/outline/clock.svg',
  'cog-6-tooth': 'assets/icons/heroicons/outline/cog-6-tooth.svg',
  'cog': 'assets/icons/heroicons/outline/cog.svg',
  'cube': 'assets/icons/heroicons/outline/cube.svg',
  'cursor-click': 'assets/icons/heroicons/outline/cursor-click.svg',
  'dots-horizontal': 'assets/icons/heroicons/outline/dots-horizontal.svg',
  'download': 'assets/icons/heroicons/outline/download.svg',
  'ellipsis-vertical': 'assets/icons/heroicons/outline/ellipsis-vertical.svg',
  'exclamation-triangle': 'assets/icons/heroicons/outline/exclamation-triangle.svg',
  'eye-off': 'assets/icons/heroicons/outline/eye-off.svg',
  'eye': 'assets/icons/heroicons/outline/eye.svg',
  'folder': 'assets/icons/heroicons/outline/folder.svg',
  'gift': 'assets/icons/heroicons/outline/gift.svg',
  'home': 'assets/icons/heroicons/outline/home.svg',
  'inbox': 'assets/icons/heroicons/outline/inbox.svg',
  'inbox-arrow-down': 'assets/icons/heroicons/outline/inbox-arrow-down.svg',
  'inbox-stack': 'assets/icons/heroicons/outline/inbox-stack.svg',
  'information-circle': 'assets/icons/heroicons/outline/information-circle.svg',
  'lock-closed': 'assets/icons/heroicons/outline/lock-closed.svg',
  'logout': 'assets/icons/heroicons/outline/logout.svg',
  'magnifying-glass': 'assets/icons/heroicons/outline/magnifying-glass.svg',
  'map-pin': 'assets/icons/heroicons/outline/map-pin.svg',
  'menu': 'assets/icons/heroicons/outline/menu.svg',
  'minus': 'assets/icons/heroicons/outline/minus.svg',
  'moon': 'assets/icons/heroicons/outline/moon.svg',
  'plus': 'assets/icons/heroicons/outline/plus.svg',
  'refresh': 'assets/icons/heroicons/outline/refresh.svg',
  'shield-check': 'assets/icons/heroicons/outline/shield-check.svg',
  'shield-exclamation': 'assets/icons/heroicons/outline/shield-exclamation.svg',
  'sun': 'assets/icons/heroicons/outline/sun.svg',
  'user-circle': 'assets/icons/heroicons/outline/user-circle.svg',
  'users': 'assets/icons/heroicons/outline/users.svg',
  'view-grid': 'assets/icons/heroicons/outline/view-grid.svg',
  'x': 'assets/icons/heroicons/outline/x.svg',
  'chevron-double-left': 'assets/icons/heroicons/solid/chevron-double-left.svg',
  'chevron-right': 'assets/icons/heroicons/solid/chevron-right.svg',
  'play': 'assets/icons/heroicons/solid/play.svg',
} as const;

export type IconName = keyof typeof ICONS;

export function getIconPath(name: IconName): string {
  return ICONS[name];
}

@Injectable({ providedIn: 'root' })
export class IconPreloaderService {
  constructor(
    private iconRegistry: SvgIconRegistryService,
    private http: HttpClient
  ) {}

  /**
   * Preload all icons once (optional)
   * angular-svg-icon caches by URL; preloading reduces initial flashes.
   */
  preloadIcons() {
    const entries = Object.entries(ICONS) as [IconName, string][];
    const reqs = entries.map(([key, path]) =>
      this.http.get(path, { responseType: 'text' }).pipe(
        map(svgText => {
          // registry index by *URL*; we still use [src]="getIconPath(key)" in templates
          this.iconRegistry.addSvg(path, svgText);
          return key;
        })
      )
    );
    return forkJoin(reqs);
  }
}
