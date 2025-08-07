
// src/app/app.ts

/*
Description: 
Root component of the application. 
Serves as entry for routing via RouterOutlet.
Preloads icons on init.
*/

// Imports
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconPreloaderService } from './core/services/icon-preloader.service';

// Standalone component
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.component.css' 
})
export class AppComponent {
  // Constructor: Inject and preload icons
  constructor(private iconPreloader: IconPreloaderService) {
    this.iconPreloader.preloadIcons().subscribe();
  }
}
