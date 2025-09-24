
// src/app/features/home/home.component.ts


import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { getCurrentUser, fetchUserAttributes, signOut } from 'aws-amplify/auth';
import { MessageService } from '../../core/services/message.service';
import { ContactService } from '../../core/services/contact.service';
import { TicketService } from '../../core/services/ticket.service';
import { DocumentService } from '../../core/services/document.service';
import { FinancialService } from '../../core/services/financial.service';
import { UserService } from '../../core/services/user.service'; // Added

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  private router = inject(Router);
  private messageService = inject(MessageService);
  private contactService = inject(ContactService);
  private ticketService = inject(TicketService);
  private documentService = inject(DocumentService);
  private financialService = inject(FinancialService);
  private userService = inject(UserService); // Injected

  user = this.userService.user; // Use UserService signal
  metrics = signal<{ name: string; value: string }[]>([]);

  async ngOnInit() {
    try {
      await getCurrentUser();
      const attributes = await fetchUserAttributes();
      // if (attributes.picture) this.userService.user()?.profileImageUrl = attributes.picture; // Update if exists

      // Dynamic summaries from services (placeholders for real data)
      const unreadMessages = 5;
      const totalContacts = 42;
      const ticketCount =  10;
      const docCount =  150;
      const balance = '$12,345';

      // const unreadMessages = await this.messageService.getUnreadCount() || 5;
      // const totalContacts = await this.contactService.getTotalContacts() || 42;
      // const ticketCount = await this.ticketService.getOpenTicketsCount() || 10;
      // const docCount = await this.documentService.getRecentDocumentsCount() || 150;
      // const balance = await this.financialService.getBalance() || '$12,345';

      this.metrics.set([
        { name: 'Messages', value: `Unread: ${unreadMessages}` },
        { name: 'Contacts', value: `Total: ${totalContacts}` },
        { name: 'Tickets', value: `Open: ${ticketCount}` },
        { name: 'Documents', value: `Recent: ${docCount}` },
        { name: 'Financial', value: `Balance: ${balance}` },
        { name: 'Profile', value: `Last Login: ${new Date().toLocaleDateString()}` },
      ]);
    } catch (error) {
      console.error('Error fetching user or data:', error);
      this.router.navigate(['/auth']);
    }
  }

  async handleSignOut() {
    try {
      await signOut();
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}


// import { Component, inject, OnInit, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { getCurrentUser, signOut, fetchUserAttributes } from 'aws-amplify/auth';

// @Component({
//   selector: 'app-home',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './home.component.html',
// })
// export class Home implements OnInit {
//   private router = inject(Router);
//   userEmail = signal<string>('');
//   profileImage = signal<string>('assets/profile/profile-female.jpg');
//   metrics = signal<{ name: string; value: string }[]>([
//     { name: 'Users', value: '1,200' },
//     { name: 'Revenue', value: '$45,000' },
//     { name: 'Orders', value: '320' },
//     { name: 'Growth', value: '15%' }
//   ]);

//   async ngOnInit() {
//     try {
//       await getCurrentUser();
//       const attributes = await fetchUserAttributes();
//       this.userEmail.set(attributes.email || 'User');
//       if (attributes.picture) this.profileImage.set(attributes.picture);
//     } catch (error) {
//       console.error('Error fetching user:', error);
//       this.router.navigate(['/auth']);
//     }
//   }

//   async handleSignOut() {
//     try {
//       await signOut();
//       this.router.navigate(['/auth']);
//     } catch (error) {
//       console.error('Sign out error:', error);
//     }
//   }
// }
