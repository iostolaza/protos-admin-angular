import { Component, OnInit, OnDestroy, signal } from '@angular/core'; // UPDATED: Added signal
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
import { Router } from '@angular/router'; // NEW: For navigation
import { getCurrentUser } from 'aws-amplify/auth'; // NEW: For self exclusion

type UserType = Schema['User']['type'];

@Component({
  selector: 'app-contacts',
  templateUrl: './contacts.component.html',
  styleUrl: './contacts.component.scss',
  standalone: true,
  imports: [CommonModule, FormsModule, ContactsTableItemComponent, AngularSvgIconModule],
})
export class ContactsComponent implements OnInit, OnDestroy {
  public contacts = signal<InputContact[]>([]); // UPDATED: Signal for reactivity
  public searchResults = signal<InputContact[]>([]); // UPDATED: Signal for reactivity
  public searchQuery: string = '';
  public updatedAgo: string = 'a moment ago';
  public onlineContacts: number = 0;
  public recentContacts: InputContact[] = [];
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private contactsService: ContactService, 
    private userService: UserService,
    private router: Router // NEW: Inject Router
  ) {}

  getIconPath = getIconPath;

  trackByCognitoId(index: number, item: InputContact): string { // NEW: trackBy for ngFor perf
    return item.cognitoId;
  }

  async ngOnInit(): Promise<void> {
    await this.userService.load();
    await this.loadContacts();
    this.setupSearch();
    this.setupRealTime();
  }

  private async loadContacts(): Promise<void> {
    try {
      const accumulated: InputContact[] = []; // NEW: Accumulate then set signal
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
        accumulated.push(...extendedFriends);
        nextToken = newToken ?? null;
      } while (nextToken);
      this.contacts.set(accumulated); // UPDATED: Set signal
      console.log('Contacts loaded:', this.contacts());
      this.updateSummary();
      this.updatedAgo = this.computeUpdatedAgo();
    } catch (err) {
      console.error('Load contacts error:', err);
    }
  }

  async performSearch(): Promise<void> {
    try {
      const { userId: currentUserId } = await getCurrentUser(); // NEW: Get current ID for exclusion
      const accumulated: InputContact[] = []; // NEW: Accumulate
      let nextToken: string | null = null;
      do {
        const { users, nextToken: newToken } = await this.contactsService.searchPool(this.searchQuery, nextToken);
        const existingIds = new Set(this.contacts().map((c) => c.cognitoId));
        const filtered = users.filter((u) => !existingIds.has(u.cognitoId) && u.cognitoId !== currentUserId); // UPDATED: Exclude self and existing
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
        accumulated.push(...extendedFiltered);
        nextToken = newToken ?? null;
      } while (nextToken);
      this.searchResults.set(accumulated); // UPDATED: Set signal
      console.log('Search results:', this.searchResults());
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
      const { userId } = await getCurrentUser(); // NEW: Check not self
      if (user.cognitoId === userId) return; // Prevent self-add
      await this.contactsService.addContact(user.cognitoId);
      const extendedUser = { ...user, dateAdded: new Date().toISOString() };
      this.contacts.update(curr => [...curr, extendedUser]); // UPDATED: Update signal (incremental)
      this.searchResults.update(curr => curr.filter((u) => u.cognitoId !== user.cognitoId)); // UPDATED: Signal
      this.updateSummary();
      console.log('Contact added:', user);
    } catch (err) {
      console.error('Add contact error:', err);
    }
  }

  async onDelete(id: string): Promise<void> {
    try {
      await this.contactsService.deleteContact(id);
      this.contacts.update(curr => curr.filter((c) => c.cognitoId !== id)); // UPDATED: Update signal (incremental)
      this.updateSummary();
      console.log('Contact deleted:', id);
    } catch (err) {
      console.error('Delete contact error:', err);
    }
  }

  async onMessage(id: string): Promise<void> { // NEW: Handle message navigation
    try {
      const channel = await this.contactsService.getOrCreateChannel(id);
      this.router.navigate(['/messages', channel.id]); // Assume route; adjust as needed
    } catch (err) {
      console.error('Start message error:', err);
    }
  }

  private updateSummary(): void {
    this.onlineContacts = this.contacts().filter((c) => c.status === 'online').length; // UPDATED: Use signal()
    this.recentContacts = this.contacts()
      .slice()
      .sort((a, b) => new Date(b.dateAdded || '').getTime() - new Date(a.dateAdded || '').getTime())
      .slice(0, 3);
  }

  private computeUpdatedAgo(): string {
    return '37 minutes ago'; // Replace with actual logic if needed
  }

  private setupRealTime() {
    this.contactsService.observeContacts()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadContacts(); // Refresh full (safe with signal set)
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}