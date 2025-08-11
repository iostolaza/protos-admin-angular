
import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'profileImages',
  access: (allow) => ({
    'profile/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});
