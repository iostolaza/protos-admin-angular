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
    })
    .authorization(allow => [allow.owner()]),
  PaymentMethod: a
    .model({
      userId: a.id().required(),
      type: a.string(),
      name: a.string(),
    })
    .authorization(allow => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
