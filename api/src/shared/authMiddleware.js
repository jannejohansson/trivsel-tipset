'use strict';

const jwt = require('jsonwebtoken');
const cookie = require('cookie');

function extractToken(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookie.parse(cookieHeader);
  return cookies['auth'] || null;
}

function verifyAuth(request) {
  const token = extractToken(request);
  if (!token) {
    const err = new Error('Not authenticated');
    err.status = 401;
    throw err;
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    const err = new Error('Invalid or expired session');
    err.status = 401;
    throw err;
  }
}

function tryAuth(request) {
  try {
    return verifyAuth(request);
  } catch {
    return null;
  }
}

module.exports = { verifyAuth, tryAuth };
