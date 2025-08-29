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
  accessLevel: "basic" | "premium" | "admin";
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

  async load() {
    try {
      const { username: sub } = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      const email = attributes.email ?? '';
      const { data } = await client.models.User.list({ filter: { owner: { eq: sub } } });
      let userModel: UserModel | null = data[0] || null;
      if (!userModel) {
        // Create with attributes
        const createResp = await client.models.User.create({
          owner: sub,
          username: attributes.preferred_username || email.split('@')[0] || 'defaultUser',
          email,
          accessLevel: 'basic',
          firstName: attributes.given_name || 'First Name',
          lastName: attributes.family_name || 'Last Name',
          address: { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
          contactPrefs: { email: false, push: false, sms: false },
          emergencyContact: { name: 'N/A', phone: '000-000-0000', email: 'na@default.com', address: 'N/A' },
          vehicle: { make: '', model: '', color: '', license: '', year: '' },
          profileImageKey: attributes.picture || '',
          dateJoined: new Date().toISOString(),
          salary: 0,
          mobile: attributes.phone_number || ''
        });
        if (createResp.errors) {
          throw new Error(`User creation failed: ${createResp.errors.map((e: { message: string }) => e.message).join(', ')}`);
        }
        userModel = createResp.data;
        if (userModel === null) {
          throw new Error('User creation returned null data despite no errors.');
        }
      } else if (attributes.given_name && userModel.firstName === 'First Name') {
        // Update defaults with attributes if still default
        await client.models.User.update({
          id: userModel.id,
          firstName: attributes.given_name,
          lastName: attributes.family_name || userModel.lastName,
          profileImageKey: attributes.picture || userModel.profileImageKey,
          mobile: attributes.phone_number || userModel.mobile
        });
        userModel = (await client.models.User.get({ id: userModel.id })).data!;
      }
      if (userModel) {
        const profile: UserProfile = {
          id: userModel.id,
          firstName: userModel.firstName,
          lastName: userModel.lastName,
          username: userModel.username,
          email: userModel.email,
          accessLevel: userModel.accessLevel ?? 'basic',
          address: userModel.address ?? { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
          contactPrefs: {
            email: userModel.contactPrefs?.email ?? false,
            push: userModel.contactPrefs?.push ?? false,
            sms: userModel.contactPrefs?.sms ?? false
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
          mobile: userModel.mobile ?? ''
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
        this.user$.set(profile);
      }
    } catch (error) {
      console.error('Load user error:', error);
      this.user$.set(null);
      throw error;
    }
  }

  async save(updatedUser: UserProfile) {
    try {
      console.log('Saving updated User:', updatedUser);
      const { id, firstName, lastName, username, email, accessLevel, address, contactPrefs, emergencyContact, vehicle, profileImageKey } = updatedUser;
      const updateResp = await client.models.User.update({
        id,
        firstName,
        lastName,
        username,
        email,
        accessLevel,
        address,
        contactPrefs,
        emergencyContact,
        vehicle,
        profileImageKey,
      });
      if (updateResp.errors) {
        throw new Error(`User update failed: ${updateResp.errors.map((e: { message: string }) => e.message).join(', ')}`);
      }
      console.log('Update response:', updateResp.data);
      await this.load(); // Refresh after save
    } catch (error) {
      console.error('Save user error:', error);
      throw error;
    }
  }

  async getPaymentMethods() {
    const userId = this.user$()?.id;
    if (userId) {
      const resp = await client.models.PaymentMethod.list({
        filter: { userId: { eq: userId } },
      });
      return resp.data.map(pm => ({
        id: pm.id,
        type: pm.type ?? '',
        name: pm.name ?? '',
      }));
    }
    return [];
  }

  async addPaymentMethod(type: string, name: string) {
    const userId = this.user$()?.id;
    if (userId) {
      console.log('Adding payment method with:', { userId, type, name });
      const createResp = await client.models.PaymentMethod.create({ userId, type, name });
      if (createResp.errors) {
        throw new Error(`Payment create failed: ${createResp.errors.map(e => e.message).join(', ')}`);
      }
      console.log('Added payment method:', createResp.data);
    }
  }

  async updatePaymentMethod(id: string, type: string, name: string) {
    console.log('Updating payment method:', { id, type, name });
    const updateResp = await client.models.PaymentMethod.update({ id, type, name });
    if (updateResp.errors) {
      throw new Error(`Payment update failed: ${updateResp.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }
    console.log('Updated payment method:', updateResp.data);
  }

  async deletePaymentMethod(id: string) {
    console.log('Deleting payment method:', id);
    const deleteResp = await client.models.PaymentMethod.delete({ id });
    if (deleteResp.errors) {
      throw new Error(`Payment delete failed: ${deleteResp.errors.map((e: { message: string }) => e.message).join(', ')}`);
    }
    console.log('Deleted payment method:', deleteResp.data);
  }

  async uploadProfileImage(file: File): Promise<string | null> {
    try {
      const path = ({ identityId }: { identityId?: string }) => `profile/${identityId || ''}/profile.jpg`;
      console.log('Uploading to path:', path({})); 
      const uploadTask = uploadData({ path, data: file });
      const { path: uploadedPath } = await uploadTask.result;
      console.log('Upload success, key:', uploadedPath);
      return uploadedPath;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  }
  
}
