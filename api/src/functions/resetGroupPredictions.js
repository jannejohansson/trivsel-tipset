'use strict';

const { app } = require('@azure/functions');
const { verifyAuth } = require('../shared/authMiddleware');
const { getMatchesTable, getPredictionsTable } = require('../shared/tableClient');
const { loadResults } = require('../shared/results');

// Clears the caller's group-stage predictions for every *unlocked* match in one
// group. A match is locked (and so skipped) once its kickoff has passed or the
// admin has entered a result for it.
app.http('resetGroupPredictions', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'predictions/reset',
  handler: async (request) => {
    let user;
    try {
      user = verifyAuth(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const group = body && body.group;
    if (typeof group !== 'string' || !/^[A-L]$/.test(group)) {
      return { status: 400, jsonBody: { error: 'group must be a letter A-L' } };
    }

    const now = Date.now();
    const { groupResults } = await loadResults();
    const matchesTable = getMatchesTable();
    const predictionsTable = getPredictionsTable();

    const cleared = [];
    for await (const m of matchesTable.listEntities({
      queryOptions: { filter: `PartitionKey eq '${group}'` },
    })) {
      const kickedOff = m.kickoffUtc ? now >= new Date(m.kickoffUtc).getTime() : false;
      const locked = kickedOff || !!groupResults[m.rowKey];
      if (locked) continue;
      try {
        await predictionsTable.deleteEntity(user.userId, m.rowKey);
        cleared.push(m.rowKey);
      } catch (err) {
        if (err.statusCode !== 404) throw err;
      }
    }

    return { status: 200, jsonBody: { cleared } };
  },
});
