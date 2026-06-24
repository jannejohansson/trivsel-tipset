'use strict';

const { app } = require('@azure/functions');
const { verifyAdmin } = require('../shared/authMiddleware');
const { getUsersTable, getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { MATCHES } = require('../shared/matchData');
const { buildBracket } = require('../shared/bracket');

// Bucket an entire table by partitionKey (userId) into { rowKey: mapFn(entity) }.
async function collectByUser(table, mapFn) {
  const byUser = new Map();
  for await (const entity of table.listEntities()) {
    const uid = entity.partitionKey;
    if (!byUser.has(uid)) byUser.set(uid, {});
    byUser.get(uid)[entity.rowKey] = mapFn(entity);
  }
  return byUser;
}

// Admin-only participant list (includes hidden users so they can be restored).
// NB: the Functions host reserves the '/admin' route prefix, so this lives on
// the 'users' route; the distinct 'users/{userId}/predictions' template is unaffected.
app.http('adminListUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users',
  handler: async (request) => {
    try {
      verifyAdmin(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    const [predsByUser, picksByUser] = await Promise.all([
      collectByUser(getPredictionsTable(), (e) => ({ homeScore: e.homeScore, awayScore: e.awayScore })),
      collectByUser(getPlayoffTable(), (e) => e.winner),
    ]);

    const users = [];
    for await (const e of getUsersTable().listEntities({
      queryOptions: { filter: `PartitionKey eq 'user'` },
    })) {
      const preds = predsByUser.get(e.rowKey) || {};
      const picks = picksByUser.get(e.rowKey) || {};
      // Mirror getLeaderboard's counting: stale playoff picks linger in the table but
      // buildBracket nulls them out, so count only picks still valid in the bracket.
      const predictedBracket = buildBracket(MATCHES, preds, picks, { allowPartial: true });
      users.push({
        userId: e.rowKey,
        email: e.email,
        displayName: e.displayName || e.rowKey,
        paid: e.paid === true,
        hidden: e.hidden === true,
        titles: Number(e.titles) || 0,
        createdAt: e.createdAt,
        lastLoginAt: e.lastLoginAt,
        groupPredictionCount: Object.keys(preds).length,
        playoffPredictionCount: predictedBracket.matches.filter((m) => m.pick).length,
      });
    }
    users.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'sv'));

    return { status: 200, jsonBody: { users } };
  },
});
