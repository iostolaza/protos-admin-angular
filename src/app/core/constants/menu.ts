/* Menu constants, unchanged. */

import { MenuItem } from '../models/menu.model';

export const Menu = {
  pages: [
    {
      group: 'Main',
      separator: true,
      items: [
        { label: 'Home', icon: 'home', route: '/main-layout/home' },
        { label: 'Profile', icon: 'user-circle', route: '/main-layout/profile' },
        {
          label: 'Messages', icon: 'inbox-stack', route: null,
          children: [
            { label: 'Incoming', route: '/main-layout/messages/incoming' },
            { label: 'Outgoing', route: '/main-layout/messages/outgoing' }
          ],
        },
        {
          label: 'Contacts', icon: 'users', route: null,
          children: [
            { label: 'Online', route: '/main-layout/contacts/online' },
            { label: 'New', route: '/main-layout/contacts/new' },
            { label: 'Favorites', route: '/main-layout/contacts/favorites' }
          ],
        }
      ],
    },
    {
      group: 'Productivity',
      separator: true,
      items: [

        { label: 'Analytics', icon: 'chart-bar', route: '/main-layout/analytics' },
        { 
          label: 'Timesheet', icon: 'clock', route: null,
          children: [
            { label: 'submitted', route: '/main-layout/timesheet/submitted' },
            { label: 'pending', route: '/main-layout/timesheet/pending' },
            { label: 'approved', route: '/main-layout/timesheet/approved' }
          ],
        },     
        {
          label: 'Schedule', icon: 'calendar-date-range', route: null,
          children: [
            { label: 'Calendar', route: '/main-layout/schedule/calendar' }
          ],
        },
      ],
    },
    {
      group: 'Account',
      separator: false,
      items: [
        { label: 'Settings', icon: 'cog', route: '/main-layout/settings' },
        { label: 'Logout', icon: 'logout', route: '/logout' }
      ],
    }
  ] as MenuItem[],
};
