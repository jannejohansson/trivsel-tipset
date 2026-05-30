'use strict';

const { app } = require('@azure/functions');
const { getUsersTable, getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { loadResults } = require('../shared/results');
const { MATCHES } = require('../shared/matchData');
const { buildBracket } = require('../shared/bracket');
const { scoreGroupTotal, scorePlayoff } = require('../shared/scoring');

app.http('getLeaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaderboard',
  handler: async () => {
    const [usersRaw, predsByUser, picksByUser, results] = await Promise.all([
      collectUsers(),
      collectByUser(getPredictionsTable(), (e) => ({ homeScore: e.homeScore, awayScore: e.awayScore })),
      collectByUser(getPlayoffTable(), (e) => e.winner),
      loadResults(),
    ]);

    // The single shared actual bracket every user's playoff picks are scored against.
    const actualBracket = buildBracket(MATCHES, results.groupResults, results.knockoutWinners, {
      thirdOrder: results.thirdOrder,
    });

    const users = usersRaw.map((u) => {
      const preds = predsByUser.get(u.userId) || {};
      const picks = picksByUser.get(u.userId) || {};
      const groupPoints = scoreGroupTotal(preds, results.groupResults);
      const predictedBracket = buildBracket(MATCHES, preds, picks);
      const playoffPoints = scorePlayoff(predictedBracket, actualBracket).total;
      return {
        ...u,
        predictionCount: Object.keys(preds).length,
        groupPredictionCount: Object.keys(preds).length,
        playoffPredictionCount: Object.keys(picks).length,
        groupPoints,
        playoffPoints,
        points: groupPoints + playoffPoints,
      };
    });

    users.sort((a, b) =>
      b.points - a.points ||
      b.predictionCount - a.predictionCount ||
      new Date(b.lastLoginAt) - new Date(a.lastLoginAt)
    );

    return { status: 200, jsonBody: { count: users.length, users } };
  },
});

async function collectUsers() {
  const users = [];
  for await (const entity of getUsersTable().listEntities({
    queryOptions: { filter: `PartitionKey eq 'user'` },
  })) {
    users.push({
      userId: entity.rowKey,
      displayName: entity.displayName || entity.rowKey,
      lastLoginAt: entity.lastLoginAt,
    });
  }
  return users;
}

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
