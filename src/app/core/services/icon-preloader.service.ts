// src/app/core/services/icon-preloader.service.ts

/*
Description: 
Service to preload SVG icons using angular-svg-icon.
Loads Heroicons from assets for performance (cached DOM).
Exports IconName type, ICONS map, getIconPath for type-safe usage.
Consolidated from icons-registry.ts for single source of truth.
References:
- angular-svg-icon docs: https://www.npmjs.com/package/angular-svg-icon (preloading)
- Angular types: https://angular.dev/guide/typescript-configuration (union types)
- Community: https://stackoverflow.com/questions/57234220/module-has-no-exported-member-error-in-angular-module (export fixes)
*/

// Imports
import { Injectable } from '@angular/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';

// Type-safe icon names (union from keys)
export type IconName = keyof typeof ICONS;

// Map of names to paths (consolidated; matches your assets/heroicons)
export const ICONS = {
  'arrow-long-left': 'assets/icons/heroicons/outline/arrow-long-left.svg',
  'arrow-long-right': 'assets/icons/heroicons/outline/arrow-long-right.svg',
  'arrow-sm-right': 'assets/icons/heroicons/outline/arrow-sm-right.svg',
  'arrow-sm-up': 'assets/icons/heroicons/outline/arrow-sm-up.svg',
  'bell': 'assets/icons/heroicons/outline/bell.svg',
  'bookmark': 'assets/icons/heroicons/outline/bookmark.svg',
  'chart-pie': 'assets/icons/heroicons/outline/chart-pie.svg',
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
  'information-circle': 'assets/icons/heroicons/outline/information-circle.svg',
  'lock-closed': 'assets/icons/heroicons/outline/lock-closed.svg',
  'logout': 'assets/icons/heroicons/outline/logout.svg',
  'magnifying-glass': 'assets/icons/heroicons/outline/magnifying-glass.svg',
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
  // Add non-heroicons if needed, e.g., 'logo': 'assets/icons/logo.svg'
} as const;

// Function to get path by name
export function getIconPath(name: IconName): string {
  return ICONS[name];
}

// Internal paths array (derived from ICONS values for consistency)
const ICON_PATHS = Object.values(ICONS);

// Injectable service
@Injectable({
  providedIn: 'root'
})
export class IconPreloaderService {
  constructor(
    private iconRegistry: SvgIconRegistryService,
    private http: HttpClient
  ) {}

  // Preload all icons on init
  preloadIcons() {
    const iconRequests = ICON_PATHS.map(path =>
      this.http.get(path, { responseType: 'text' }).pipe(
        map(svg => this.iconRegistry.addSvg(path.split('/').pop()!.replace('.svg', ''), svg))
      )
    );
    return forkJoin(iconRequests);
  }
}
