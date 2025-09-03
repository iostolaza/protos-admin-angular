import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../core/services/contact.service';
import { UserService } from '../../core/services/user.service';
import { InputContact } from '../../core/models/contact';
import { getUrl } from 'aws-amplify/storage';
import { getIconPath } from '../../core/services/icon-preloader.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ContactsTableItemComponent } from './contacts-table-item/contacts-table-item.component';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import type { Schema } from '../../../../amplify/data/resource';

type UserType = Schema['User']['type'];

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, ContactsTableItemComponent, AngularSvgIconModule],
})
export class ContactsComponent implements OnInit, OnDestroy {
  public contacts: InputContact[] = [];
  public searchResults: InputContact[] = [];
  public searchQuery: string = '';
  public updatedAgo: string = 'a moment ago';
  public onlineContacts: number = 0;
  public recentContacts: InputContact[] = [];
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private contactsService: ContactService, private userService: UserService) {}

  getIconPath = getIconPath;

  async ngOnInit(): Promise<void> {
    await this.userService.load();
    await this.loadContacts();
    this.setupSearch();
  }

  private async loadContacts(): Promise<void> {
    let nextToken: string | null = null;
    do {
      const { friends, nextToken: newToken } = await this.contactsService.getContacts(nextToken);
      const extendedFriends = await Promise.all(
        friends.map(async (f: UserType & { imageUrl?: string }) => {
          let imageUrl: string | undefined;
          if (f.profileImageKey) {
            try {
              const { url } = await getUrl({
                path: f.profileImageKey,
                options: { expiresIn: 3600 },
              });
              imageUrl = url.toString();
            } catch (err) {
              console.error('Error getting image URL:', err);
              imageUrl = 'assets/profile/avatar-default.svg';
            }
          } else {
            imageUrl = 'assets/profile/avatar-default.svg';
          }
          return {
            ...f,
            imageUrl,
            firstName: f.firstName ?? '',
            lastName: f.lastName ?? '',
            username: f.username ?? '',
            createdAt: f.createdAt ?? null,
          } as InputContact;
        })
      );
      this.contacts.push(...extendedFriends);
      nextToken = newToken ?? null;
    } while (nextToken);
    console.log('Contacts loaded:', this.contacts);
    this.updateSummary();
    this.updatedAgo = this.computeUpdatedAgo();
  }

  async performSearch(): Promise<void> {
    try {
      let nextToken: string | null = null;
      this.searchResults = [];
      do {
        const { users, nextToken: newToken } = await this.contactsService.searchPool(this.searchQuery, nextToken);
        const existingIds = new Set(this.contacts.map((c) => c.cognitoId));
        const filtered = users.filter((u) => !existingIds.has(u.cognitoId));
        const extendedFiltered = await Promise.all(
          filtered.map(async (u) => {
            let imageUrl: string | undefined;
            if (u.profileImageKey) {
              try {
                const { url } = await getUrl({
                  path: u.profileImageKey,
                  options: { expiresIn: 3600 },
                });
                imageUrl = url.toString();
              } catch (err) {
                console.error('Error getting image URL:', err);
                imageUrl = 'assets/profile/avatar-default.svg';
              }
            } else {
              imageUrl = 'assets/profile/avatar-default.svg';
            }
            return {
              ...u,
              imageUrl,
              createdAt: u.createdAt ?? null,
            } as InputContact;
          })
        );
        this.searchResults.push(...extendedFiltered);
        nextToken = newToken ?? null;
      } while (nextToken);
      console.log('Search results:', this.searchResults);
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  private setupSearch() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.performSearch();
      });
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  async addContact(user: InputContact): Promise<void> {
    try {
      await this.contactsService.addContact(user.cognitoId);
      const extendedUser = { ...user, dateAdded: new Date().toISOString() };
      this.contacts.push(extendedUser);
      this.searchResults = this.searchResults.filter((u) => u.cognitoId !== user.cognitoId);
      this.updateSummary();
      console.log('Contact added:', user);
    } catch (err) {
      console.error('Add contact error:', err);
    }
  }

  async onDelete(id: string): Promise<void> {
    try {
      await this.contactsService.deleteContact(id);
      this.contacts = this.contacts.filter((c) => c.cognitoId !== id);
      this.updateSummary();
      console.log('Contact deleted:', id);
    } catch (err) {
      console.error('Delete contact error:', err);
    }
  }

  private updateSummary(): void {
    this.onlineContacts = this.contacts.filter((c) => c.status === 'online').length;
    this.recentContacts = this.contacts
      .slice()
      .sort((a, b) => new Date(b.dateAdded || '').getTime() - new Date(a.dateAdded || '').getTime())
      .slice(0, 3);
  }

  private computeUpdatedAgo(): string {
    return '37 minutes ago'; // Replace with actual logic if needed
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
