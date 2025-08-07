// amplify/backend.ts

/*
Description: 
Defines the backend configuration for AWS Amplify Gen 2.
Imports and includes the auth resource modularly.
*/

// Imports
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';  // Modular import for auth

// Define and export backend with auth
defineBackend({
  auth,
});
