import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource'; 

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
    teams: a.hasMany('TeamMember', 'userId'), 
    ledTeams: a.hasMany('Team', 'teamLeadId'), 
    ticketsRequested: a.hasMany('Ticket', 'requesterId'),
    ticketsAssigned: a.hasMany('Ticket', 'assigneeId'),
    comments: a.hasMany('Comment', 'userId'),
    notifications: a.hasMany('Notification', 'userId'),
  })
    .identifier(['cognitoId'])
    .secondaryIndexes(index => [index('email')])
    .authorization(allow => [
      allow.ownerDefinedIn('cognitoId').to(['read', 'update', 'delete']),
      allow.authenticated().to(['create', 'read']), 
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
    .secondaryIndexes(index => [index('userId'), index('channelId')]) 
    .authorization(allow => [
      allow.authenticated().to(['create', 'read']), 
      allow.ownerDefinedIn('userId').to(['update', 'delete']),
    ]),

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

  Team: a.model({
    id: a.id().required(),
    name: a.string().required(),
    description: a.string(),
    teamLeadId: a.string().required(), 
    teamLead: a.belongsTo('User', 'teamLeadId'),
    members: a.hasMany('TeamMember', 'teamId'),
    tickets: a.hasMany('Ticket', 'teamId'),
  }).authorization(allow => [
    allow.authenticated().to(['create', 'read']),  
    allow.groups(['admin', 'team_lead']).to(['update', 'delete']),  
  ]),

  TeamMember: a.model({
      teamId: a.id().required(),
      userId: a.string().required(),
      team: a.belongsTo('Team', 'teamId'),
      user: a.belongsTo('User', 'userId'),
    }).secondaryIndexes(index => [index('teamId'), index('userId')])  
      .authorization(allow => [allow.groups(['admin', 'team_lead'])]),

  Ticket: a.model({
    id: a.id().required(),
    title: a.string().required(),
    description: a.string().required(),
    labels: a.string().array(),
    status: a.enum(['OPEN', 'QUEUED', 'IN_PROGRESS', 'COMPLETE', 'CLOSED', 'REOPENED']),
    estimated: a.date().required(),
    createdAt: a.datetime().required(),
    updatedAt: a.datetime(),
    startDate: a.datetime(),
    completionDate: a.datetime(),
    requesterId: a.string().required(), 
    requester: a.belongsTo('User', 'requesterId'),
    assigneeId: a.string(),  // Not required, can be null
    assignee: a.belongsTo('User', 'assigneeId'),
    teamId: a.id().required(),
    team: a.belongsTo('Team', 'teamId'),
    attachments: a.string().array(),
    comments: a.hasMany('Comment', 'ticketId'),
  }).authorization(allow => [allow.ownerDefinedIn('requesterId'), allow.groups(['admin', 'team_lead', 'member'])]),

  Comment: a.model({
    content: a.string().required(),
    createdAt: a.datetime().required(),
    userId: a.string().required(), 
    user: a.belongsTo('User', 'userId'),
    ticketId: a.id().required(),
    ticket: a.belongsTo('Ticket', 'ticketId'),
  }).authorization(allow => [allow.ownerDefinedIn('userId'), allow.groups(['admin', 'team_lead', 'member'])]),

  Notification: a.model({
    content: a.string().required(),
    createdAt: a.datetime().required(),
    type: a.enum(['team', 'ticket', 'viewTeam']),
    nameType: a.string(),
    userId: a.string().required(),  
    user: a.belongsTo('User', 'userId'),
    isRead: a.boolean().default(false),
  }).authorization(allow => [allow.ownerDefinedIn('userId'), allow.groups(['admin'])]),

}).authorization(allow => [allow.resource(postConfirmation)]);


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});