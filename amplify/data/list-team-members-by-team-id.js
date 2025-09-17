// amplify/data/list-team-members-by-team-id.js (UPDATED)

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
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.Items;  // CHANGE: Return ctx.result.Items (capital I) to match DynamoDB Query response key; ensures LIST type for GraphQL
}