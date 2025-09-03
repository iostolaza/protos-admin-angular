import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  User: a.model({
    cognitoId: a.string().required(), 
    firstName: a.string(),
    lastName: a.string(),
    username: a.string(),
    email: a.email().required(),
    profileImageKey: a.string(),
    address: a.customType({
      line1: a.string(),
      city: a.string(),
      state: a.string(),
      zip: a.string(),
      country: a.string(),
    }),
    vehicle: a.customType({
      make: a.string(),
      model: a.string(),
      color: a.string(),
      license: a.string(),
      year: a.integer(),
    }),
    emergencyContact: a.customType({
      name: a.string(),
      phone: a.string(),
      email: a.email(),
      address: a.string(),
    }),
    contactPrefs: a.customType({
      email: a.boolean(),
      push: a.boolean(),
    }),
    status: a.string(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
    .identifier(['cognitoId']) 
    .secondaryIndexes(index => [index('email')])
    .authorization(allow => [
    allow.owner().to(['read', 'update', 'delete']),
    allow.authenticated().to(['read']),
  ]),

  PaymentMethod: a.model({
    userId: a.id().required(),
    type: a.string().required(),
    name: a.string().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).secondaryIndexes(index => [index('userId')])
    .authorization(allow => [allow.ownerDefinedIn('userId')]),

  Friend: a.model({
    userId: a.id().required(),
    friendId: a.id().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).identifier(['userId', 'friendId'])
    .secondaryIndexes(index => [index('userId')])
    .authorization(allow => [allow.ownerDefinedIn('userId')]),

  Channel: a.model({
    name: a.string(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).authorization(allow => [allow.authenticated()]),

  UserChannel: a.model({
    userId: a.id().required(),
    channelId: a.id().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).identifier(['userId', 'channelId'])
    .authorization(allow => [allow.ownerDefinedIn('userId')]),

  Message: a.model({
    content: a.string(),
    senderId: a.id().required(),
    channelId: a.id().required(),
    timestamp: a.datetime().required(),
    attachment: a.string(),
    readBy: a.string().array(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  }).secondaryIndexes(index => [index('channelId').sortKeys(['timestamp'])])
    .authorization(allow => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});