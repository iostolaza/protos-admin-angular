// src/app/core/services/user.service.ts
import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import { getUrl, uploadData } from 'aws-amplify/storage';
import { Schema } from '../../../../amplify/data/resource';

const client = generateClient<Schema>();

type UserModel = Schema["User"]["type"];

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  // accessLevel: "basic" | "premium" | "admin";
  address: { line1: string; city: string; state: string; zip: string; country: string };
  contactPrefs: { email: boolean; push: boolean; sms?: boolean };
  emergencyContact: { name: string; phone: string; email: string; address: string };
  vehicle: { make: string; model: string; color: string; license: string; year: string };
  profileImageKey: string;
  profileImageUrl?: string;
  mobile?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private client = generateClient<Schema>();
  user$ = signal<UserProfile | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async load() {
    this.loading.set(true);
    try {
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      if (!session.tokens) {
        throw new Error('User not authenticated');
      }
      const { userId: sub, username } = await getCurrentUser();
      console.log('Current user:', { sub, username });
      const attributes = await fetchUserAttributes();
      console.log('User attributes:', attributes);
      const email = attributes.email ?? '';
      const { data, errors } = await this.client.models.User.list({ 
        filter: { owner: { eq: sub } },
        authMode: 'userPool'
      });
      console.log('User list response:', { data, errors });
      if (errors) {
        throw new Error(`List users failed: ${errors.map((e: { message: string }) => e.message).join(', ')}`);
      }
      let userModel: UserModel | null = data[0] || null;
      if (!userModel) {
        const createResp = await this.client.models.User.create({
          username: email.split('@')[0] || 'defaultUser',
          email,
          // accessLevel: 'basic',
          firstName: 'First Name',
          lastName: 'Last Name',
          address: { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
          contactPrefs: { email: false, push: false },
          emergencyContact: { name: 'N/A', phone: '000-000-0000', email: 'na@default.com', address: 'N/A' },
          vehicle: { make: '', model: '', color: '', license: '', year: '' },
          profileImageKey: '',
          dateJoined: new Date().toISOString(),
          salary: 0,
          mobile: '',
        }, { authMode: 'userPool' });
        console.log('Create user response:', createResp);
        if (createResp.errors) {
          throw new Error(`User creation failed: ${createResp.errors.map((e: { message: string }) => e.message).join(', ')}`);
        }
        userModel = createResp.data;
        console.log('Created new User model:', userModel);
        if (userModel === null) {
          throw new Error('User creation returned null data despite no errors.');
        }
      }
      if (userModel) {
        const profile: UserProfile = {
          id: userModel.id,
          firstName: userModel.firstName,
          lastName: userModel.lastName,
          username: userModel.username,
          email: userModel.email,
          // accessLevel: userModel.accessLevel ?? 'basic',
          address: userModel.address ?? { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
          contactPrefs: {
            email: userModel.contactPrefs?.email ?? false,
            push: userModel.contactPrefs?.push ?? false,
          },
          emergencyContact: userModel.emergencyContact ?? { name: 'N/A', phone: '000-000-0000', email: 'na@default.com', address: 'N/A' },
          vehicle: {
            make: userModel.vehicle?.make ?? '',
            model: userModel.vehicle?.model ?? '',
            color: userModel.vehicle?.color ?? '',
            license: userModel.vehicle?.license ?? '',
            year: userModel.vehicle?.year ?? '',
          },
          profileImageKey: userModel.profileImageKey ?? '',
        };
        if (profile.profileImageKey) {
          try {
            const { url } = await getUrl({
              path: profile.profileImageKey,
              options: { expiresIn: 3600 },
            });
            profile.profileImageUrl = url.toString();
          } catch (err) {
            console.error('Error getting image URL:', err);
            profile.profileImageUrl = 'assets/profile/avatar-default.svg';
          }
        } else {
          profile.profileImageUrl = 'assets/profile/avatar-default.svg';
        }
        console.log('Setting user profile:', profile);
        this.user$.set(profile);
      }
    } catch (err: any) {
      console.error('Load user error:', err);
      this.error.set(err.message || 'Failed to load user');
    } finally {
      this.loading.set(false);
    }
  }

  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      if (!session.tokens) {
        throw new Error('User not authenticated');
      }
      const { data, errors } = await this.client.models.User.list({ authMode: 'userPool' });
      console.log('All users response:', { data, errors });
      if (errors) {
        throw new Error(`List users failed: ${errors.map((e: { message: string }) => e.message).join(', ')}`);
      }
      const users = await Promise.all(data.map(async (userModel) => {
        const profile: UserProfile = {
          id: userModel.id,
          firstName: userModel.firstName,
          lastName: userModel.lastName,
          username: userModel.username,
          email: userModel.email,
          // accessLevel: userModel.accessLevel ?? 'basic',
          address: userModel.address ?? { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
          contactPrefs: {
            email: userModel.contactPrefs?.email ?? false,
            push: userModel.contactPrefs?.push ?? false
          },
          emergencyContact: userModel.emergencyContact ?? { name: 'N/A', phone: '000-000-0000', email: 'na@default.com', address: 'N/A' },
          vehicle: {
            make: userModel.vehicle?.make ?? '',
            model: userModel.vehicle?.model ?? '',
            color: userModel.vehicle?.color ?? '',
            license: userModel.vehicle?.license ?? '',
            year: userModel.vehicle?.year ?? ''
          },
          profileImageKey: userModel.profileImageKey ?? '',
        };
        if (profile.profileImageKey) {
          try {
            const { url } = await getUrl({
              path: profile.profileImageKey,
              options: { expiresIn: 3600 },
            });
            profile.profileImageUrl = url.toString();
          } catch (err) {
            console.error('Error getting image URL:', err);
            profile.profileImageUrl = 'assets/profile/avatar-default.svg';
          }
        } else {
          profile.profileImageUrl = 'assets/profile/avatar-default.svg';
        }
        return profile;
      }));
      return users;
    } catch (error) {
      console.error('Get all users error:', error);
      return [];
    }
  }

  async save(updatedUser: UserProfile) {
    try {
      const session = await fetchAuthSession();
      if (!session.tokens) {
        throw new Error('User not authenticated');
      }
      // Validate inputs
      if (!updatedUser.firstName || !updatedUser.lastName || !updatedUser.username || !updatedUser.email) {
        throw new Error('Required fields are missing');
      }
      // Optimistic update
      this.user$.set(updatedUser);
      const { id, firstName, lastName, username, email, address, contactPrefs, emergencyContact, vehicle, profileImageKey } = updatedUser;
      const updateResp = await this.client.models.User.update({
        id,
        firstName,
        lastName,
        username,
        email,
        // accessLevel,
        address,
        contactPrefs,
        emergencyContact,
        vehicle,
        profileImageKey
      }, { authMode: 'userPool' });
      if (updateResp.errors) {
        // Revert optimistic update on failure
        await this.load();
        throw new Error(`User update failed: ${updateResp.errors.map((e) => e.message).join(', ')}`);
      }
      await this.load(); // Ensure latest data
    } catch (error: any) {
      console.error('Save user error:', error);
      this.error.set(error.message || 'Failed to save user');
      throw error;
    }
  }

  async getPaymentMethods() {
    try {
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      if (!session.tokens) {
        throw new Error('User not authenticated');
      }
      const userId = this.user$()?.id;
      if (userId) {
        const { data, errors } = await this.client.models.PaymentMethod.list({
          filter: { userId: { eq: userId } },
          authMode: 'userPool'
        });
        console.log('Payment methods response:', { data, errors });
        if (errors) {
          throw new Error(`List payment methods failed: ${errors.map((e: { message: string }) => e.message).join(', ')}`);
        }
        return data.map(pm => ({
          id: pm.id,
          type: pm.type ?? '',
          name: pm.name ?? '',
        }));
      }
      return [];
    } catch (error) {
      console.error('Get payment methods error:', error);
      return [];
    }
  }

  async addPaymentMethod(type: string, name: string) {
    try {
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      if (!session.tokens) {
        throw new Error('User not authenticated');
      }
      const userId = this.user$()?.id;
      if (userId) {
        console.log('Adding payment method with:', { userId, type, name });
        const { errors } = await this.client.models.PaymentMethod.create({ userId, type, name }, { authMode: 'userPool' });
        console.log('Add payment method response:', { errors });
        if (errors) {
          throw new Error(`Payment method creation failed: ${errors.map((e: { message: string }) => e.message).join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Add payment method error:', error);
      throw error;
    }
  }

  async updatePaymentMethod(id: string, type: string, name: string) {
    try {
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      if (!session.tokens) {
        throw new Error('User not authenticated');
      }
      console.log('Updating payment method:', { id, type, name });
      const { errors } = await this.client.models.PaymentMethod.update({ id, type, name }, { authMode: 'userPool' });
      console.log('Update payment method response:', { errors });
      if (errors) {
        throw new Error(`Payment method update failed: ${errors.map((e: { message: string }) => e.message).join(', ')}`);
      }
    } catch (error) {
      console.error('Update payment method error:', error);
      throw error;
    }
  }

  async deletePaymentMethod(id: string) {
    try {
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      if (!session.tokens) {
        throw new Error('User not authenticated');
      }
      console.log('Deleting payment method:', id);
      const deleteResp = await this.client.models.PaymentMethod.delete({ id }, { authMode: 'userPool' });
      console.log('Delete payment method response:', deleteResp);
      if (deleteResp.errors) {
        throw new Error(`Payment method deletion failed: ${deleteResp.errors.map((e: { message: string }) => e.message).join(', ')}`);
      }
    } catch (error) {
      console.error('Delete payment method error:', error);
      throw error;
    }
  }

  async uploadProfileImage(file: File): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      if (!session.tokens || !session.identityId) {
        throw new Error('User not authenticated or identityId missing');
      }
      const path = `profile/${session.identityId}/profile.jpg`;
      console.log('Uploading to path:', path);
      const uploadTask = uploadData({ path, data: file });
      const { path: uploadedPath } = await uploadTask.result;
      console.log('Upload success, key:', uploadedPath);
      return uploadedPath;
    } catch (error) {
      console.error('Upload error:', error);
      this.error.set('Failed to upload profile image');
      return null;
    }
  }

}