'use strict';

const { app } = require('@azure/functions');

app.http('logout', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/logout',
  handler: async () => {
    return {
      status: 200,
      headers: {
        'set-cookie': 'auth=; HttpOnly; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      },
      jsonBody: { message: 'Logged out' },
    };
  },
});
