'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Verifies the JWT from the Authorization header.
 * Returns { userId, email } on success.
 * Throws an error with status 401 on failure.
 */
function verifyAuth(request) {
  // Azure SWA injects its own Authorization header which gets concatenated with
  // the client's header via ", " — take only the first value.
  const firstAuth = (request.headers.get('authorization') || '').split(',')[0].trim();
  const token = firstAuth.startsWith('Bearer ') ? firstAuth.slice(7).trim() : null;

  if (!token) {
    const err = new Error('Missing authorization token');
    err.status = 401;
    throw err;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: payload.userId, email: payload.email };
  } catch (verifyError) {
    const secretHash = crypto.createHash('sha256').update(process.env.JWT_SECRET || '').digest('hex').slice(0, 8);
    const tokenHash = crypto.createHash('sha256').update(token || '').digest('hex').slice(0, 8);
    const err = new Error('Invalid or expired token: ' + verifyError.message + ' [secretHash:' + secretHash + '] [tokenHash:' + tokenHash + '] [tokenLen:' + (token || '').length + ']');
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
