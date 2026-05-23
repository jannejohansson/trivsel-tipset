'use strict';

const { app } = require('@azure/functions');
const { tryAuth } = require('../shared/authMiddleware');
const { getUsersTable } = require('../shared/tableClient');

app.http('me', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: async (request) => {
    const user = tryAuth(request);
    if (!user) {
      return { status: 401, jsonBody: { error: 'Not authenticated' } };
    }

    let displayName = user.email.split('@')[0];
    let displayNameConfirmed = false;
    try {
      const entity = await getUsersTable().getEntity('user', user.userId);
      displayName = entity.displayName || displayName;
      displayNameConfirmed = entity.displayNameConfirmed === true;
    } catch { /* use defaults */ }

    return {
      status: 200,
      jsonBody: { userId: user.userId, email: user.email, displayName, displayNameConfirmed },
    };
  },
});
