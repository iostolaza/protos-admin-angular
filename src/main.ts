// src/main.ts

/*
Description: 
Entry point for the Angular application. 
Configures AWS Amplify Gen 2 before bootstrapping the standalone app.
Handles error logging during bootstrap.
*/
// Import Zone.js
import 'zone.js';

// Imports 
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '../amplify_outputs.json';

// Configure Amplify globally before app starts (best practice for auth integration)
Amplify.configure(amplifyConfig);

// Bootstrap the application with config and error handling
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
