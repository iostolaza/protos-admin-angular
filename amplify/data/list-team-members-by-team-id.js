// amplify/data/list-team-members-by-team-id.js (NEW FILE)

import { util } from '@aws-appsync/utils';

export function request(ctx) {
  return {
    operation: 'Query',
    query: {
      expression: '#teamId = :teamId',
      expressionNames: { '#teamId': 'teamId' },
      expressionValues: util.dynamodb.toMapValues({ ':teamId': ctx.args.teamId })
    },
    limit: ctx.args.limit,
    nextToken: ctx.args.nextToken,
    // No indexName needed; queries base table primary index
    // scanIndexForward: true (default ascending by sort key 'userCognitoId')
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}