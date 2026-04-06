'use strict';

const jwt = require('jsonwebtoken');

/**
 * Verifies the JWT from the Authorization header.
 * Returns { userId, email } on success.
 * Throws an error with status 401 on failure.
 */
function verifyAuth(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    const err = new Error('Missing authorization token');
    err.status = 401;
    throw err;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: payload.userId, email: payload.email };
  } catch (verifyError) {
    const err = new Error('Invalid or expired token: ' + verifyError.message);
    err.status = 401;
    throw err;
  }
}

/**
 * Attempts to parse auth without throwing — returns null if not authenticated.
 * Used for endpoints where auth is optional.
 */
function tryAuth(request) {
  try {
    return verifyAuth(request);
  } catch {
    return null;
  }
}

module.exports = { verifyAuth, tryAuth };
