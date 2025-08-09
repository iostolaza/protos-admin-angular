/*
Sidebar menu data
- Use IconName keys (not file paths) so we can resolve via getIconPath()
*/

import { MenuItem } from '../models/menu.model';

export const Menu = {
  pages: [
    {
      group: 'Main',
      separator: true,
      items: [
        { label: 'Home',     icon: 'chart-pie',   route: '/main-layout/home' },
        { label: 'Profile',  icon: 'user-circle', route: '/main-layout/profile' },
        {
          label: 'Messages', icon: 'bell',        route: null,
          children: [
            { label: 'Incoming',  route: '/main-layout/messages/incoming' },
            { label: 'Outgoing',  route: '/main-layout/messages/outgoing' }
          ],
        },
        {
          label: 'Contacts', icon: 'users',       route: null,
          children: [
            { label: 'Online',    route: '/main-layout/contacts/online' },
            { label: 'New',       route: '/main-layout/contacts/new' },
            { label: 'Favorites', route: '/main-layout/contacts/favorites' }
          ],
        }
      ],
    },
    {
      group: 'Productivity',
      separator: true,
      items: [
        { label: 'Timesheet',  icon: 'folder',     route: '/main-layout/timesheet' },
         { label: 'Analytics',  icon: 'chart-pie',  route: '/main-layout/analytics' },
        {
          label: 'Schedule',   icon: 'download',   route: null,
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
        { label: 'Settings', icon: 'cog',         route: '/main-layout/settings' },
        { label: 'Logout',   icon: 'lock-closed', route: '/logout' }
      ],
    }
  ] as MenuItem[],
};
