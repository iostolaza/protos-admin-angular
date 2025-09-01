import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'us-west-1_8wc5eQRBW',
  identityPoolId: 'us-west-1:494bbaef-029d-4e29-9bd0-80b1f35b014b',
  authRoleArn: 'arn:aws:iam::381491980392:role/us-west-1_nRD5vuO0j-authRole',
  unauthRoleArn: 'arn:aws:iam::381491980392:role/amplify-protosadminangula-amplifyAuthunauthenticate-pLjjjxqoCEgu',
  userPoolClientId: '5ea0rq5tkkhr3j4de0r0eqo949'
});
