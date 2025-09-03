export interface Address {
  line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}

export interface ContactPrefs {
  email?: boolean | null;
  push?: boolean | null;
}

export interface InputContact {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  profileImageKey?: string | null;
  status?: string;
  dateAdded?: string;
  imageUrl?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  address?: Address | null;
  contactPrefs?: ContactPrefs | null;
}
