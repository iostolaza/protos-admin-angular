import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class Home implements OnInit {
  private router = inject(Router);
  userEmail = signal<string>('');
  profileImage = signal<string>('assets/profile/profile-female.jpg');
  metrics = signal<{ name: string; value: string }[]>([
    { name: 'Users', value: '1,200' },
    { name: 'Revenue', value: '$45,000' },
    { name: 'Orders', value: '320' },
    { name: 'Growth', value: '15%' }
  ]);

  async ngOnInit() {
    try {
      await getCurrentUser();
      const attributes = await fetchUserAttributes();
      this.userEmail.set(attributes.email || 'User');
      if (attributes.picture) this.profileImage.set(attributes.picture);
    } catch (error) {
      console.error('Error fetching user:', error);
      this.router.navigate(['/auth']);
    }
  }

  async handleSignOut() {
    try {
      await signOut();
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}
