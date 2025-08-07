// src/app/core/models/menu.model.ts

/*
Description: 
TypeScript interfaces for menu structure in sidebar navigation.
Label made required for type safety in templates and trackBy functions.
References:
- TypeScript interfaces for menu structure.
- Changed label to required for type safety in trackBy and templates (fixes TS2322).
*/

// SubMenuItem interface
export interface SubMenuItem {
  label: string;  // Made required to avoid undefined errors
  route: string | null;
  icon?: string;
  children?: SubMenuItem[];
  active?: boolean;
  expanded?: boolean;
}

// MenuItem interface
export interface MenuItem {
  group: string;
  separator?: boolean;
  items: SubMenuItem[];
  active?: boolean;
}
