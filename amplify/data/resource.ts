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
      owner: a.string().authorization(allow => [allow.owner().to(['read'])]) // Explicit owner field with field-level auth
    })
    .authorization(allow => [allow.owner()]), // Model-level owner auth
  PaymentMethod: a
    .model({
      userId: a.id().required(),
      type: a.string(),
      name: a.string(),
      user: a.belongsTo('User', 'userId'),
      owner: a.string().authorization(allow => [allow.owner().to(['read'])])
    })
    .authorization(allow => [allow.owner()]),
  Channel: a
    .model({
      name: a.string(),
      users: a.hasMany('UserChannel', 'channelId'),
      messages: a.hasMany('Message', 'channelId'),
    })
    .authorization(allow => [allow.authenticated().to(['read', 'create', 'update'])]),
  Message: a
    .model({
      content: a.string().required(),
      senderId: a.id().required(),
      channelId: a.id().required(),
      timestamp: a.datetime().required(),
      attachment: a.string(),
      readBy: a.string().array(),
      sender: a.belongsTo('User', 'senderId'),
      channel: a.belongsTo('Channel', 'channelId'),
    })
    .index([{ name: 'messagesByChannelAndTimestamp', fields: ['channelId', 'timestamp'] }])
    .authorization(allow => [allow.authenticated().to(['read', 'create', 'update'])]),
  UserChannel: a
    .model({
      userId: a.id().required(),
      channelId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      channel: a.belongsTo('Channel', 'channelId'),
    })
    .authorization(allow => [allow.authenticated().to(['read', 'create', 'update'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
