'use strict';

const { app } = require('@azure/functions');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getTokensContainer, getUsersContainer } = require('../shared/cosmosClient');

// JWT expires 10 days after the WC 2026 final (July 19, 2026)
const JWT_EXPIRY = Math.floor(new Date('2026-07-29T23:59:59Z').getTime() / 1000);

app.http('verifyToken', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/verify-token',
  handler: async (request, context) => {
    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const { token } = body;
    if (!token || typeof token !== 'string') {
      return { status: 400, jsonBody: { error: 'Token required' } };
    }

    const tokensContainer = getTokensContainer();

    // Point-read by token (id = token, partition key = token)
    let tokenDoc;
    try {
      const { resource } = await tokensContainer.item(token, token).read();
      tokenDoc = resource;
    } catch {
      tokenDoc = null;
    }

    if (!tokenDoc) {
      return { status: 401, jsonBody: { error: 'Invalid or expired link. Please request a new one.' } };
    }

    const email = tokenDoc.email;

    // Delete token (one-time use)
    try {
      await tokensContainer.item(token, token).delete();
    } catch {
      // Ignore — TTL will clean it up
    }

    // Upsert user
    const usersContainer = getUsersContainer();
    const userId = `user_${crypto.createHash('sha256').update(email).digest('hex').slice(0, 16)}`;
    const now = new Date().toISOString();

    let user;
    try {
      const { resource: existing } = await usersContainer.item(userId, email).read();
      user = existing;
      // Update last login
      await usersContainer.item(userId, email).patch([
        { op: 'set', path: '/lastLoginAt', value: now },
      ]);
    } catch {
      // Create new user
      const displayName = email.split('@')[0];
      user = { id: userId, email, displayName, createdAt: now, lastLoginAt: now };
      await usersContainer.items.create(user);
    }

    // Sign JWT with fixed expiry date
    const sessionToken = jwt.sign(
      { userId: user.id, email: user.email, exp: JWT_EXPIRY },
      process.env.JWT_SECRET
    );

    // Diagnostic: verify the token we just signed to catch secret mismatch early
    let selfVerifyError = null;
    try {
      jwt.verify(sessionToken, process.env.JWT_SECRET);
    } catch (e) {
      selfVerifyError = e.message;
    }

    return {
      status: 200,
      jsonBody: {
        jwt: sessionToken,
        user: { userId: user.id, email: user.email, displayName: user.displayName },
        _debug_selfVerify: selfVerifyError === null ? 'ok' : 'FAILED: ' + selfVerifyError,
      },
    };
  },
});
