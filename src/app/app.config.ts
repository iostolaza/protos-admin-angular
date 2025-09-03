// src/app/app.config.ts
// import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideAngularSvgIcon } from 'angular-svg-icon';
import { routes } from './app.routes';
import { provideIconPreload } from './app.icons';
import { Amplify } from 'aws-amplify';  // ^6.15.5
import outputs from '../../amplify_outputs.json';
import { UserService } from './core/services/user.service';

import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';



export function initializeAmplify() {
  return () => {
    try {
      console.log('Initializing Amplify with outputs:', outputs);
      Amplify.configure(outputs); 
    } catch (error) {
      console.error('Amplify config failed:', error);  
      throw error; 
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(),
    provideAngularSvgIcon(),
    provideIconPreload(),
    UserService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAmplify,
      multi: true,
    },
  ],
};