/**
 * Angular 20+ Karma/Jasmine bootstrap
 * - Loads zone.js testing APIs
 * - Initializes TestBed with BrowserTestingModule / platformBrowserTesting
 * - No webpack-only `require.context`
 */
import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
  {
    errorOnUnknownElements: false,
    errorOnUnknownProperties: false
  }
);
