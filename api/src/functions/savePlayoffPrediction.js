'use strict';

const { app } = require('@azure/functions');
const { verifyAuth } = require('../shared/authMiddleware');
const { getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { MATCHES } = require('../shared/matchData');
const { buildBracket, KO_IDS } = require('../shared/bracket');
const { loadResults } = require('../shared/results');
const { isPlayoffMode } = require('../shared/phase');

app.http('savePlayoffPrediction', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'playoff',
  handler: async (request) => {
    let user;
    try {
      user = verifyAuth(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    // Locked at the lockout time OR whenever the admin has flipped playoff mode on.
    if (isPlayoffMode(await loadResults())) {
      return { status: 403, jsonBody: { error: 'Playoff picks are locked' } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const { koMatchId, winner } = body;
    if (!koMatchId || !KO_IDS.has(koMatchId)) {
      return { status: 400, jsonBody: { error: 'Valid koMatchId required' } };
    }
    if (!winner || typeof winner !== 'string') {
      return { status: 400, jsonBody: { error: 'winner required' } };
    }

    // Rebuild this user's bracket from their group predictions + saved picks, and
    // confirm `winner` is actually one of the two teams in this tie.
    const predictions = {};
    const picks = {};
    const predictionsTable = getPredictionsTable();
    for await (const e of predictionsTable.listEntities({
      queryOptions: { filter: `PartitionKey eq '${user.userId}'` },
    })) {
      predictions[e.rowKey] = { homeScore: e.homeScore, awayScore: e.awayScore };
    }
    const playoffTable = getPlayoffTable();
    for await (const e of playoffTable.listEntities({
      queryOptions: { filter: `PartitionKey eq '${user.userId}'` },
    })) {
      picks[e.rowKey] = e.winner;
    }

    const bracket = buildBracket(MATCHES, predictions, picks, { allowPartial: true });
    const match = bracket.matches.find((m) => m.id === koMatchId);
    if (!match || !match.complete) {
      return { status: 409, jsonBody: { error: 'This tie is not decided yet' } };
    }
    if (winner !== match.home.team && winner !== match.away.team) {
      return { status: 422, jsonBody: { error: 'Winner is not part of this tie' } };
    }

    const now = new Date().toISOString();
    await playoffTable.upsertEntity(
      { partitionKey: user.userId, rowKey: koMatchId, winner, updatedAt: now },
      'Replace'
    );

    // Re-resolve so downstream picks orphaned by this change are reported as cleared.
    picks[koMatchId] = winner;
    const updated = buildBracket(MATCHES, predictions, picks, { allowPartial: true });

    return { status: 200, jsonBody: { ...updated, locked: false } };
  },
});
