'use strict';

const { app } = require('@azure/functions');
const { verifyAdmin } = require('../shared/authMiddleware');
const { getResultsTable } = require('../shared/tableClient');
const { MATCHES } = require('../shared/matchData');
const { KO_IDS, GROUP_LETTERS } = require('../shared/bracket');

const GROUP_MATCH_IDS = new Set(MATCHES.map((m) => m.id));

// Admin-curated actual results, stored in the `results` table:
//   PK 'group' / RK matchId      -> { homeScore, awayScore }
//   PK 'ko'    / RK koMatchId     -> { winner }
//   PK 'meta'  / RK 'thirdOrder'  -> { value: JSON array of group letters }
app.http('adminSetResults', {
  methods: ['POST'],
  authLevel: 'anonymous',
  // NB: the Functions host reserves the '/admin' route prefix, so write actual
  // results via POST on the same 'results' route as the public GET (getResults).
  route: 'results',
  handler: async (request) => {
    let user;
    try {
      user = verifyAdmin(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: 'Invalid JSON body' } };
    }

    const table = getResultsTable();
    const now = new Date().toISOString();

    const { groupResults, knockoutWinners, thirdOrder } = body;

    if (groupResults && typeof groupResults === 'object') {
      for (const [matchId, r] of Object.entries(groupResults)) {
        if (!GROUP_MATCH_IDS.has(matchId)) {
          return { status: 400, jsonBody: { error: `Unknown match ${matchId}` } };
        }
        // Empty/null score clears the result (unlocks the match for editing again).
        const isEmpty = (v) => v == null || v === '';
        if (r == null || isEmpty(r.homeScore) || isEmpty(r.awayScore)) {
          await table.deleteEntity('group', matchId).catch(() => {});
          continue;
        }
        const hs = Number(r.homeScore), as = Number(r.awayScore);
        if (!Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0 || hs > 50 || as > 50) {
          return { status: 400, jsonBody: { error: `Bad score for ${matchId}` } };
        }
        await table.upsertEntity({ partitionKey: 'group', rowKey: matchId, homeScore: hs, awayScore: as, updatedAt: now }, 'Replace');
      }
    }

    if (knockoutWinners && typeof knockoutWinners === 'object') {
      for (const [koId, winner] of Object.entries(knockoutWinners)) {
        if (!KO_IDS.has(koId)) {
          return { status: 400, jsonBody: { error: `Unknown knockout match ${koId}` } };
        }
        if (winner == null || winner === '') {
          await table.deleteEntity('ko', koId).catch(() => {});
        } else if (typeof winner === 'string') {
          await table.upsertEntity({ partitionKey: 'ko', rowKey: koId, winner, updatedAt: now }, 'Replace');
        } else {
          return { status: 400, jsonBody: { error: `Bad winner for ${koId}` } };
        }
      }
    }

    if (Array.isArray(thirdOrder)) {
      const letters = thirdOrder.map((g) => String(g).toUpperCase());
      if (letters.some((g) => !GROUP_LETTERS.includes(g)) || new Set(letters).size !== letters.length) {
        return { status: 400, jsonBody: { error: 'thirdOrder must be unique valid group letters' } };
      }
      await table.upsertEntity({ partitionKey: 'meta', rowKey: 'thirdOrder', value: JSON.stringify(letters), updatedAt: now }, 'Replace');
    }

    return { status: 200, jsonBody: { ok: true } };
  },
});
