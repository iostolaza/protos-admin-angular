import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      id: a.id().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      username: a.string().required(),
      email: a.string().required(),
      profileImageKey: a.string(),
      status: a.enum(['online', 'offline', 'away']),
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
      dateJoined: a.datetime(),
      salary: a.float(),
      mobile: a.string(),
      owner: a.string(),
      tickets: a.hasMany('Ticket', 'userId'),
      paymentMethods: a.hasMany('PaymentMethod', 'userId'),
    })
    .authorization(allow => [
      allow.owner(),
      allow.groups(['Admin', 'Manager']).to(['read', 'update', 'delete'])
    ]),

  Friend: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      friendId: a.id().required(),
      createdAt: a.datetime(),
      owner: a.string(),
    })
    .authorization(allow => [
      allow.owner(),
      allow.groups(['Admin']).to(['read', 'update', 'delete'])
    ]),

  PaymentMethod: a
    .model({
      id: a.id().required(),
      type: a.string().required(),
      name: a.string().required(),
      userId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      owner: a.string(),
    })
    .authorization(allow => [
      allow.owner(),
      allow.groups(['Admin', 'Manager']).to(['read', 'update', 'delete'])
    ]),

  Ticket: a
    .model({
      id: a.id().required(),
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
      owner: a.string(),
    })
    .secondaryIndexes(index => [
      index('userId').queryField('ticketsByUserAndCreatedAt').sortKeys(['createdAt']),
      index('status').queryField('ticketsByStatusAndPriority').sortKeys(['priority'])
    ])
    .authorization(allow => [
      allow.owner(),
      allow.groups(['Admin', 'Manager', 'Facilities']).to(['read', 'update', 'delete']),
      allow.authenticated().to(['read'])
    ]),

  EventLog: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      eventType: a.enum(['login', 'message_sent', 'ticket_created', 'page_view']),
      details: a.json(),
      timestamp: a.datetime().required(),
      user: a.belongsTo('User', 'userId'),
      owner: a.string(),
    })
    .secondaryIndexes(index => [
      index('userId').queryField('eventsByUserAndTimestamp').sortKeys(['timestamp']),
      index('eventType').queryField('eventsByTypeAndTimestamp').sortKeys(['timestamp'])
    ])
    .authorization(allow => [
      allow.owner(),
      allow.groups(['Admin', 'Manager']).to(['read']),
      allow.authenticated().to(['read'])
    ]),

  Channel: a
    .model({
      id: a.id().required(),
      name: a.string(),
      type: a.enum(['direct', 'group']),
      users: a.hasMany('UserChannel', 'channelId'),
      messages: a.hasMany('Message', 'channelId'),
    })
    .authorization(allow => [
      allow.authenticated().to(['read', 'create', 'update'])
    ]),

  UserChannel: a
    .model({
      id: a.id().required(),
      userId: a.id().required(),
      channelId: a.id().required(),
      user: a.belongsTo('User', 'userId'),
      channel: a.belongsTo('Channel', 'channelId'),
    })
    .authorization(allow => [
      allow.authenticated().to(['read', 'create', 'update'])
    ]),

  Message: a
    .model({
      id: a.id().required(),
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
      owner: a.string(),
    })
    .secondaryIndexes(index => [
      index('senderId').queryField('messagesBySenderAndTimestamp').sortKeys(['timestamp']),
      index('channelId').queryField('messagesByChannelAndTimestamp').sortKeys(['timestamp'])
    ])
    .authorization(allow => [
      allow.owner(), // Use default owner field for sender
      allow.authenticated().to(['read', 'create', 'update'])
    ]),

  UserAccessLevel: a.enum(['basic', 'premium', 'admin']),
  UserStatus: a.enum(['online', 'offline', 'away']),
  ChannelType: a.enum(['direct', 'group']),
  TicketStatus: a.enum(['open', 'in_progress', 'closed']),
  TicketPriority: a.enum(['low', 'medium', 'high']),
  EventLogEventType: a.enum(['login', 'message_sent', 'ticket_created', 'page_view']),

  UserAddress: a.customType({
    line1: a.string().required(),
    city: a.string().required(),
    state: a.string().required(),
    zip: a.string().required(),
    country: a.string().required(),
  }),

  UserContactPrefs: a.customType({
    email: a.boolean(),
    push: a.boolean(),
    sms: a.boolean(),
  }),

  UserEmergencyContact: a.customType({
    name: a.string().required(),
    phone: a.string().required(),
    email: a.email().required(),
    address: a.string().required(),
  }),

  UserVehicle: a.customType({
    make: a.string(),
    model: a.string(),
    color: a.string(),
    license: a.string(),
    year: a.string(),
  }),

  UserLocation: a.customType({
    latitude: a.float(),
    longitude: a.float(),
    lastUpdated: a.datetime(),
  }),

  MessageReactions: a.customType({
    emoji: a.string(),
    userIds: a.string().array(),
  }),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
