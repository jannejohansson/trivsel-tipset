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

function isAdminEmail(email) {
  const admin = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return !!admin && !!email && email.trim().toLowerCase() === admin;
}

function verifyAdmin(request) {
  const user = verifyAuth(request);
  if (!isAdminEmail(user.email)) {
    const err = new Error('Admin access required');
    err.status = 403;
    throw err;
  }
  return user;
}

module.exports = { verifyAuth, tryAuth, verifyAdmin, isAdminEmail };
