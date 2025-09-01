import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'profileImages',
  access: (allow) => ({
    'profile/{identityId}/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.entity('identity').to(['write', 'delete'])
    ]
  })
});
