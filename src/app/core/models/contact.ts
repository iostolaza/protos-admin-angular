// src/app/core/models/contact.ts
import { type Schema } from '../../../../amplify/data/resource'; // Adjust path as per directory

export type Contact = Schema['User']['type'];

export type InputContact = Pick<Contact, 'id' | 'firstName' | 'lastName' | 'username' | 'email' | 'profileImageKey'> & {
  dateAdded?: string;
  imageUrl?: string;
};