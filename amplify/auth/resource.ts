// amplify/auth/resource.ts
import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource'; // Add this function as below

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  triggers: {
    postConfirmation
  }
});