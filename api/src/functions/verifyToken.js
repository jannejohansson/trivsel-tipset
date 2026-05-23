'use strict';

const { app } = require('@azure/functions');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getTokensTable, getUsersTable } = require('../shared/tableClient');

const JWT_EXPIRY = Math.floor(new Date('2026-07-30T00:00:00Z').getTime() / 1000);
const COOKIE_EXPIRES = 'Thu, 30 Jul 2026 00:00:00 GMT';

app.http('verifyToken', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/verify-token',
  handler: async (request) => {
    const appUrl = process.env.APP_URL || '';
    const token = new URL(request.url).searchParams.get('token');

    if (!token) {
      return { status: 302, headers: { location: `${appUrl}/login?error=invalid` } };
    }

    const tokensTable = getTokensTable();
    let tokenEntity;
    try {
      tokenEntity = await tokensTable.getEntity('token', token);
    } catch {
      return { status: 302, headers: { location: `${appUrl}/login?error=invalid` } };
    }

    if (!tokenEntity || Date.now() > new Date(tokenEntity.expiresAt).getTime()) {
      try { await tokensTable.deleteEntity('token', token); } catch { /* ignore */ }
      return { status: 302, headers: { location: `${appUrl}/login?error=expired` } };
    }

    const email = tokenEntity.email;

    // Delete token — one-time use
    try { await tokensTable.deleteEntity('token', token); } catch { /* ignore */ }

    // Upsert user
    const usersTable = getUsersTable();
    const userId = `user_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`;
    const now = new Date().toISOString();
    const displayName = email.split('@')[0];

    try {
      const existing = await usersTable.getEntity('user', userId);
      await usersTable.updateEntity(
        { partitionKey: 'user', rowKey: userId, ...existing, lastLoginAt: now },
        'Replace'
      );
    } catch {
      await usersTable.upsertEntity(
        { partitionKey: 'user', rowKey: userId, email, displayName, createdAt: now, lastLoginAt: now },
        'Replace'
      );
    }

    const sessionToken = jwt.sign(
      { userId, email, exp: JWT_EXPIRY },
      process.env.JWT_SECRET
    );

    const secure = (process.env.APP_URL || '').startsWith('https://') ? '; Secure' : '';
    const cookieValue = `auth=${sessionToken}; HttpOnly${secure}; SameSite=Lax; Path=/; Expires=${COOKIE_EXPIRES}`;

    return {
      status: 302,
      headers: {
        location: `${appUrl}/matches`,
        'set-cookie': cookieValue,
      },
    };
  },
});
