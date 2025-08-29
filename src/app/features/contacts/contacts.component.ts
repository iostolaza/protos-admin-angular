// src/app/features/contacts/contacts.component.ts
import { AfterViewInit, Component, ViewChild, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MessageService } from '../../core/services/message.service';
import { ContactsService } from '../../core/services/contact.service';
import type { Schema } from '../../../../amplify/data/resource';

type User = Schema['User']['type'];
type Contact = User & {
  expanded: boolean;
};

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule // Added for pagination
  ],
  templateUrl: './contacts.component.html',
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', opacity: 0 })),
      state('expanded', style({ height: '*', opacity: 1 })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsComponent implements OnInit, AfterViewInit {
  private contactsService = inject(ContactsService);
  private messageService = inject(MessageService);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  contacts = signal<Contact[]>([]);
  dataSource = new MatTableDataSource<Contact>([]);
  search = signal<string>('');
  addSearch = signal<string>('');
  expandedElement = signal<Contact | null>(null);
  displayedColumns = ['id', 'name', 'email', 'mobile', 'dateJoined', 'salary', 'projects', 'action', 'expand'];

  totalContacts = computed(() => this.contacts().length);
  onlineContacts = computed(() => this.contacts().filter(c => c.status === 'online').length);
  recentContacts = computed(() => this.contacts().filter(c => new Date(c.dateJoined) > new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)).length);

  ngOnInit() {
    this.loadContacts();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  async loadContacts(nextToken?: string | null) {
    try {
      const { friends, nextToken: newToken } = await this.contactsService.getContacts(nextToken);
      this.contacts.update(prev => [
        ...prev,
        ...friends.map((f: User) => ({
          ...f,
          expanded: false,
          status: f.status || 'offline', // Fallback if not in schema
          role: f.accessLevel || 'Contact' // Use accessLevel as fallback for role
        } as Contact))
      ]);
      this.dataSource.data = this.contacts();
      if (newToken) this.loadContacts(newToken);
    } catch (error) {
      console.error('Load contacts error:', error);
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.search.set(filterValue);
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  toggleExpand(element: Contact) {
    this.expandedElement.set(this.expandedElement() === element ? null : element);
  }

  async addContact(query: string) {
    try {
      const users = await this.contactsService.searchPool(query);
      if (users.length) {
        await this.contactsService.addContact(users[0].id);
        this.loadContacts();
      }
    } catch (error) {
      console.error('Add contact error:', error);
    }
  }

  async messageContact(id: string) {
    await this.messageService.getOrCreateChannel(id);
    // Navigate or emit to open chat
  }

  async deleteContact(id: string) {
    await this.contactsService.deleteContact(id);
    this.contacts.update(prev => prev.filter(c => c.id !== id));
    this.dataSource.data = this.contacts();
  }

  trackById(index: number, item: Contact): string {
    return item.id;
  }
}