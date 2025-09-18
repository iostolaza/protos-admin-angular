// amplify/backend/data/resource.ts (UPDATED)

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
    teams: a.hasMany('TeamMember', 'userCognitoId'),  
    ledTeams: a.hasMany('Team', 'teamLeadId'),
    ticketsRequested: a.hasMany('Ticket', 'requesterId'),
    ticketsAssigned: a.hasMany('Ticket', 'assigneeId'),
    comments: a.hasMany('Comment', 'userCognitoId'),  
    notifications: a.hasMany('Notification', 'userCognitoId'),  
  })
    .identifier(['cognitoId'])
    .secondaryIndexes(index => [index('email')])
    .authorization(allow => [
      allow.ownerDefinedIn('cognitoId').to(['read', 'update', 'delete']),
      allow.authenticated().to(['create', 'read']),
    ]),

  PaymentMethod: a.model({
    userCognitoId: a.string().required(),  
    type: a.string().required(),
    name: a.string().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
    .secondaryIndexes(index => [index('userCognitoId')])  
    .authorization(allow => [allow.ownerDefinedIn('userCognitoId')]),  

  Friend: a.model({
    userCognitoId: a.string().required(),  
    friendCognitoId: a.string().required(),  
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
    .identifier(['userCognitoId', 'friendCognitoId'])  
    .secondaryIndexes(index => [index('userCognitoId')])
    .authorization(allow => [allow.ownerDefinedIn('userCognitoId')]),

  Channel: a.model({
    name: a.string(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
    .authorization(allow => [allow.authenticated()]),

  UserChannel: a.model({
    userCognitoId: a.string().required(),  
    channelId: a.id().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
    .identifier(['userCognitoId', 'channelId'])  
    .secondaryIndexes(index => [index('userCognitoId'), index('channelId')])
    .authorization(allow => [
      allow.authenticated().to(['create', 'read']),
      allow.ownerDefinedIn('userCognitoId').to(['update', 'delete']),
    ]),

  Message: a.model({
    content: a.string(),
    senderCognitoId: a.string().required(),  
    channelId: a.id().required(),
    timestamp: a.datetime().required(),
    attachment: a.string(),
    readBy: a.string().array(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
  })
    .secondaryIndexes(index => [index('channelId').sortKeys(['timestamp'])])
    .authorization(allow => [allow.authenticated()]),

  Team: a.model({
    name: a.string().required(),
    description: a.string(),
    teamLeadCognitoId: a.string().required(),
    teamLeadName: a.string(),
    memberCount: a.integer().default(0),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    members: a.hasMany('TeamMember', 'teamId'),
  }).authorization(allow => [
      allow.owner().identityClaim('teamLeadCognitoId').to(['read', 'update', 'delete']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      allow.group('team_lead').to(['create', 'read']),
      allow.authenticated().to(['read']),
  ]),

  TeamMember: a.model({
    teamId: a.id().required(),
    userCognitoId: a.string().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    user: a.belongsTo('User', 'userCognitoId'),
    team: a.belongsTo('Team', 'teamId'),
  }).authorization(allow => [
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      allow.group('team_lead').to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
  ]),

  // Team: a.model({
  //   id: a.id().required(),
  //   name: a.string().required(),
  //   description: a.string(),
  //   teamLeadId: a.string().required(),  
  //   teamLead: a.belongsTo('User', 'teamLeadId'),
  //   members: a.hasMany('TeamMember', 'teamId'),
  //   tickets: a.hasMany('Ticket', 'teamId'),
  // })
  //   .authorization(allow => [
  //     allow.authenticated().to(['create', 'read']),
  //     allow.ownerDefinedIn('teamLeadId').to(['update', 'delete']),
  //     allow.groups(['Admin', 'team_lead']).to(['update', 'delete']), 
  //   ]),

  // TeamMember: a.model({
  //   teamId: a.id().required(),
  //   userCognitoId: a.string().required(),  
  //   owner: a.string().required(),  
  //   team: a.belongsTo('Team', 'teamId'),
  //   user: a.belongsTo('User', 'userCognitoId'),  
  // })
  //   .identifier(['teamId', 'userCognitoId'])  
  //   .secondaryIndexes(index => [index('userCognitoId')])  
  //   .authorization(allow => [
  //     allow.authenticated().to(['create', 'read']),
  //     allow.ownerDefinedIn('owner').to(['update', 'delete']),
  //     allow.groups(['Admin', 'team_lead']).to(['create', 'update', 'delete']), 
  //   ]),
  
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
    assigneeId: a.string(),
    assignee: a.belongsTo('User', 'assigneeId'),
    teamId: a.id(),
    team: a.belongsTo('Team', 'teamId'),
    attachments: a.string().array(),
    comments: a.hasMany('Comment', 'ticketId'),
  })
    .authorization(allow => [allow.ownerDefinedIn('requesterId'), allow.groups(['Admin', 'team_lead', 'member'])]),  

  Comment: a.model({
    content: a.string().required(),
    createdAt: a.datetime().required(),
    userCognitoId: a.string().required(),  
    user: a.belongsTo('User', 'userCognitoId'),  
    ticketId: a.id().required(),
    ticket: a.belongsTo('Ticket', 'ticketId'),
  })
    .authorization(allow => [allow.ownerDefinedIn('userCognitoId'), allow.groups(['Admin', 'team_lead', 'member'])]),  

  Notification: a.model({
    content: a.string().required(),
    createdAt: a.datetime().required(),
    type: a.enum(['team', 'ticket', 'viewTeam']),
    nameType: a.string(),
    userCognitoId: a.string().required(),  
    user: a.belongsTo('User', 'userCognitoId'),  
    isRead: a.boolean().default(false),
  })
    .authorization(allow => [allow.ownerDefinedIn('userCognitoId'), allow.groups(['Admin'])]),  


}).authorization(allow => [allow.resource(postConfirmation)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});