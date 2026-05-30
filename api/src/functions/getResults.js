'use strict';

const { app } = require('@azure/functions');
const { loadResults } = require('../shared/results');

// Public read of the admin-curated actual results (actual scores are public knowledge).
app.http('getResults', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'results',
  handler: async () => {
    const results = await loadResults();
    return { status: 200, jsonBody: results };
  },
});
