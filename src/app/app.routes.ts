/*
Description: 
Defines application routes with lazy-loading for features. 
Uses guards for auth protection. 
Supports child routes under main layout for dashboard navigation.
References:
- Angular docs: https://angular.dev/guide/routing/lazy-loading (v20.1.0, loadComponent)
- StackOverflow: https://stackoverflow.com/questions/78945678/angular-standalone-lazy-routes-2025 (child routes)
*/

// Import routing types and guards
import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';

// Import layout and auth components (eager for core)
import { SignInComponent } from './features/auth/sign-in.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

// Define routes array
export const routes: Routes = [
  // Default redirect to sign-in
  { path: '', redirectTo: 'sign-in', pathMatch: 'full' },
  
  // Public route for sign-in with no-auth guard
  { path: 'sign-in', component: SignInComponent, canActivate: [noAuthGuard] },
  
  // Protected main layout with auth guard and lazy-loaded children
  {
    path: 'main-layout',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      
      // Home dashboard lazy-loaded
      { path: 'home', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
      
      // Profile page lazy-loaded
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
      
      // Messages variants (incoming/outgoing) using same component
      { path: 'messages', redirectTo: 'messages/incoming', pathMatch: 'full' },
      { path: 'messages/incoming', loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent) },
      { path: 'messages/incoming/:channelId', loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent) },
      { path: 'messages/outgoing', loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent) },
      { path: 'messages/outgoing/:channelId', loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent) },
      
      // Contacts variants (new/favorites/online) using same component
      { path: 'contacts', loadComponent: () => import('./features/contacts/contacts.component').then(m => m.ContactsComponent) },
      { path: 'contacts/new', loadComponent: () => import('./features/contacts/contacts.component').then(m => m.ContactsComponent) },
      { path: 'contacts/favorites', loadComponent: () => import('./features/contacts/contacts.component').then(m => m.ContactsComponent) },
      { path: 'contacts/online', loadComponent: () => import('./features/contacts/contacts.component').then(m => m.ContactsComponent) },

      // Ticket management with sub-routes
      {
        path: 'ticket-management',
        loadComponent: () => import('./features/ticket-management/ticket-management.component').then(m => m.TicketManagementComponent),
        children: [
          { path: '', redirectTo: 'tickets', pathMatch: 'full' },
          { path: 'tickets', loadComponent: () => import('./features/ticket-management/ticket-list/ticket-list.component').then(m => m.TicketListComponent) },
          { path: 'teams', loadComponent: () => import('./features/ticket-management/team-list/team-list.component').then(m => m.TeamListComponent) },
          { path: 'create-ticket', loadComponent: () => import('./features/ticket-management/generate-tickets/generate-tickets.component').then(m => m.GenerateTicketsComponent) },
          { path: 'create-team', loadComponent: () => import('./features/ticket-management/generate-team/generate-team.component').then(m => m.GenerateTeamComponent) },
        ]
      },

      { path: 'documents', loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent) },

      { path: 'financials', loadComponent: () => import('./features/financials/financials.component').then(m => m.FinancialsComponent) }, 
      
      { path: 'timesheet/submitted', loadComponent: () => import('./features/timesheet/timesheet.component').then(m => m.Timesheet) },
      { path: 'timesheet/pending', loadComponent: () => import('./features/timesheet/timesheet.component').then(m => m.Timesheet) },
      { path: 'timesheet/approved', loadComponent: () => import('./features/timesheet/timesheet.component').then(m => m.Timesheet) },
  
      // Calendar page lazy-loaded
      { path: 'schedule/calendar', loadComponent: () => import('./features/calendar/calendar.component').then(m => m.Calendar) },
      
      // Settings page lazy-loaded
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
      
      // Logout route (reuses sign-in for simplicity; add logout logic in component)
      { path: 'logout', loadComponent: () => import('./features/auth/sign-in.component').then(m => m.SignInComponent) }
    ]
  },
  
  // Wildcard redirect for unknown paths
  { path: '**', redirectTo: 'sign-in' }
];