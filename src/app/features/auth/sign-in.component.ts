// src/app/features/auth/sign-in/sign-in.component.ts
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AmplifyAuthenticatorModule, AuthenticatorService } from '@aws-amplify/ui-angular';
import { Router } from '@angular/router';
import { Hub } from 'aws-amplify/utils';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, AmplifyAuthenticatorModule],
  templateUrl: './sign-in.component.html',
})
export class SignInComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authenticator = inject(AuthenticatorService);
  isLoading = signal(true);

  private hubUnsubscribe: (() => void) | undefined;
  private pollInterval: any;

  ngOnInit() {
    this.isLoading.set(true);

    // Listen for auth events (best practice)
    this.hubUnsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        this.router.navigate(['/main-layout']);
      }
    });

    // Synchronous pre-check for already authenticated
    if (this.authenticator.authStatus === 'authenticated') {
      this.router.navigate(['/main-layout']);
    } else {
      // 500ms polling fallback for edge case coverage
      this.pollInterval = setInterval(() => {
        if (this.authenticator.authStatus === 'authenticated') {
          this.router.navigate(['/main-layout']);
          clearInterval(this.pollInterval);
        }
      }, 500);
    }
    this.isLoading.set(false);
  }

  ngOnDestroy() {
    if (this.hubUnsubscribe) this.hubUnsubscribe();
    if (this.pollInterval) clearInterval(this.pollInterval);
  }
}

