import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'profileImages',
  access: (allow) => ({
    'profile/{entity_id}/*': [
      allow.authenticated.to(['read']),  // Allow all authenticated users to read (for shared profiles/attachments)
      allow.entity('identity').to(['write', 'delete']),  // Owner only for write/delete
    ],
  }),
});