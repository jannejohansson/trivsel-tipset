'use strict';

const { app } = require('@azure/functions');
const { verifyAdmin } = require('../shared/authMiddleware');
const { getUsersTable } = require('../shared/tableClient');

// Admin-only: set a participant's `paid` / `hidden` flags. Hiding is a soft action —
// it excludes the user from the public leaderboard but keeps all their data, and is
// reversible by setting `hidden` back to false.
app.http('adminUpdateUser', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'users/{userId}',
  handler: async (request) => {
    try {
      verifyAdmin(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    const userId = request.params.userId;
    if (!userId) {
      return { status: 400, jsonBody: { error: 'userId required' } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const patch = {};
    for (const field of ['paid', 'hidden']) {
      if (field in body) {
        if (typeof body[field] !== 'boolean') {
          return { status: 400, jsonBody: { error: `${field} must be a boolean` } };
        }
        patch[field] = body[field];
      }
    }
    if (Object.keys(patch).length === 0) {
      return { status: 400, jsonBody: { error: 'Nothing to update' } };
    }

    const usersTable = getUsersTable();
    try {
      await usersTable.getEntity('user', userId);
    } catch {
      return { status: 404, jsonBody: { error: 'User not found' } };
    }

    await usersTable.updateEntity({ partitionKey: 'user', rowKey: userId, ...patch }, 'Merge');

    return { status: 200, jsonBody: { ok: true, ...patch } };
  },
});
