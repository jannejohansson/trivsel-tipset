'use strict';

const { app } = require('@azure/functions');
const { verifyAdmin } = require('../shared/authMiddleware');
const { getUsersTable } = require('../shared/tableClient');

// Admin-only participant list (includes hidden users so they can be restored).
// NB: the Functions host reserves the '/admin' route prefix, so this lives on
// the 'users' route; the distinct 'users/{userId}/predictions' template is unaffected.
app.http('adminListUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users',
  handler: async (request) => {
    try {
      verifyAdmin(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    const users = [];
    for await (const e of getUsersTable().listEntities({
      queryOptions: { filter: `PartitionKey eq 'user'` },
    })) {
      users.push({
        userId: e.rowKey,
        email: e.email,
        displayName: e.displayName || e.rowKey,
        paid: e.paid === true,
        hidden: e.hidden === true,
        createdAt: e.createdAt,
        lastLoginAt: e.lastLoginAt,
      });
    }
    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'sv'));

    return { status: 200, jsonBody: { users } };
  },
});
