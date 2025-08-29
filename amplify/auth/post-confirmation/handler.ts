// amplify/auth/post-confirmation/handler.ts
import type { PostConfirmationTriggerHandler } from "aws-lambda";
import { type Schema } from "../../data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
// @ts-ignore
import { env } from "$amplify/env/post-confirmation";

// Declare env type based on Amplify DataClientEnv
type DataClientEnv = {
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_SESSION_TOKEN: string;
  AWS_REGION: string;
  AMPLIFY_DATA_DEFAULT_NAME: string;
  [key: string]: string;
};
declare const env: DataClientEnv;

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  const attrs = event.request.userAttributes;
  const sub = attrs.sub;
  const { data } = await client.models.User.list({ filter: { owner: { eq: sub } } });
  if (data.length > 0) {
    // Update if exists
    await client.models.User.update({
      id: data[0].id,
      firstName: attrs.given_name || data[0].firstName,
      lastName: attrs.family_name || data[0].lastName,
      profileImageKey: attrs.picture || data[0].profileImageKey,
      mobile: attrs.phone_number || data[0].mobile
    });
  } else {
    // Create new
    await client.models.User.create({
      owner: sub,
      firstName: attrs.given_name || 'First',
      lastName: attrs.family_name || 'Last',
      username: event.userName,
      email: attrs.email,
      profileImageKey: attrs.picture || '',
      dateJoined: new Date().toISOString(),
      accessLevel: 'basic',
      address: { line1: 'N/A', city: 'N/A', state: 'N/A', zip: '00000', country: 'N/A' },
      contactPrefs: { email: false, push: false, sms: false },
      emergencyContact: { name: 'N/A', phone: '000-000-0000', email: 'na@default.com', address: 'N/A' },
      vehicle: { make: '', model: '', color: '', license: '', year: '' },
      salary: 0,
      mobile: attrs.phone_number || ''
    });
  }
  return event;
};