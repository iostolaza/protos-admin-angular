// amplify/auth/resource.ts

import { defineAuth } from '@aws-amplify/backend'; // ^1.3.0
import { postConfirmation } from './post-confirmation/resource';

export const auth = defineAuth({
  loginWith: { email: true },
  triggers: { postConfirmation },
});