'use strict';

const { app } = require('@azure/functions');
const { verifyAuth } = require('../shared/authMiddleware');
const { getPredictionsTable, getMatchesTable, getResultsTable } = require('../shared/tableClient');

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

    // Verify match exists and is not yet locked (locks at its own kickoff)
    const matchesTable = getMatchesTable();
    let matchEntity = null;
    for await (const entity of matchesTable.listEntities({
      queryOptions: { filter: `RowKey eq '${matchId}'` },
    })) {
      matchEntity = entity;
      break;
    }
    if (!matchEntity) {
      return { status: 404, jsonBody: { error: 'Match not found' } };
    }
    if (matchEntity.kickoffUtc && Date.now() >= new Date(matchEntity.kickoffUtc).getTime()) {
      return { status: 403, jsonBody: { error: 'Match is locked' } };
    }
    // Locks early once the admin has entered a result for this match.
    try {
      await getResultsTable().getEntity('group', matchId);
      return { status: 403, jsonBody: { error: 'Match is locked' } };
    } catch (err) {
      if (err.statusCode !== 404) throw err;
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
