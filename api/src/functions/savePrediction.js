'use strict';

const { app } = require('@azure/functions');
const { verifyAuth } = require('../shared/authMiddleware');
const { getPredictionsTable, getMatchesTable } = require('../shared/tableClient');

const LOCKOUT_TIMESTAMP = new Date('2026-06-11T18:00:00Z').getTime();

app.http('savePrediction', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'predictions',
  handler: async (request) => {
    let user;
    try {
      user = verifyAuth(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    if (Date.now() >= LOCKOUT_TIMESTAMP) {
      return { status: 403, jsonBody: { error: 'Predictions are locked' } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const { matchId, homeScore, awayScore } = body;
    if (!matchId || typeof matchId !== 'string') {
      return { status: 400, jsonBody: { error: 'matchId required' } };
    }
    if (!Number.isInteger(homeScore) || homeScore < 0 || homeScore > 20) {
      return { status: 400, jsonBody: { error: 'homeScore must be integer 0-20' } };
    }
    if (!Number.isInteger(awayScore) || awayScore < 0 || awayScore > 20) {
      return { status: 400, jsonBody: { error: 'awayScore must be integer 0-20' } };
    }

    // Verify match exists
    const matchesTable = getMatchesTable();
    let matchFound = false;
    for await (const entity of matchesTable.listEntities({
      queryOptions: { filter: `RowKey eq '${matchId}'` },
    })) {
      matchFound = true;
      break;
    }
    if (!matchFound) {
      return { status: 404, jsonBody: { error: 'Match not found' } };
    }

    const now = new Date().toISOString();
    const predictionsTable = getPredictionsTable();
    await predictionsTable.upsertEntity(
      { partitionKey: user.userId, rowKey: matchId, homeScore, awayScore, updatedAt: now },
      'Replace'
    );

    return { status: 200, jsonBody: { prediction: { matchId, homeScore, awayScore, updatedAt: now } } };
  },
});
