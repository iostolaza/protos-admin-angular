import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { BehaviorSubject, from, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

export type UserProfile = Schema['User']['type'] & { profileImageUrl?: string };

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private client = generateClient<Schema>();
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  user$ = toSignal(this.userSubject.asObservable(), { initialValue: null });
  user = signal<UserProfile | null>(null);
  private destroy$ = new Subject<void>();

  constructor() {
    this.loadCurrentUser();
  }

  async load() {
    await this.loadCurrentUser();
  }

  private async loadCurrentUser() {
    try {
      const { userId } = await getCurrentUser();
      const { data: userData, errors } = await this.client.models['User'].get({ id: userId });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      if (!userData) return;
      let profileImageUrl: string | undefined;
      if (userData.profileImageKey) {
        const { url } = await getUrl({ path: userData.profileImageKey });
        profileImageUrl = url.toString();
      }
      const user: UserProfile = { ...userData, profileImageUrl };
      this.user.set(user);
      this.userSubject.next(user);

      (this.client.models['User'].observeQuery({ filter: { id: { eq: userId } } }) as Observable<{
        items: Schema['User']['type'][]
      }>)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: ({ items }) => {
            if (items[0]) {
              const updatedUser = { ...items[0], profileImageUrl: this.user()?.profileImageUrl };
              this.user.set(updatedUser);
              this.userSubject.next(updatedUser);
            }
          },
          error: (err) => console.error('ObserveQuery error:', err),
        });
    } catch (error) {
      console.error('Load user error:', error);
    }
  }

  async save(updated: Partial<UserProfile>) {
    await this.updateUser(updated);
  }

  async updateUser(updatedData: Partial<Schema['User']['type']>) {
    const currentUser = this.user();
    if (!currentUser?.id) return;
    const { data: updated, errors } = await this.client.models['User'].update({
      id: currentUser.id,
      ...updatedData,
    });
    if (errors) throw new Error(errors.map(e => e.message).join(', '));
    const newUser: UserProfile = { ...updated, profileImageUrl: currentUser.profileImageUrl };
    this.user.set(newUser);
    this.userSubject.next(newUser);
  }

  async uploadProfileImage(file: File): Promise<string> {
    try {
      const { userId } = await getCurrentUser();
      const path = `profile-pictures/${userId}/${file.name}`;
      const { path: uploadedPath } = await uploadData({ path, data: file }).result;
      const key = uploadedPath;
      const { url } = await getUrl({ path: key });
      await this.updateUser({ profileImageKey: key });
      const current = this.user();
      if (current) {
        const updated: UserProfile = { ...current, profileImageUrl: url.toString() };
        this.user.set(updated);
        this.userSubject.next(updated);
      }
      return key;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }

  getProfileImageUrl(key: string): Observable<string> {
    return from(getUrl({ path: key }).then(r => r.url.toString()));
  }

  async getPaymentMethods(): Promise<Schema['PaymentMethod']['type'][]> {
    try {
      const { userId } = await getCurrentUser();
      const { data, errors } = await this.client.models['PaymentMethod'].list({
        filter: { userId: { eq: userId } },
      });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
      return data;
    } catch (error) {
      console.error('Get payments error:', error);
      return [];
    }
  }

  async addPaymentMethod(type: string, name: string) {
    try {
      const { userId } = await getCurrentUser();
      const { errors } = await this.client.models['PaymentMethod'].create({ userId, type, name });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
    } catch (error) {
      console.error('Add payment error:', error);
    }
  }

  async updatePaymentMethod(id: string, type: string, name: string) {
    try {
      const { errors } = await this.client.models['PaymentMethod'].update({ id, type, name });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
    } catch (error) {
      console.error('Update payment error:', error);
    }
  }

  async deletePaymentMethod(id: string) {
    try {
      const { errors } = await this.client.models['PaymentMethod'].delete({ id });
      if (errors) throw new Error(errors.map(e => e.message).join(', '));
    } catch (error) {
      console.error('Delete payment error:', error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}