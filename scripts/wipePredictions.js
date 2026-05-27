'use strict';

const path = require('path');

if (!process.env.TABLE_CONNECTION_STRING) {
  try {
    const settings = require(path.join(__dirname, '../api/local.settings.json'));
    for (const [key, val] of Object.entries(settings.Values || {})) {
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* running in CI with env vars set */ }
}

const { TableClient } = require(path.join(__dirname, '../api/node_modules/@azure/data-tables'));

async function wipe() {
  const conn = process.env.TABLE_CONNECTION_STRING;
  if (!conn) {
    console.error('TABLE_CONNECTION_STRING is not set.');
    process.exit(1);
  }

  const client = TableClient.fromConnectionString(conn, 'predictions');
  let count = 0;
  try {
    for await (const entity of client.listEntities()) {
      await client.deleteEntity(entity.partitionKey, entity.rowKey);
      count++;
    }
  } catch (err) {
    if (err.statusCode === 404) {
      console.log('predictions table does not exist — nothing to wipe.');
      return;
    }
    throw err;
  }
  console.log(`Wiped ${count} prediction(s) from the predictions table.`);
}

wipe().catch(err => {
  console.error('Wipe failed:', err.message);
  process.exit(1);
});
