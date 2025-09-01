import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { getCurrentUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../../../amplify/data/resource';
import type { V6Client } from 'aws-amplify/api';

describe('UserService', () => {
  let service: UserService;
  let mockClient: V6Client<Schema>;

  beforeEach(() => {
    mockClient = {
      models: {
        User: {
          list: jasmine.createSpy('list').and.returnValue(
            Promise.resolve({
              data: [],
              errors: undefined,
            })
          ),
          create: jasmine.createSpy('create').and.returnValue(
            Promise.resolve({
              data: null,
              errors: undefined,
            })
          ),
        },
        PaymentMethod: {
          list: jasmine.createSpy('list').and.returnValue(
            Promise.resolve({
              data: [],
              errors: undefined,
            })
          ),
          create: jasmine.createSpy('create').and.returnValue(
            Promise.resolve({
              data: null,
              errors: undefined,
            })
          ),
          update: jasmine.createSpy('update').and.returnValue(
            Promise.resolve({
              data: null,
              errors: undefined,
            })
          ),
          delete: jasmine.createSpy('delete').and.returnValue(
            Promise.resolve({
              data: null,
              errors: undefined,
            })
          ),
        },
      },
      graphql: jasmine.createSpy('graphql'),
      cancel: jasmine.createSpy('cancel').and.returnValue(true),
      isCancelError: jasmine.createSpy('isCancelError').and.returnValue(false),
    } as unknown as V6Client<Schema>;

    TestBed.configureTestingModule({
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
    spyOn({ generateClient }, 'generateClient').and.returnValue(mockClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load user correctly', async () => {
    spyOn({ fetchAuthSession }, 'fetchAuthSession').and.returnValue(
      Promise.resolve({
        tokens: {
          accessToken: { toString: () => 'mock-token', payload: {} },
          idToken: { toString: () => 'mock-id-token', payload: {} },
        },
      })
    );
    spyOn({ getCurrentUser }, 'getCurrentUser').and.returnValue(
      Promise.resolve({ userId: 'test-sub', username: 'testuser' })
    );
    spyOn({ fetchUserAttributes }, 'fetchUserAttributes').and.returnValue(
      Promise.resolve({ email: 'test@example.com' })
    );
    mockClient.models.User.list.and.returnValue(
      Promise.resolve({
        data: [
          {
            id: 'user1',
            firstName: 'Test',
            lastName: 'User',
            username: 'testuser',
            email: 'test@example.com',
            accessLevel: 'basic',
            dateJoined: new Date().toISOString(),
          },
        ],
        errors: undefined,
      })
    );
    await service.load();
    expect(service.user$()).not.toBeNull();
    expect(service.user$()?.firstName).toBe('Test');
    expect(service.loading()).toBeFalse();
  });

  it('should create user if none exists', async () => {
    spyOn({ fetchAuthSession }, 'fetchAuthSession').and.returnValue(
      Promise.resolve({
        tokens: {
          accessToken: { toString: () => 'mock-token', payload: {} },
          idToken: { toString: () => 'mock-id-token', payload: {} },
        },
      })
    );
    spyOn({ getCurrentUser }, 'getCurrentUser').and.returnValue(
      Promise.resolve({ userId: 'test-sub', username: 'testuser' })
    );
    spyOn({ fetchUserAttributes }, 'fetchUserAttributes').and.returnValue(
      Promise.resolve({ email: 'test@example.com' })
    );
    mockClient.models.User.list.and.returnValue(Promise.resolve({ data: [], errors: undefined }));
    mockClient.models.User.create.and.returnValue(
      Promise.resolve({
        data: {
          id: 'user1',
          firstName: 'First Name',
          lastName: 'Last Name',
          username: 'defaultUser',
          email: 'test@example.com',
          accessLevel: 'basic',
          dateJoined: new Date().toISOString(),
        },
        errors: undefined,
      })
    );
    await service.load();
    expect(mockClient.models.User.create).toHaveBeenCalled();
    expect(service.user$()).not.toBeNull();
  });

  it('should handle authentication failure', async () => {
    spyOn({ fetchAuthSession }, 'fetchAuthSession').and.returnValue(
      Promise.resolve({ tokens: undefined })
    );
    await service.load();
    expect(service.error()).toBe('User not authenticated');
    expect(service.loading()).toBeFalse();
  });

  it('should handle API errors', async () => {
    spyOn({ fetchAuthSession }, 'fetchAuthSession').and.returnValue(
      Promise.resolve({
        tokens: {
          accessToken: { toString: () => 'mock-token', payload: {} },
          idToken: { toString: () => 'mock-id-token', payload: {} },
        },
      })
    );
    spyOn({ getCurrentUser }, 'getCurrentUser').and.returnValue(
      Promise.reject(new Error('Auth error'))
    );
    await service.load();
    expect(service.error()).toBe('Failed to load user');
    expect(service.loading()).toBeFalse();
  });

  it('should get payment methods', async () => {
    spyOn({ fetchAuthSession }, 'fetchAuthSession').and.returnValue(
      Promise.resolve({
        tokens: {
          accessToken: { toString: () => 'mock-token', payload: {} },
          idToken: { toString: () => 'mock-id-token', payload: {} },
        },
      })
    );
    service.user$.set({
      id: 'test-sub',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      accessLevel: 'basic',
      address: { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
      contactPrefs: { email: false, push: false },
      emergencyContact: { name: 'N/A', phone: '000-000-0000', email: 'na@default.com', address: 'N/A' },
      vehicle: { make: '', model: '', color: '', license: '', year: '' },
      profileImageKey: '',
    });
    mockClient.models.PaymentMethod.list.and.returnValue(
      Promise.resolve({
        data: [
          { id: 'pm1', type: 'credit', name: 'Visa' },
        ],
        errors: undefined,
      })
    );
    const paymentMethods = await service.getPaymentMethods();
    expect(paymentMethods).toEqual([{ id: 'pm1', type: 'credit', name: 'Visa' }]);
  });

  it('should add payment method', async () => {
    spyOn({ fetchAuthSession }, 'fetchAuthSession').and.returnValue(
      Promise.resolve({
        tokens: {
          accessToken: { toString: () => 'mock-token', payload: {} },
          idToken: { toString: () => 'mock-id-token', payload: {} },
        },
      })
    );
    service.user$.set({
      id: 'test-sub',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      email: 'test@example.com',
      accessLevel: 'basic',
      address: { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
      contactPrefs: { email: false, push: false },
      emergencyContact: { name: 'N/A', phone: '000-000-0000', email: 'na@default.com', address: 'N/A' },
      vehicle: { make: '', model: '', color: '', license: '', year: '' },
      profileImageKey: '',
    });
    mockClient.models.PaymentMethod.create.and.returnValue(
      Promise.resolve({
        data: { id: 'pm1', userId: 'test-sub', type: 'credit', name: 'Visa' },
        errors: undefined,
      })
    );
    await service.addPaymentMethod('credit', 'Visa');
    expect(mockClient.models.PaymentMethod.create).toHaveBeenCalledWith({ userId: 'test-sub', type: 'credit', name: 'Visa' });
  });

  it('should update payment method', async () => {
    spyOn({ fetchAuthSession }, 'fetchAuthSession').and.returnValue(
      Promise.resolve({
        tokens: {
          accessToken: { toString: () => 'mock-token', payload: {} },
          idToken: { toString: () => 'mock-id-token', payload: {} },
        },
      })
    );
    mockClient.models.PaymentMethod.update.and.returnValue(
      Promise.resolve({
        data: { id: 'pm1', type: 'credit', name: 'MasterCard' },
        errors: undefined,
      })
    );
    await service.updatePaymentMethod('pm1', 'credit', 'MasterCard');
    expect(mockClient.models.PaymentMethod.update).toHaveBeenCalledWith({ id: 'pm1', type: 'credit', name: 'MasterCard' });
  });

  it('should delete payment method', async () => {
    spyOn({ fetchAuthSession }, 'fetchAuthSession').and.returnValue(
      Promise.resolve({
        tokens: {
          accessToken: { toString: () => 'mock-token', payload: {} },
          idToken: { toString: () => 'mock-id-token', payload: {} },
        },
      })
    );
    mockClient.models.PaymentMethod.delete.and.returnValue(
      Promise.resolve({
        data: { id: 'pm1' },
        errors: undefined,
      })
    );
    await service.deletePaymentMethod('pm1');
    expect(mockClient.models.PaymentMethod.delete).toHaveBeenCalledWith({ id: 'pm1' });
  });
});
