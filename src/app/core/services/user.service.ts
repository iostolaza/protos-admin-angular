import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl } from 'aws-amplify/storage';
import type { Schema } from '../../../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { Observable, Subject, from } from 'rxjs';
import { takeUntil } from 'rxjs/operators'; // UPDATED: Added operators import for consistency.

type Models = Schema;
type UserType = Models['User']['type'];
type PaymentMethodType = Models['PaymentMethod']['type'];

export type UserProfile = UserType & { profileImageUrl?: string }; // UPDATED: Kept as is, but consider Omit if extras added.

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
      const { userId, signInDetails } = await getCurrentUser();
      const email = signInDetails?.loginId;

      // Fetch by cognitoId
      const { data: userData, errors } = await this.client.models.User.get({ cognitoId: userId });
      if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));

      let user = userData;

      // Fallback by email
      if (!user && email) {
        const { data: users } = await this.client.models.User.list({
          filter: { email: { eq: email } },
        });
        user = users[0];
      }

      // Temp creation if not exists (fallback if Lambda fails)
      if (!user && email) {
        const { errors } = await this.client.models.User.create({
          cognitoId: userId,
          email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        if (errors) throw new Error(errors.map(e => e.message).join(', '));
       
        const { data: newUser } = await this.client.models.User.get({ cognitoId: userId });
        user = newUser;
      }

      if (!user) return;

      const profileImageUrl = await this.getProfileImageUrlFromKey(user.profileImageKey);
      this.user.set({ ...user, profileImageUrl });

      // Observe changes for real-time
      this.client.models.User.observeQuery({ filter: { cognitoId: { eq: userId } } })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async ({ items }) => {
            if (items[0]) await this.updateProfileFromItem(items[0]);
          },
          error: (err) => console.error('ObserveQuery error:', err),
        });
    } catch (error) {
      console.error('Load user error:', error);  // Enhanced logging
    }
  }

  private async getProfileImageUrlFromKey(key: string | null | undefined): Promise<string | undefined> {
    if (!key) return undefined;
    const { url } = await getUrl({ path: key, options: { expiresIn: 3600 } }); // UPDATED: Added expiresIn for signed URL best practice.
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
    // NEW: Filter to valid fields to avoid "field not defined" error.
    const validUpdated: Partial<UserType> = Object.fromEntries(
      Object.entries(updated).filter(([key]) => key in ({} as UserType) && key !== 'cognitoId' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'profileImageUrl')
    );
    await this.updateUser(validUpdated);
  }

  async updateUser(updatedData: Partial<UserType>) {
    const currentUser = this.user();
    if (!currentUser?.cognitoId) return;

    const { data: updated, errors } = await this.client.models.User.update({
      cognitoId: currentUser.cognitoId,
      ...updatedData,
    });
    if (errors) throw new Error(errors.map((e: any) => e.message).join(', '));
    if (!updated) throw new Error('Updated user is null');
    await this.updateProfileFromItem(updated);
  }

  async uploadProfileImage(file: File): Promise<string> {
    try {
      const { userId } = await getCurrentUser();
      // UPDATED: Use path as function for auto identityId, protected level.
      const result = await uploadData({
        path: ({ identityId }) => `protected/${identityId}/profile-pictures/${userId}/${file.name}`,
        data: file
      }).result;
      const key = result.path; // Full path with protected/{identityId}/...
      await this.updateUser({ profileImageKey: key });
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