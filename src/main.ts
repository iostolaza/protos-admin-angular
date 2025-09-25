// src/main.ts
/*
Description:
Entry point for the Angular application.
Bootstraps the standalone app with configuration from app.config.ts.
Handles error logging during bootstrap.
*/
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
