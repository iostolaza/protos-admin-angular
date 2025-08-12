
// src/app/app.ts

// Root component of the application.
// Serves as entry for routing via RouterOutlet.
// Preloads icons on init.

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconPreloaderService } from './core/services/icon-preloader.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private iconPreloader = inject(IconPreloaderService);
  private themeService = inject(ThemeService); // Inject to initialize service and load theme via constructor

  constructor() {
    this.iconPreloader.preloadIcons().subscribe();
  }
}