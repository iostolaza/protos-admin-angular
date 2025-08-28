import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      username: a.string().required(),
      email: a.email().required(),
      mobile: a.string(),
      dateJoined: a.datetime().required(),
      salary: a.float(),
      projects: a.hasMany('Project', 'userId'),
      accessLevel: a.enum(['basic', 'premium', 'admin']), 
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
        sms: a.boolean(),
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
      status: a.enum(['online', 'offline', 'away']),
      location: a.customType({
        latitude: a.float(),
        longitude: a.float(),
        lastUpdated: a.datetime(),
      }),
      paymentMethods: a.hasMany('PaymentMethod', 'userId'),
      channels: a.hasMany('UserChannel', 'userId'),
      messages: a.hasMany('Message', 'senderId'),
      tickets: a.hasMany('Ticket', 'userId'),
      eventLogs: a.hasMany('EventLog', 'userId'),
      friends: a.hasMany('Friend', 'userId'),
      owner: a.string(),
    })
    .authorization((allow: any) => [allow.owner(), allow.authenticated().to(['read'])]),
  Friend: a
    .model({
      userId: a.id().required(),
      friendId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
    })
    .authorization((allow: any) => [allow.owner()]),
  Project: a
    .model({
      name: a.string().required(),
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
    })
    .authorization((allow: any) => [allow.owner(), allow.authenticated().to(['read'])]),
  PaymentMethod: a
    .model({
      userId: a.id().required(),
      type: a.string(),
      name: a.string(),
      user: a.belongsTo('User', 'userId'),
      owner: a.string(),
    })
    .authorization((allow: any) => [allow.owner()]),
  Channel: a
    .model({
      name: a.string(),
      type: a.enum(['direct', 'group']), 
      users: a.hasMany('UserChannel', 'channelId'),
      messages: a.hasMany('Message', 'channelId'),
    })
    .authorization((allow: any) => [allow.authenticated().to(['read', 'create', 'update'])]),
  Message: a
    .model({
      content: a.string().required(),
      senderId: a.id().required(),
      channelId: a.id().required(),
      timestamp: a.datetime().required(),
      attachment: a.string(),
      readBy: a.string().array(),
      reactions: a.customType({
        emoji: a.string(),
        userIds: a.string().array(),
      }), 
      replyToMessageId: a.id(),
      sender: a.belongsTo('User', 'senderId'),
      channel: a.belongsTo('Channel', 'channelId'),
    })
    .secondaryIndexes((index) => [
      index('channelId').sortKeys(['timestamp']).queryField('messagesByChannelAndTimestamp'),
      index('senderId').sortKeys(['timestamp']).queryField('messagesBySenderAndTimestamp'),
    ])
    .authorization((allow: any) => [allow.authenticated().to(['read', 'create', 'update'])]),
  UserChannel: a
    .model({
      userId: a.id().required(),
      channelId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      channel: a.belongsTo('Channel', 'channelId'),
    })
    .authorization((allow: any) => [allow.authenticated().to(['read', 'create', 'update'])]),
  Ticket: a
    .model({
      userId: a.id().required(),
      title: a.string().required(),
      description: a.string().required(),
      status: a.enum(['open', 'in_progress', 'closed']), 
      priority: a.enum(['low', 'medium', 'high']),
      assignedTo: a.id(),
      channelId: a.id(),
      attachments: a.string().array(),
      createdAt: a.datetime().required(),
      updatedAt: a.datetime(),
      user: a.belongsTo('User', 'userId'),
    })
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['createdAt']).queryField('ticketsByUserAndCreatedAt'),
      index('status').sortKeys(['priority']).queryField('ticketsByStatusAndPriority'),
    ])
    .authorization((allow: any) => [allow.owner(), allow.authenticated().to(['read'])]),
  EventLog: a
    .model({
      userId: a.id().required(),
      eventType: a.enum(['login', 'message_sent', 'ticket_created', 'page_view']),
      details: a.json(),
      timestamp: a.datetime().required(),
      user: a.belongsTo('User', 'userId'),
    })
    .secondaryIndexes((index) => [
      index('userId').sortKeys(['timestamp']).queryField('eventsByUserAndTimestamp'),
      index('eventType').sortKeys(['timestamp']).queryField('eventsByTypeAndTimestamp'),
    ])
    .authorization((allow: any) => [allow.owner(), allow.authenticated().to(['read'])]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});