'use strict';

const { app } = require('@azure/functions');
const { getUsersTable, getPredictionsTable } = require('../shared/tableClient');

app.http('getLeaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaderboard',
  handler: async () => {
    // Load users and prediction counts in parallel
    const [usersRaw, predCounts] = await Promise.all([
      collectUsers(),
      countPredictionsPerUser(),
    ]);

    const users = usersRaw.map(u => ({
      ...u,
      predictionCount: predCounts.get(u.userId) || 0,
    }));

    users.sort((a, b) => new Date(b.lastLoginAt) - new Date(a.lastLoginAt));

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

async function countPredictionsPerUser() {
  const counts = new Map();
  for await (const entity of getPredictionsTable().listEntities()) {
    const uid = entity.partitionKey;
    counts.set(uid, (counts.get(uid) || 0) + 1);
  }
  return counts;
}
