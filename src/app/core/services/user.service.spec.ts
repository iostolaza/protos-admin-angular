import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';
import { Amplify } from 'aws-amplify';
import type { Schema } from '../../../../amplify/data/resource';
import * as auth from 'aws-amplify/auth';
import { of } from 'rxjs';

Amplify.configure({}); // Mock config for testing

describe('UserService', () => {
  let service: UserService;
  let mockClient: any;

  beforeEach() => {
    mockClient = {
      models: {
        User: {
          get: jasmine.createSpy('get').and.returnValue(Promise.resolve({
            data: { id: 'test', profileImageKey: null, username: 'testuser' } as Schema['models']['User']['type'],
            errors: undefined,
          })),
          update: jasmine.createSpy('update').and.returnValue(Promise.resolve({
            data: { id: 'test', username: 'testuser' } as Schema['models']['User']['type'],
            errors: undefined,
          })),
          observeQuery: jasmine.createSpy('observeQuery').and.returnValue(
            of({ items: [{ id: 'test', username: 'testuser' } as Schema['models']['User']['type']] })
          ),
        },
        PaymentMethod: {
          list: jasmine.createSpy('list').and.returnValue(Promise.resolve({
            data: [] as Schema['models']['PaymentMethod']['type'][],
            errors: undefined,
          })),
          create: jasmine.createSpy('create').and.returnValue(Promise.resolve({ errors: undefined })),
          update: jasmine.createSpy('update').and.returnValue(Promise.resolve({ errors: undefined })),
          delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve({ errors: undefined })),
        },
      },
    };

    spyOn(auth, 'getCurrentUser').and.returnValue(Promise.resolve({
      userId: 'test',
      username: 'testuser',
      signInDetails: {},
    }));

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: 'generateClient', useValue: () => mockClient },
      ],
    });
    service = TestBed.inject(UserService);
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update user', async () => {
    await service.updateUser({ firstName: 'Test' });
    expect(mockClient.models.User.update).toHaveBeenCalled();
  });

  it('should get payment methods', async () => {
    const methods = await service.getPaymentMethods();
    expect(methods).toEqual([]);
    expect(mockClient.models.PaymentMethod.list).toHaveBeenCalled();
  });

  it('should add payment method', async () => {
    await service.addPaymentMethod('card', 'Visa');
    expect(mockClient.models.PaymentMethod.create).toHaveBeenCalled();
  });

  it('should update payment method', async () => {
    await service.updatePaymentMethod('id1', 'card', 'MasterCard');
    expect(mockClient.models.PaymentMethod.update).toHaveBeenCalled();
  });

  it('should delete payment method', async () => {
    await service.deletePaymentMethod('id1');
    expect(mockClient.models.PaymentMethod.delete).toHaveBeenCalled();
  });

  it('should handle get user error', async () => {
    mockClient.models.User.get.and.returnValue(Promise.resolve({ data: null, errors: [{ message: 'Not found' }] }));
    spyOn(console, 'error');
    await service.load();
    expect(console.error).toHaveBeenCalledWith('Load user error:', jasmine.any(Error));
  });

  it('should handle observeQuery subscription', () => {
    expect(mockClient.models.User.observeQuery).toHaveBeenCalled();
    const user = service.user$();
    expect(user).toEqual(jasmine.objectContaining({ id: 'test', username: 'testuser' }));
  });
});