import { Component, inject } from '@angular/core';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-home-overview',
  standalone: true,
  imports: [],
  template: `
    <div class="rounded-lg bg-card px-8 py-8 shadow-custom mb-6">
      <h2 class="text-2xl font-bold text-indigo-500 dark:text-indigo-300 mb-4">Home Overview</h2>
      <p class="text-l text-blue-500 dark:text-blue-300">Hi, {{ user()?.firstName || 'User' }}!</p>
      <p class="text-l text-gray-900 dark:text-gray-100">Let's take a look at your activity overview</p>
    </div>
  `,
})
export class HomeOverviewComponent {
  private userService = inject(UserService);
  user = this.userService.user;
}
