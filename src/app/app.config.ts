/*
Application config: router, animations, HTTP, SVG icon loader, icon preloader, and Amplify initialization
*/
import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { routes } from './app.routes';
import { provideIconPreload } from './app.icons';
import { Amplify } from 'aws-amplify';
import outputs from '../../amplify_outputs.json'; // Adjust path as needed

// Initialize Amplify
export function initializeAmplify() {
  return () => Amplify.configure(outputs);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideAngularSvgIcon(),
    provideIconPreload(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAmplify,
      multi: true
    }
  ]
};