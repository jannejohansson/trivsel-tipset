'use strict';

// Shared loaders for leaderboard-style endpoints (getLeaderboard, getLeaderboardHistory).

const { getUsersTable } = require('./tableClient');

// All non-hidden participants as { userId, displayName, lastLoginAt, paid }.
// Hidden users are soft-removed and excluded from public views.
async function collectUsers() {
  const users = [];
  for await (const entity of getUsersTable().listEntities({
    queryOptions: { filter: `PartitionKey eq 'user'` },
  })) {
    if (entity.hidden === true) continue;
    users.push({
      userId: entity.rowKey,
      displayName: entity.displayName || entity.rowKey,
      lastLoginAt: entity.lastLoginAt,
      paid: entity.paid === true,
    });
  }
  return users;
}

// Bucket an entire table by partitionKey (userId) into { userId: { rowKey: mapFn(entity) } }.
async function collectByUser(table, mapFn) {
  const byUser = new Map();
  for await (const entity of table.listEntities()) {
    const uid = entity.partitionKey;
    if (!byUser.has(uid)) byUser.set(uid, {});
    byUser.get(uid)[entity.rowKey] = mapFn(entity);
  }
  return byUser;
}

module.exports = { collectUsers, collectByUser };
