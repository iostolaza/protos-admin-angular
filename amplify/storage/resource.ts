import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'userFiles',
  access: allow => ({
    'profile-pictures/*': [
      allow.guest.to(['read']),
      allow.entity('identity').to(['write', 'delete']),
    ],
    'attachments/{identityId}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
    ],
  }),
});