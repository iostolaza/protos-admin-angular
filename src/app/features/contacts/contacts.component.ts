// src/app/features/contacts/contacts.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactsTableItemComponent } from './contacts-table-item/contacts-table-item.component';
import { ContactsService } from '../../core/services/contact.service';
import { InputContact } from '../../core/models/contact';
import { getUrl } from 'aws-amplify/storage';

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss'],
  standalone: true,
  imports: [CommonModule, NgFor, FormsModule, ContactsTableItemComponent],
})
export class ContactsComponent implements OnInit {
  public contacts: InputContact[] = [];
  public searchResults: InputContact[] = [];
  public searchQuery: string = '';
  public updatedAgo: string = 'a moment ago'; // Can compute dynamically

  constructor(private contactsService: ContactsService) {}

  async ngOnInit(): Promise<void> {
    await this.loadContacts();
  }

  private async loadContacts(): Promise<void> {
    let nextToken: string | null | undefined = null;
    do {
      const { friends, nextToken: newToken } = await this.contactsService.getContacts(nextToken);
      const extendedFriends = await Promise.all(friends.map(async (f) => {
        let imageUrl: string | undefined;
        if (f.profileImageKey) {
          try {
            const { url } = await getUrl({
              path: f.profileImageKey,
              options: { expiresIn: 3600 }, // 1 hour expiration for security
            });
            imageUrl = url.toString();
          } catch (err) {
            console.error('Error getting image URL:', err);
            imageUrl = 'assets/profile/avatar-default.svg';
          }
        } else {
          imageUrl = 'assets/profile/avatar-default.svg';
        }
        return { ...f, imageUrl };
      }));
      this.contacts.push(...extendedFriends);
      nextToken = newToken;
    } while (nextToken);
    this.updatedAgo = this.computeUpdatedAgo();
  }

  async performSearch(): Promise<void> {
    let nextToken: string | null | undefined = null;
    this.searchResults = [];
    do {
      const { users, nextToken: newToken } = await this.contactsService.searchPool(this.searchQuery, nextToken);
      const existingIds = new Set(this.contacts.map(c => c.id));
      const filtered = users.filter(u => !existingIds.has(u.id));
      const extendedFiltered = await Promise.all(filtered.map(async (u) => {
        let imageUrl: string | undefined;
        if (u.profileImageKey) {
          try {
            const { url } = await getUrl({
              path: u.profileImageKey,
              options: { expiresIn: 3600 }, // 1 hour expiration for security
            });
            imageUrl = url.toString();
          } catch (err) {
            console.error('Error getting image URL:', err);
            imageUrl = 'assets/profile/avatar-default.svg';
          }
        } else {
          imageUrl = 'assets/profile/avatar-default.svg';
        }
        return { ...u, imageUrl };
      }));
      this.searchResults.push(...extendedFiltered);
      nextToken = newToken;
    } while (nextToken);
  }

  async addContact(user: InputContact): Promise<void> {
    await this.contactsService.addContact(user.id);
    const extendedUser = { ...user, dateAdded: new Date().toISOString() }; // Approximate dateAdded
    this.contacts.push(extendedUser);
    this.searchResults = this.searchResults.filter(u => u.id !== user.id);
  }

  async onDelete(id: string): Promise<void> {
    await this.contactsService.deleteContact(id);
    this.contacts = this.contacts.filter(c => c.id !== id);
  }

  private computeUpdatedAgo(): string {
    // Logic to compute time ago, e.g., manual
    return '37 minutes ago'; // Placeholder
  }
}