'use strict';

// One-time script to seed the matches container in Cosmos DB.
// Run from the /api directory: node seed/seedMatches.js
// Requires COSMOS_CONNECTION_STRING and COSMOS_DATABASE_NAME in environment
// or in a .env file loaded via dotenv.

const path = require('path');

// Load local.settings.json as env vars if not already set
if (!process.env.COSMOS_CONNECTION_STRING) {
  try {
    const settings = require('../local.settings.json');
    Object.assign(process.env, settings.Values);
    console.log('Loaded env from local.settings.json');
  } catch {
    console.warn('No local.settings.json found — using existing environment variables');
  }
}

const { CosmosClient } = require('@azure/cosmos');
const { MATCHES } = require('../shared/matchData');

async function seed() {
  const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
  const db = client.database(process.env.COSMOS_DATABASE_NAME);
  const container = db.container('matches');

  console.log(`Seeding ${MATCHES.length} matches into Cosmos DB...`);

  let upserted = 0;
  for (const match of MATCHES) {
    await container.items.upsert(match);
    upserted++;
    process.stdout.write(`\r  ${upserted}/${MATCHES.length} matches upserted`);
  }

  console.log('\nDone!');
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
