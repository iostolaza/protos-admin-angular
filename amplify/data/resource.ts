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
    ledTeams: a.hasMany('Team', 'teamLeadCognitoId'),  
    ticketsRequested: a.hasMany('Ticket', 'requesterId'),
    ticketsAssigned: a.hasMany('Ticket', 'assigneeId'),
    comments: a.hasMany('Comment', 'userCognitoId'),  
    notifications: a.hasMany('Notification', 'userCognitoId'),  
    channels: a.hasMany('UserChannel', 'userCognitoId'),
    messagesSent: a.hasMany('Message', 'senderCognitoId'),
    contacts: a.hasMany('Friend', 'ownerCognitoId'),  
    friendsOf: a.hasMany('Friend', 'friendCognitoId'),
  })
    .identifier(['cognitoId'])
    .secondaryIndexes(index => [index('email')])
    .authorization(allow => [
      allow.ownerDefinedIn('cognitoId').identityClaim('sub').to(['read', 'update', 'delete']),  
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
    .authorization(allow => [allow.ownerDefinedIn('userCognitoId').identityClaim('sub')]),  

  Friend: a.model({  // NEW: Complete Friend model for one-way contacts
      ownerCognitoId: a.string().required(),
      friendCognitoId: a.string().required(),
      addedAt: a.datetime().required(),
      owner: a.belongsTo('User', 'ownerCognitoId'),
      friend: a.belongsTo('User', 'friendCognitoId'),
    })
      .identifier(['ownerCognitoId', 'friendCognitoId'])
      .secondaryIndexes(index => [index('ownerCognitoId').sortKeys(['addedAt'])])  // For sorted lists
      .authorization(allow => [
        allow.ownerDefinedIn('ownerCognitoId').identityClaim('sub').to(['read', 'update', 'delete']),
        allow.group('Admin').to(['create', 'read', 'update', 'delete']),
        allow.authenticated().to(['create']),  // Any auth can create (but owner set to sub)
      ]),

  Channel: a.model({
    name: a.string(),
    creatorCognitoId: a.string().required(),  
    type: a.enum(['direct', 'group']),  
    directKey: a.string(),  
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    members: a.hasMany('UserChannel', 'channelId'),  
    messages: a.hasMany('Message', 'channelId'),  
  })
    .secondaryIndexes(index => [index('directKey')])  
    .authorization(allow => [
      allow.ownerDefinedIn('creatorCognitoId').identityClaim('sub').to(['update', 'delete']),
      allow.authenticated().to(['create', 'read']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),  
    ]),

  UserChannel: a.model({
    userCognitoId: a.string().required(),  
    channelId: a.id().required(),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    user: a.belongsTo('User', 'userCognitoId'),  
    channel: a.belongsTo('Channel', 'channelId'),  
  })
    .identifier(['userCognitoId', 'channelId'])  
    .secondaryIndexes(index => [index('userCognitoId'), index('channelId')])
    .authorization(allow => [
      allow.authenticated().to(['create', 'read']),  
      allow.ownerDefinedIn('userCognitoId').identityClaim('sub').to(['update', 'delete']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),  
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
    sender: a.belongsTo('User', 'senderCognitoId'),  
    channel: a.belongsTo('Channel', 'channelId'),  
  })
    .secondaryIndexes(index => [index('channelId').sortKeys(['timestamp'])])
    .authorization(allow => [
      allow.authenticated().to(['create', 'read']),
      allow.ownerDefinedIn('senderCognitoId').identityClaim('sub').to(['update', 'delete']),
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),  
    ]),

  Team: a.model({
    name: a.string().required(),
    description: a.string(),
    teamLeadCognitoId: a.string().required(),
    teamLeadName: a.string(),
    memberCount: a.integer().default(0),
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    teamLead: a.belongsTo('User', 'teamLeadCognitoId'),  
    members: a.hasMany('TeamMember', 'teamId'),
    tickets: a.hasMany('Ticket', 'teamId'),  
  }).authorization(allow => [
      allow.ownerDefinedIn('teamLeadCognitoId').identityClaim('sub').to(['read', 'update', 'delete']),  
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
    .authorization(allow => [
      allow.ownerDefinedIn('requesterId').identityClaim('sub'),
      allow.groups(['Admin', 'team_lead', 'member'])
    ]),  

  Comment: a.model({
    content: a.string().required(),
    createdAt: a.datetime().required(),
    userCognitoId: a.string().required(),  
    user: a.belongsTo('User', 'userCognitoId'),  
    ticketId: a.id().required(),
    ticket: a.belongsTo('Ticket', 'ticketId'),
  })
    .authorization(allow => [
      allow.ownerDefinedIn('userCognitoId').identityClaim('sub'),
      allow.groups(['Admin', 'team_lead', 'member'])
    ]),  

  Notification: a.model({
    content: a.string().required(),
    createdAt: a.datetime().required(),
    type: a.enum(['team', 'ticket', 'viewTeam']),
    nameType: a.string(),
    userCognitoId: a.string().required(),  
    user: a.belongsTo('User', 'userCognitoId'),  
    isRead: a.boolean().default(false),
  })
    .authorization(allow => [
      allow.ownerDefinedIn('userCognitoId').identityClaim('sub'),
      allow.groups(['Admin'])
    ]),  
    
// NEW: Added Document model (independent; optional link to User via belongsTo if needed later)
  Document: a.model({
    docId: a.id().required(),
    userCognitoId: a.string(),  // Optional: For personal docs; links to User.cognitoId
    ownerIdentityId: a.string(),  // NEW: For protected file sharing (Cognito Identity ID)
    category: a.enum(['Audit', 'Budget', 'FinancialReports', 'Forms', 'Insurance', 'Certificates', 'Policies', 'Legal', 'Minutes', 'ReserveAnalysis', 'Statement', 'ViolationNotice']),  // From strategy
    subcategory: a.string(),  // e.g., 'Board' under Minutes
    fileName: a.string().required(),
    fileKey: a.string().required(),  // S3 key for upload/integration 
    fileType: a.string().default('PDF'),
    description: a.string(),
    effectiveDate: a.date(),
    uploadDate: a.date().required(),
    expiryDate: a.date(),  // For insurance
    status: a.enum(['active', 'expired', 'archived']),
    version: a.integer().default(1),
    permissions: a.string().array().required(),  // e.g., ['User', 'Admin'] for dynamic group access 
    tags: a.string().array(),  // For search
    size: a.integer(),  // Bytes
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    tenantId: a.string(),  // For multi-tenant isolation
  })
    .identifier(['docId'])
    .secondaryIndexes(index => [
      index('category').sortKeys(['uploadDate']),  // GSI1: List by category/date desc 
      index('expiryDate').sortKeys(['status']),   // GSI3: Alert expired
      index('userCognitoId').sortKeys(['category'])  // For user-specific queries
    ])
    .authorization(allow => [
      allow.groupsDefinedIn('permissions').to(['read']),  // Dynamic: Read if user in group listed in permissions 
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      allow.group('Manager').to(['create', 'read', 'update', 'delete']),  // Full for managers 
      allow.group('team_lead').to(['read', 'update']),  // Limited
      allow.group('User').to(['read']),  // Basic read for tenants
      allow.group('Facilities').to(['read'])  // e.g., For facility-related docs
    ]),

  // NEW: Added Transaction model (independent; optional link to User via ownerDefinedIn)
  Transaction: a.model({
    transactionId: a.id().required(),
    accountId: a.string().required(),  // cognito sub; owner field
    type: a.enum(['assessment', 'payment', 'charge', 'other']),
    date: a.date().required(),
    docNumber: a.string(),
    description: a.string(),
    chargeAmount: a.float(),
    paymentAmount: a.float(),
    balance: a.float().required(),  // Computed on insert (client-side for now; Lambda later)
    confirmationNumber: a.string(),
    method: a.string(),  // e.g., 'online'
    status: a.enum(['paid', 'pending', 'overdue']),
    category: a.string(),  // e.g., 'Pool Key'
    recurringId: a.string(),  // For auto-payments
    reconciled: a.boolean().default(false),  // For audits
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    tenantId: a.string(),
  })
    .identifier(['transactionId'])
    .secondaryIndexes(index => [
      index('accountId').sortKeys(['date']),  // GSI2: Ledger by account/date desc 
    ])
    .authorization(allow => [
      allow.ownerDefinedIn('accountId').identityClaim('sub').to(['read']),  // Owner read own transactions 
      allow.group('Admin').to(['create', 'read', 'update', 'delete']),
      allow.group('Manager').to(['read', 'update']),
      allow.group('User').to(['read'])  // Tenants see own finances
    ]),

}).authorization(allow => [allow.resource(postConfirmation)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});