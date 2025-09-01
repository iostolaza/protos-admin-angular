// src/app/features/messages/chatlayout/user-profile.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
})

export class UserProfileComponent implements OnInit {
  private userService = inject(UserService);
  user = this.userService.user$;

  async ngOnInit() {
    await this.userService.load(); // Ensure user data is loaded
  }
}