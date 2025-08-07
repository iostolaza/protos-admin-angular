// src/app/core/constants/menu.ts

/*
Description: 
Constant menu data for the application sidebar navigation.
Structured with groups, items, and sub-items linked to routes and icons.
References:
- Angular docs: https://angular.dev/guide/routing/lazy-loading (v20)
- lannodev repo: https://github.com/lannodev/angular-tailwind/blob/main/src/app/core/constants/menu.ts
- Kept full paths for isActive matching; aligned with user menu; heroicons/outline for icons.
*/

// Import menu model
import { MenuItem } from '../models/menu.model';

// Export menu constant
export const Menu = {
  pages: [
    {
      group: 'Main',
      separator: false,
      items: [
        {
          label: 'Home',
          icon: 'assets/icons/heroicons/outline/chart-pie.svg',
          route: '/main-layout/home',
        },
        {
          label: 'Profile',
          icon: 'assets/icons/heroicons/outline/user-circle.svg',
          route: '/main-layout/profile',
        },
        {
          label: 'Messages',
          icon: 'assets/icons/heroicons/outline/bell.svg',
          route: null,
          children: [
            { label: 'Incoming', route: '/main-layout/messages/incoming' },
            { label: 'Outgoing', route: '/main-layout/messages/outgoing' },
          ],
        },
        {
          label: 'Contacts',
          icon: 'assets/icons/heroicons/outline/users.svg',
          route: null,
          children: [
            { label: 'Online', route: '/main-layout/contacts/online' },
            { label: 'New', route: '/main-layout/contacts/new' },
            { label: 'Favorites', route: '/main-layout/contacts/favorites' },
          ],
        },
      ],
    },
    {
      group: 'Productivity',
      separator: true,
      items: [
        {
          label: 'Timesheet',
          icon: 'assets/icons/heroicons/outline/folder.svg',
          route: '/main-layout/timesheet',
        },
        {
          label: 'Schedule',
          icon: 'assets/icons/heroicons/outline/download.svg',
          route: null,
          children: [
            { label: 'Calendar', route: '/main-layout/schedule/calendar' },
          ],
        },
        {
          label: 'Analytics',
          icon: 'assets/icons/heroicons/outline/chart-pie.svg',
          route: '/main-layout/analytics',
        },
      ],
    },
    {
      group: 'Account',
      separator: false,
      items: [
        {
          label: 'Settings',
          icon: 'assets/icons/heroicons/outline/cog.svg',
          route: '/main-layout/settings',
        },
        {
          label: 'Logout',
          icon: 'assets/icons/heroicons/outline/lock-closed.svg',
          route: '/logout',
        },
      ],
    },
  ] as MenuItem[],
};
