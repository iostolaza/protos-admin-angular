/*
 * UserService: Manages user data with BehaviorSubject for reactivity.
 * Mock backend for dev. If you enable Amplify later:
 *  - ensure aws-amplify is installed,
 *  - run amplify codegen / codegen types to generate src/graphql files,
 *  - then re-add generateClient/Storage/queries imports with correct paths.
 */
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/* NOTE: Removed broken/unused Amplify imports to silence TS errors.
   If you want Amplify client code:
   import { generateClient } from 'aws-amplify/data';
   import { Storage } from 'aws-amplify';
   import * as queries from 'src/graphql/queries';
   import * as mutations from 'src/graphql/mutations';
   import type { Schema } from '../../amplify/data/resource';
*/

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  accessLevel: string;
  address: { line1: string; city: string; state: string; zip: string; country: string };
  contactPrefs: { email: boolean; push: boolean };
  paymentMethods: Array<{ id: string; type: string; name: string }>;
  emergencyContact: { name: string; phone: string; email: string; address: string };
  vehicle: { make: string; model: string; color: string; license: string; year: string };
  profileImageKey: string;
}

// Mock for dev
class MockUserBackendService {
  private mockUser: User = {
    id: 'mock-id',
    firstName: 'Ismael',
    lastName: 'Ostolaza',
    username: 'iostolaza87',
    email: 'i.ostolaza87@gmail.com',
    accessLevel: 'Admin',
    address: { line1: '727 S. Mansfield Avenue, Unit 8', city: 'Los Angeles', state: 'CA', zip: '90036', country: 'United States' },
    contactPrefs: { email: true, push: true },
    paymentMethods: [{ id: '1', type: 'Bank', name: 'Personal Checking Account Number 1881' }, { id: '2', type: 'Card', name: 'Visa ****3617' }],
    emergencyContact: { name: 'Laura Bravo (Aunt)', phone: '(415) 516-2761', email: 'laura.bravo77@gmail.com', address: '3101 Barmouth Dr Antioch CA 94509' },
    vehicle: { make: 'Tesla', model: 'Y', color: 'Grey', license: '21PH60', year: '2023' },
    profileImageKey: '',
  };

  async loadUser(): Promise<User> {
    return this.mockUser;
  }

  async saveUser(user: User): Promise<void> {
    this.mockUser = user;
  }
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private backend = new MockUserBackendService(); // Switch to new class AmplifyUserBackendService for prod
  private userSubject = new BehaviorSubject<User | null>(null);

  user$ = this.userSubject.asObservable();

  async load() {
    const user = await this.backend.loadUser();
    this.userSubject.next(user);
  }

  async save(user: User) {
    await this.backend.saveUser(user);
    this.userSubject.next(user);
  }
}
