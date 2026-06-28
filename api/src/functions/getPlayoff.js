'use strict';

const { app } = require('@azure/functions');
const { tryAuth } = require('../shared/authMiddleware');
const { getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { MATCHES } = require('../shared/matchData');
const { buildBracket, PLAYOFF_LOCKOUT } = require('../shared/bracket');
const { isPlayoffLocked } = require('../shared/phase');

app.http('getPlayoff', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'playoff',
  handler: async (request) => {
    const user = tryAuth(request);
    // Locked only at the lockout time (match 73 kickoff). The admin's scoring switch no
    // longer locks picks, so points can be awarded while picks stay editable.
    const locked = isPlayoffLocked();

    const predictions = {};
    const picks = {};
    if (user) {
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
    }

    const bracket = buildBracket(MATCHES, predictions, picks, { allowPartial: true });
    return {
      status: 200,
      jsonBody: { ...bracket, locked, lockoutUtc: new Date(PLAYOFF_LOCKOUT).toISOString() },
    };
  },
});
