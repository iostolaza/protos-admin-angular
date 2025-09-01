// src/app/features/contacts/contacts.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactsTableItemComponent } from './contacts-table-item/contacts-table-item.component';
import { ContactsService } from '../../core/services/contact.service';
import { UserService } from '../../core/services/user.service';
import { InputContact } from '../../core/models/contact';
import { getUrl } from 'aws-amplify/storage';
import { getIconPath } from '../../core/services/icon-preloader.service';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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

  constructor(private contactsService: ContactsService, private userService: UserService) {}

  getIconPath = getIconPath; 

  async ngOnInit(): Promise<void> {
    await this.userService.load();
    await this.loadContacts();
    this.setupSearch();
  }

 private async loadContacts(): Promise<void> {
    let nextToken: string | null | undefined = null;
    do {
      const { friends, nextToken: newToken } = await this.contactsService.getContacts(nextToken);
      const extendedFriends = await Promise.all(
        friends.map(async (f) => {
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
          return { ...f, imageUrl };
        })
      );
      this.contacts.push(...extendedFriends);
      nextToken = newToken;
    } while (nextToken);
    console.log('Contacts loaded:', this.contacts);
    this.updateSummary();
    this.updatedAgo = this.computeUpdatedAgo();
  }

   async performSearch(): Promise<void> {
    try {
      let nextToken: string | null | undefined = null;
      this.searchResults = [];
      do {
        const { users, nextToken: newToken } = await this.contactsService.searchPool(this.searchQuery, nextToken);
        const existingIds = new Set(this.contacts.map((c) => c.id));
        const filtered = users.filter((u) => !existingIds.has(u.id));
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
            return { ...u, imageUrl };
          })
        );
        this.searchResults.push(...extendedFiltered);
        nextToken = newToken;
      } while (nextToken);
      console.log('Search results:', this.searchResults);
    } catch (err) {
      console.error('Search error:', err);
    }
  }

  private setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe((query) => {
      this.performSearch();
    });
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }


  async addContact(user: InputContact): Promise<void> {
    try {
      await this.contactsService.addContact(user.id);
      const extendedUser = { ...user, dateAdded: new Date().toISOString() };
      this.contacts.push(extendedUser);
      this.searchResults = this.searchResults.filter((u) => u.id !== user.id);
      this.updateSummary();
      console.log('Contact added:', user);
    } catch (err) {
      console.error('Add contact error:', err);
    }
  }


  async onDelete(id: string): Promise<void> {
    try {
      await this.contactsService.deleteContact(id);
      this.contacts = this.contacts.filter((c) => c.id !== id);
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