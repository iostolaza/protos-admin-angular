/*
App icon initializer — optional but nice:
Preloads all SVGs at app startup to avoid first-use network jitter.
Angular v20: provideAppInitializer returns EnvironmentProviders.
*/

import { inject, EnvironmentProviders, provideAppInitializer, makeEnvironmentProviders } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { IconPreloaderService } from './core/services/icon-preloader.service';

export function provideIconPreload(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideAppInitializer(async () => {
      const svc = inject(IconPreloaderService);
      // preloadIcons() returns an Observable<void>; convert properly
      await firstValueFrom(svc.preloadIcons());
    }),
  ]);
}
