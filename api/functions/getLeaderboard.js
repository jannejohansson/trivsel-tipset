'use strict';

const { app } = require('@azure/functions');

app.http('getLeaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaderboard',
  handler: async (request, context) => {
    return {
      status: 200,
      jsonBody: { message: 'Leaderboard coming soon', users: [] },
    };
  },
});
