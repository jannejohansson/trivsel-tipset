'use strict';

const { app } = require('@azure/functions');
const { verifyAuth } = require('../shared/authMiddleware');
const { getPredictionsContainer, getMatchesContainer } = require('../shared/cosmosClient');

const LOCKOUT_TIMESTAMP = new Date('2026-06-11T18:00:00Z').getTime();

app.http('savePrediction', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'predictions',
  handler: async (request, context) => {
    // Auth
    let user;
    try {
      user = verifyAuth(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    // Lockout check
    if (Date.now() >= LOCKOUT_TIMESTAMP) {
      return { status: 403, jsonBody: { error: 'Predictions are locked — the tournament has started.' } };
    }

    // Parse body
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
      return { status: 400, jsonBody: { error: 'homeScore must be an integer between 0 and 20' } };
    }
    if (!Number.isInteger(awayScore) || awayScore < 0 || awayScore > 20) {
      return { status: 400, jsonBody: { error: 'awayScore must be an integer between 0 and 20' } };
    }

    // Verify match exists
    const matchesContainer = getMatchesContainer();
    try {
      // matchId format: match_001, partition key is the group letter
      // We need to find the match — use a query since we don't know the group
      const { resources } = await matchesContainer.items.query(
        {
          query: 'SELECT c.id, c.group FROM c WHERE c.id = @matchId',
          parameters: [{ name: '@matchId', value: matchId }],
        },
        { enableCrossPartitionQuery: true }
      ).fetchAll();

      if (!resources.length) {
        return { status: 404, jsonBody: { error: 'Match not found' } };
      }
    } catch (err) {
      context.log('Error verifying match:', err);
      return { status: 500, jsonBody: { error: 'Failed to verify match' } };
    }

    // Upsert prediction
    const predsContainer = getPredictionsContainer();
    const predId = `pred_${user.userId}_${matchId}`;
    const now = new Date().toISOString();

    const prediction = {
      id: predId,
      userId: user.userId,
      matchId,
      homeScore,
      awayScore,
      updatedAt: now,
    };

    try {
      await predsContainer.items.upsert(prediction);
    } catch (err) {
      context.log('Error saving prediction:', err);
      return { status: 500, jsonBody: { error: 'Failed to save prediction' } };
    }

    return { status: 200, jsonBody: { prediction: { matchId, homeScore, awayScore, updatedAt: now } } };
  },
});
