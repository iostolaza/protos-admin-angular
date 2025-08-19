import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      username: a.string().required(),
      email: a.email().required(),
      accessLevel: a.string().required(),
      address: a.customType({
        line1: a.string().required(),
        city: a.string().required(),
        state: a.string().required(),
        zip: a.string().required(),
        country: a.string().required(),
      }),
      contactPrefs: a.customType({
        email: a.boolean(),
        push: a.boolean(),
      }),
      emergencyContact: a.customType({
        name: a.string().required(),
        phone: a.string().required(),
        email: a.email().required(),
        address: a.string().required(),
      }),
      vehicle: a.customType({
        make: a.string(),
        model: a.string(),
        color: a.string(),
        license: a.string(),
        year: a.string(),
      }),
      profileImageKey: a.string(),
      paymentMethods: a.hasMany('PaymentMethod', 'userId'),
      channels: a.hasMany('UserChannel', 'userId'),
      messages: a.hasMany('Message', 'senderId'),
    })
    .authorization(allow => [allow.owner()]),
  PaymentMethod: a
    .model({
      userId: a.id().required(),
      type: a.string(),
      name: a.string(),
      user: a.belongsTo('User', 'userId'), 
    })
    .authorization(allow => [allow.owner()]),

  // New messaging schema models (Channel, Message, and UserChannel join for many-to-many)
  Channel: a
    .model({
      name: a.string(), // Optional name for group channels; for 1:1, could derive from members
      users: a.hasMany('UserChannel', 'channelId'), // Many-to-many with users
      messages: a.hasMany('Message', 'channelId'),
    })
    .authorization(allow => [allow.authenticated().to(['read', 'create', 'update'])]), // Allow authenticated users; refine with custom logic for member-only access
  Message: a
    .model({
      content: a.string().required(),
      senderId: a.id().required(),
      channelId: a.id().required(),
      timestamp: a.datetime().required(),
      attachment: a.string(), // S3 key for file/image attachments
      readBy: a.string().array(), // Array of user IDs who have read the message
      sender: a.belongsTo('User', 'senderId'),
      channel: a.belongsTo('Channel', 'channelId'),
    })
    .authorization(allow => [allow.authenticated().to(['read', 'create', 'update'])]), // Authenticated access; client-side filter for channel members
  UserChannel: a // Join table for User <-> Channel many-to-many
    .model({
      userId: a.id().required(),
      channelId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      channel: a.belongsTo('Channel', 'channelId'),
    })
    .authorization(allow => [allow.authenticated().to(['read', 'create', 'update'])]), // Similar auth; secure via app logic
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});