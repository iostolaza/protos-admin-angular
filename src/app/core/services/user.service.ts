
// src/app/core/services/user.service.ts

import { Injectable, signal } from '@angular/core';
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession, fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
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
  private client = generateClient<Schema>();


  user$ = signal<UserProfile | null>(null);

  async load() {
    try {
  const { username: sub } = await getCurrentUser(); 
  console.log('Current authenticated user sub (ID/username):', sub);

  const session = await fetchAuthSession();
  const tokenSub = session.tokens?.idToken?.payload.sub;
  console.log('Token sub (should match):', tokenSub);

  const attributes = await fetchUserAttributes();
  const email = attributes.email ?? '';
  console.log('User email from attributes:', email);

  const usersResp = await client.models.User.list();
  console.log('Listed User models (should be 1 for current owner):', usersResp.data);

  let userModel: UserModel | null = usersResp.data[0] || null;
  if (!userModel) {
    const createResp = await client.models.User.create({
        username: email.split('@')[0] || 'defaultUser', 
        email, 
        accessLevel: 'User',
        firstName: 'First Name', 
        lastName: 'Last Name', 
        address: { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
        contactPrefs: { email: false, push: false },
        emergencyContact: { name: 'N/A', phone: '000-000-0000', email: 'na@default.com', address: 'N/A' }, 
        vehicle: { make: '', model: '', color: '', license: '', year: '' },
        profileImageKey: '',
      });
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
    accessLevel: userModel.accessLevel,
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
        options: { expiresIn: 3600 }, // 1 hour expiration for security
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
    console.log('Uploading to path:', path({})); // Debug
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