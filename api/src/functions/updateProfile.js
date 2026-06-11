'use strict';

const { app } = require('@azure/functions');
const { verifyAuth } = require('../shared/authMiddleware');
const { getUsersTable } = require('../shared/tableClient');
const { NAME_LOCKOUT_TIMESTAMP } = require('../shared/constants');

app.http('updateProfile', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/profile',
  handler: async (request) => {
    let user;
    try {
      user = verifyAuth(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    if (Date.now() >= NAME_LOCKOUT_TIMESTAMP) {
      return { status: 403, jsonBody: { error: 'name_locked' } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const displayName = (body.displayName || '').trim();
    if (!displayName || displayName.length > 30) {
      return { status: 400, jsonBody: { error: 'Display name must be 1–30 characters' } };
    }

    await getUsersTable().updateEntity(
      { partitionKey: 'user', rowKey: user.userId, displayName, displayNameConfirmed: true },
      'Merge'
    );

    return {
      status: 200,
      jsonBody: { userId: user.userId, email: user.email, displayName, displayNameConfirmed: true },
    };
  },
});
