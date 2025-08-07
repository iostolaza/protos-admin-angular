// src/app/app.spec.ts

/*
Description: 
Unit tests for the root AppComponent. 
Verifies component creation using TestBed with providers for routing, HTTP, and SVG icons.
*/

// Import testing utilities
import { TestBed } from '@angular/core/testing';

// Import providers
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAngularSvgIcon } from 'angular-svg-icon';

// Import components and routes
import { AppComponent } from './app';
import { routes } from './app.routes';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component'; 

// Test suite for AppComponent
describe('AppComponent', () => {
  // Setup TestBed before each test
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, MainLayoutComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideAngularSvgIcon()
      ]
    }).compileComponents();
  });

  // Test case: Component should create successfully
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
