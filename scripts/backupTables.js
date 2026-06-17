'use strict';

// Dump every Table Storage table from a source account to timestamped JSON
// files under backups/<timestamp>/. Use this for disaster-recovery snapshots
// and as the source for restoreTables.js (e.g. to load prod data into Azurite).
//
// The source is taken from SOURCE_TABLE_CONNECTION_STRING (required) so this
// never accidentally backs up the empty local emulator. Fetch the prod string
// without writing it to disk, e.g. in PowerShell:
//
//   $env:SOURCE_TABLE_CONNECTION_STRING = az storage account show-connection-string `
//     --name <account> --resource-group <rg> --query connectionString -o tsv
//   node scripts/backupTables.js
//
// All current columns are String / Int32 / Boolean and timestamps are stored
// as ISO strings, so a plain JSON round-trip preserves types faithfully. If a
// future column uses Int64, DateTime, Guid or Binary, revisit this — those need
// the SDK's Edm type annotations to survive JSON.

const path = require('path');
const fs = require('fs');

const { TableClient } = require(path.join(__dirname, '../api/node_modules/@azure/data-tables'));

const TABLES = ['users', 'magicTokens', 'matches', 'predictions', 'playoffPredictions', 'results'];

const conn = process.env.SOURCE_TABLE_CONNECTION_STRING;
if (!conn) {
  console.error('SOURCE_TABLE_CONNECTION_STRING is not set — point it at the source (e.g. production) storage account.');
  process.exit(1);
}

// Keep partitionKey/rowKey + data fields; drop the store-assigned metadata so
// the destination assigns fresh etag/timestamp on restore.
function strip(entity) {
  const { etag, timestamp, ...rest } = entity;
  delete rest['odata.metadata'];
  return rest;
}

async function backup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const root = path.join(__dirname, '..', 'backups');
  const dir = path.join(root, stamp);
  fs.mkdirSync(dir, { recursive: true });

  const summary = {};
  for (const name of TABLES) {
    const client = TableClient.fromConnectionString(conn, name);
    const rows = [];
    try {
      for await (const entity of client.listEntities()) rows.push(strip(entity));
    } catch (err) {
      if (err.statusCode === 404) {
        console.log(`(skip) ${name}: table does not exist on source`);
        summary[name] = null;
        continue;
      }
      throw err;
    }
    fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(rows, null, 2));
    summary[name] = rows.length;
    console.log(`Backed up ${name}: ${rows.length} ${rows.length === 1 ? 'entity' : 'entities'}`);
  }

  // Pointer so restoreTables.js can default to the newest snapshot.
  fs.writeFileSync(path.join(root, 'latest.txt'), stamp);

  console.log(`\nBackup written to backups/${stamp}`);
  console.log('Summary:', JSON.stringify(summary));
}

backup().catch((err) => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});
