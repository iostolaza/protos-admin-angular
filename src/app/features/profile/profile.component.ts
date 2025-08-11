/*
 * ProfileComponent: Main profile page with scrolling sections/cards.
 * Loads user data, uses child components for modularity.
 * Best practice: Standalone, signals for v20+, reactive forms in children.
 * Cite: Angular components - https://angular.dev/guide/components
 */
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../core/services/user.service';
import { PersonalInfoCardComponent } from './personal-info-card.component';
import { AddressCardComponent } from './address-card.component';
import { ContactPrefsCardComponent } from './contact-prefs-card.component';
import { PaymentCardComponent } from './payment-card.component';
import { EmergencyContactCardComponent } from './emergency-contact-card.component';
import { VehicleCardComponent } from './vehicle-card.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, PersonalInfoCardComponent, AddressCardComponent, ContactPrefsCardComponent, PaymentCardComponent, EmergencyContactCardComponent, VehicleCardComponent],
  templateUrl: './profile.component.html',
})
export class Profile implements OnInit {
  loading = signal(true);

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.load().then(() => this.loading.set(false));
  }
}
