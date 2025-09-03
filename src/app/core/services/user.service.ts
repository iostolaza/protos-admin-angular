import { Injectable } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { Observable, Subject, from } from 'rxjs';
import { takeUntil } from 'rxjs';
import { signal } from '@angular/core';

type Models = Schema;
type UserType = Models['User']['type'];
type PaymentMethodType = Models['PaymentMethod']['type'];

export type UserProfile = UserType & { profileImageUrl?: string };

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private client = generateClient<Schema>();
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
      const { data: userData, errors } = await this.client.models.User.get({ id: userId });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
      if (!userData) return;
      const profileImageUrl = await this.getProfileImageUrlFromKey(userData.profileImageKey);
      const user: UserProfile = { ...userData, profileImageUrl };
      this.user.set(user);

      this.client.models.User.observeQuery({ filter: { id: { eq: userId } } })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async ({ items }: { items: UserType[] }) => {
            const item = items[0];
            if (item) {
              await this.updateProfileFromItem(item);
            }
          },
          error: (err: unknown) => console.error('ObserveQuery error:', err),
        });
    } catch (error: unknown) {
      console.error('Load user error:', error);
    }
  }

  private async getProfileImageUrlFromKey(key: string | null | undefined): Promise<string | undefined> {
    if (!key) return undefined;
    const { url } = await getUrl({ path: key });
    return url.toString();
  }

  private async updateProfileFromItem(item: UserType) {
    let profileImageUrl = this.user()?.profileImageUrl;
    const currentKey = this.user()?.profileImageKey;
    if (item.profileImageKey !== currentKey) {
      profileImageUrl = await this.getProfileImageUrlFromKey(item.profileImageKey);
    }
    const updatedUser: UserProfile = { ...item, profileImageUrl };
    this.user.set(updatedUser);
  }

  async save(updated: Partial<UserProfile>) {
    await this.updateUser(updated);
  }

 async updateUser(updatedData: Partial<UserType>) {
  const currentUser = this.user();
  if (!currentUser?.id) return;
  const { data: updated, errors } = await this.client.models.User.update({
    id: currentUser.id,
    ...updatedData,
  });
  if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
  if (!updated) throw new Error('Updated user is null');
  await this.updateProfileFromItem(updated);
}

  async uploadProfileImage(file: File): Promise<string> {
    try {
      const { userId } = await getCurrentUser();
      const path = `profile-pictures/${userId}/${file.name}`;
      const { path: uploadedPath } = await uploadData({ path, data: file }).result;
      const key = uploadedPath;
      const urlStr = await this.getProfileImageUrlFromKey(key);
      await this.updateUser({ profileImageKey: key });
      // Optimistic update already handled in updateUser
      return key;
    } catch (error: unknown) {
      console.error('Upload image error:', error);
      throw error;
    }
  }

  getProfileImageUrl(key: string): Observable<string> {
    return from(this.getProfileImageUrlFromKey(key).then(u => u ?? ''));
  }

  async getPaymentMethods(): Promise<PaymentMethodType[]> {
    try {
      const { userId } = await getCurrentUser();
      const { data, errors } = await this.client.models.PaymentMethod.list({
        filter: { userId: { eq: userId } },
      });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
      return data;
    } catch (error: unknown) {
      console.error('Get payments error:', error);
      return [];
    }
  }

  async addPaymentMethod(type: string, name: string) {
    try {
      const { userId } = await getCurrentUser();
      const { errors } = await this.client.models.PaymentMethod.create({ userId, type, name });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Add payment error:', error);
    }
  }

  async updatePaymentMethod(id: string, type: string, name: string) {
    try {
      const { errors } = await this.client.models.PaymentMethod.update({ id, type, name });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Update payment error:', error);
    }
  }

  async deletePaymentMethod(id: string) {
    try {
      const { errors } = await this.client.models.PaymentMethod.delete({ id });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    } catch (error: unknown) {
      console.error('Delete payment error:', error);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}