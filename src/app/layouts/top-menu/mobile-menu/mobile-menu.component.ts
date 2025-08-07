import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutService } from '../../../core/services/layout.service';  // Correct relative path

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './mobile-menu.component.html'
})
export class MobileMenu {
  constructor(public layout: LayoutService) {} // Inject LayoutService as public for template access
  
  navLinks = [ // Define navLinks as component property; replace with actual data or service
    { path: '/dashboard', icon: 'assets/icons/home.svg', label: 'Dashboard' },
    // Add more links as needed
  ];
}


