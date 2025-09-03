import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { type Schema } from '../../data/resource';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { generateAmplifyConfig } from '@aws-amplify/backend/output';
import { env } from '/env/post-confirmation';

Amplify.configure(generateAmplifyConfig(env));
const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const sub = event.request.userAttributes.sub;
  const email = event.request.userAttributes.email;
  const firstName = event.request.userAttributes.given_name || '';
  const lastName = event.request.userAttributes.family_name || '';

  const { errors } = await client.models.User.create({
    cognitoId: sub,
    email,
    firstName,
    lastName,
    username: event.userName || email.split('@')[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (errors) {
    console.error('Error creating user:', errors);
    throw new Error('Failed to create user profile');
  }

  console.log(`User created: ${sub}`);
  return event;
};
