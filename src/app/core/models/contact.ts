// src/app/core/models/contact.ts
export interface InputContact {
  id: string; // Add this
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profileImageKey?: string;
  status?: string;
  dateAdded?: string;
}