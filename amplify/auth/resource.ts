// amplify/auth/resource.ts

/*
Description: 
Defines the authentication resource for AWS Amplify Gen 2 using code-first approach.
Enables email login with custom verification email subject.
*/

// Import defineAuth from Amplify backend
import { defineAuth } from '@aws-amplify/backend';

// Export auth configuration
/**
 * Define the auth resource with email login.
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth/set-up-auth/
 */

export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailSubject: 'Verify your email for our app',  
    },
  },
});
