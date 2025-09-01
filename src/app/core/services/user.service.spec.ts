import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { getCurrentUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../../../amplify/data/resource';

describe('UserService', () => {
  let service: UserService;
  let mockClient: {
    models: {
      User: {
        list: jasmine.Spy;
        create: jasmine.Spy;
      };
    };
    graphql?: unknown;
    cancel?: (promise: Promise<any>, message?: string) => boolean;
    isCancelError?: (error: any) => boolean;
  };

  beforeEach(() => {
    mockClient = {
      models: {
        User: {
          list: jasmine.createSpy('list'),
          create: jasmine.createSpy('create'),
        },
      },
      graphql: jasmine.createSpy('graphql'),
      cancel: jasmine.createSpy('cancel').and.returnValue(true),
      isCancelError: jasmine.createSpy('isCancelError').and.returnValue(false),
    };

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
      Promise.resolve({ tokens: { accessToken: 'mock-token' } })
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
      Promise.resolve({ tokens: { accessToken: 'mock-token' } })
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
      Promise.resolve({ tokens: { accessToken: 'mock-token' } })
    );
    spyOn({ getCurrentUser }, 'getCurrentUser').and.returnValue(
      Promise.reject(new Error('Auth error'))
    );
    await service.load();
    expect(service.error()).toBe('Failed to load user');
    expect(service.loading()).toBeFalse();
  });
});
