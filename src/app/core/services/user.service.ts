// src/app/core/services/user.service.ts
import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { getUrl, uploadData } from 'aws-amplify/storage';
import { Schema } from '../../../../amplify/data/resource';
const client = generateClient<Schema>();

// Explicit type alias to unify model references across operations
type UserModel = Schema["User"]["type"];

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  accessLevel: string;
  address: { line1: string; city: string; state: string; zip: string; country: string };
  contactPrefs: { email: boolean; push: boolean };
  emergencyContact: { name: string; phone: string; email: string; address: string };
  vehicle: { make: string; model: string; color: string; license: string; year: string };
  profileImageKey: string;
  profileImageUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  user$ = signal<UserProfile | null>(null);

  async load() {
    try {
      const { username } = await getCurrentUser();
      const usersResp = await client.models.User.list();
      let userModel: UserModel | null = usersResp.data[0] || null;
      if (!userModel) {
        const createResp = await client.models.User.create({
          username,
          email: username,
          accessLevel: 'User',
          firstName: '',
          lastName: '',
          address: { line1: '', city: '', state: '', zip: '', country: '' },
          contactPrefs: { email: false, push: false },
          emergencyContact: { name: '', phone: '', email: '', address: '' },
          vehicle: { make: '', model: '', color: '', license: '', year: '' },
          profileImageKey: '',
        });
        if (createResp.errors) {
          throw new Error(`User creation failed: ${createResp.errors.map(e => e.message).join(', ')}`);
        }
        userModel = createResp.data;
        if (userModel === null) {
          throw new Error('User creation returned null data despite no errors.');
        }
      }
      const fullUser: UserProfile = {
        id: userModel.id,
        firstName: userModel.firstName ?? '',
        lastName: userModel.lastName ?? '',
        username: userModel.username ?? '',
        email: userModel.email ?? '',
        accessLevel: userModel.accessLevel ?? '',
        address: {
          line1: userModel.address?.line1 ?? '',
          city: userModel.address?.city ?? '',
          state: userModel.address?.state ?? '',
          zip: userModel.address?.zip ?? '',
          country: userModel.address?.country ?? '',
        },
        contactPrefs: {
          email: userModel.contactPrefs?.email ?? false,
          push: userModel.contactPrefs?.push ?? false,
        },
        emergencyContact: {
          name: userModel.emergencyContact?.name ?? '',
          phone: userModel.emergencyContact?.phone ?? '',
          email: userModel.emergencyContact?.email ?? '',
          address: userModel.emergencyContact?.address ?? '',
        },
        vehicle: {
          make: userModel.vehicle?.make ?? '',
          model: userModel.vehicle?.model ?? '',
          color: userModel.vehicle?.color ?? '',
          license: userModel.vehicle?.license ?? '',
          year: userModel.vehicle?.year ?? '',
        },
        profileImageKey: userModel.profileImageKey ?? '',
      };
      if (fullUser.profileImageKey) {
        const { url } = await getUrl({
          path: fullUser.profileImageKey,
          options: { expiresIn: 3600 },
        });
        fullUser.profileImageUrl = url.toString();
      }
      this.user$.set(fullUser);
    } catch (error) {
      console.error('Load user error:', error);
    }
  }

  async save(updatedUser: UserProfile) {
    try {
      const { id, firstName, lastName, username, email, accessLevel, address, contactPrefs, emergencyContact, vehicle, profileImageKey } = updatedUser;
      await client.models.User.update({
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
      await this.load(); // Refresh after save
    } catch (error) {
      console.error('Save user error:', error);
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
      await client.models.PaymentMethod.create({ userId, type, name });
    }
  }

  async updatePaymentMethod(id: string, type: string, name: string) {
    await client.models.PaymentMethod.update({ id, type, name });
  }

  async deletePaymentMethod(id: string) {
    await client.models.PaymentMethod.delete({ id });
  }

  async uploadProfileImage(file: File): Promise<string | null> {
    try {
      const path = ({ identityId }: { identityId?: string }) => `profile/${identityId || ''}/profile.jpg`;
      const uploadTask = uploadData({ path, data: file });
      const { path: uploadedPath } = await uploadTask.result;
      return uploadedPath;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  }
}