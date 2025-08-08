/*
Models for sidebar menu structure; icon is a typed IconName.
*/

import type { IconName } from '../services/icon-preloader.service';

export interface SubMenuItem {
  label: string;
  route: string | null;
  icon?: IconName;
  children?: SubMenuItem[];
  active?: boolean;
  expanded?: boolean;
}

export interface MenuItem {
  group: string;
  separator?: boolean;
  items: SubMenuItem[];
  active?: boolean;
}
