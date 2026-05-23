'use strict';

const path = require('path');

// Load local settings if TABLE_CONNECTION_STRING is not set
if (!process.env.TABLE_CONNECTION_STRING) {
  try {
    const settings = require(path.join(__dirname, '../api/local.settings.json'));
    for (const [key, val] of Object.entries(settings.Values || {})) {
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* running in CI with env vars set */ }
}

const { TableClient } = require(path.join(__dirname, '../api/node_modules/@azure/data-tables'));
const { MATCHES } = require(path.join(__dirname, '../api/src/shared/matchData'));

const TABLE_NAMES = ['matches', 'users', 'magicTokens', 'predictions'];
const conn = process.env.TABLE_CONNECTION_STRING;

async function ensureTable(name) {
  const client = TableClient.fromConnectionString(conn, name);
  try {
    await client.createTable();
    console.log(`Created table: ${name}`);
  } catch (err) {
    if (err.statusCode === 409) {
      console.log(`Table already exists: ${name}`);
    } else {
      throw err;
    }
  }
  return client;
}

async function seed() {
  for (const name of TABLE_NAMES) {
    await ensureTable(name);
  }

  const matchesTable = TableClient.fromConnectionString(conn, 'matches');
  let count = 0;
  for (const match of MATCHES) {
    await matchesTable.upsertEntity(
      {
        partitionKey: match.group,
        rowKey: match.id,
        matchday: match.matchday,
        matchNumber: match.matchNumber,
        homeTeam: match.homeTeam,
        homeFlag: match.homeFlag,
        awayTeam: match.awayTeam,
        awayFlag: match.awayFlag,
        kickoffUtc: match.kickoffUtc,
        venue: match.venue,
      },
      'Replace'
    );
    count++;
  }
  console.log(`Seeded ${count} matches.`);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
