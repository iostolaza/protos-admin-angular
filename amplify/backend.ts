import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource'; // Updated import
import { data } from './data/resource';
import { storage } from './storage/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
});