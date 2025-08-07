// src/app/app.config.ts

/*
Description: 
Central application configuration for standalone Angular app. 
Provides router, animations, HTTP client, and SVG icon loader.
References:
- Angular docs: https://angular.dev/api/common/http/provideHttpClient (v20.1.0)
- angular-svg-icon GitHub: https://github.com/czeckd/angular-svg-icon (v19.1.1, default loader)
*/

// Import config types and providers
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { provideHttpClient } from '@angular/common/http';

// Import routes
import { routes } from './app.routes';

// Export app config with merged providers
export const appConfig: ApplicationConfig = {
  providers: [
    // Enable zone change detection with coalescing for performance
    provideZoneChangeDetection({ eventCoalescing: true }),
    
    // Provide router with defined routes
    provideRouter(routes),
    
    // Async animations for browser
    provideAnimationsAsync(),
    
    // HTTP client for API/SVG loading
    provideHttpClient(),
    
    // SVG icon provider (dynamic loading)
    provideAngularSvgIcon()
  ]
};
