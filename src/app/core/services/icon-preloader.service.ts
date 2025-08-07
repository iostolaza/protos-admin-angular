// src/app/core/services/icon-preloader.service.ts

/*
Description: 
Service to preload SVG icons using angular-svg-icon.
Loads Heroicons from assets for performance (cached DOM).
References:
- angular-svg-icon docs: https://www.npmjs.com/package/angular-svg-icon (preloading)
- Angular signals: https://angular.dev/guide/signals (v20.1.0)
*/

// Imports
import { Injectable } from '@angular/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';

// List of Heroicons paths (from your assets; extend as needed)
const ICON_PATHS = [
  'assets/icons/heroicons/outline/arrow-long-left.svg',
  'assets/icons/heroicons/outline/arrow-long-right.svg',
  'assets/icons/heroicons/outline/arrow-sm-right.svg',
  'assets/icons/heroicons/outline/arrow-sm-up.svg',
  'assets/icons/heroicons/outline/bell.svg',
  'assets/icons/heroicons/outline/bookmark.svg',
  'assets/icons/heroicons/outline/chart-pie.svg',
  'assets/icons/heroicons/outline/cog-6-tooth.svg',
  'assets/icons/heroicons/outline/cog.svg',
  'assets/icons/heroicons/outline/cube.svg',
  'assets/icons/heroicons/outline/cursor-click.svg',
  'assets/icons/heroicons/outline/dots-horizontal.svg',
  'assets/icons/heroicons/outline/download.svg',
  'assets/icons/heroicons/outline/ellipsis-vertical.svg',
  'assets/icons/heroicons/outline/exclamation-triangle.svg',
  'assets/icons/heroicons/outline/eye-off.svg',
  'assets/icons/heroicons/outline/eye.svg',
  'assets/icons/heroicons/outline/folder.svg',
  'assets/icons/heroicons/outline/gift.svg',
  'assets/icons/heroicons/outline/information-circle.svg',
  'assets/icons/heroicons/outline/lock-closed.svg',
  'assets/icons/heroicons/outline/logout.svg',
  'assets/icons/heroicons/outline/magnifying-glass.svg',
  'assets/icons/heroicons/outline/menu.svg',
  'assets/icons/heroicons/outline/minus.svg',
  'assets/icons/heroicons/outline/moon.svg',
  'assets/icons/heroicons/outline/plus.svg',
  'assets/icons/heroicons/outline/refresh.svg',
  'assets/icons/heroicons/outline/shield-check.svg',
  'assets/icons/heroicons/outline/shield-exclamation.svg',
  'assets/icons/heroicons/outline/sun.svg',
  'assets/icons/heroicons/outline/user-circle.svg',
  'assets/icons/heroicons/outline/users.svg',
  'assets/icons/heroicons/outline/view-grid.svg',
  'assets/icons/heroicons/outline/x.svg',
  'assets/icons/heroicons/solid/chevron-double-left.svg',
  'assets/icons/heroicons/solid/chevron-right.svg',
  'assets/icons/heroicons/solid/play.svg'
];

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
        map(svg => this.iconRegistry.addSvg(path.split('/').pop().replace('.svg', ''), svg))
      )
    );
    return forkJoin(iconRequests);
  }
}
