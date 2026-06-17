'use strict';

// Restore a backup produced by backupTables.js into a destination account by
// upserting every entity. Defaults to the local Azurite emulator (via
// api/local.settings.json) and the newest snapshot in backups/.
//
//   node scripts/restoreTables.js               # newest backup -> Azurite
//   node scripts/restoreTables.js <backup-dir>  # a specific snapshot
//
// Upsert ('Replace') makes this idempotent and mirrors the source row-by-row.
// It does NOT delete rows that exist only in the destination — wipe first if you
// need an exact mirror.
//
// Safety: writing into anything that isn't obviously local is refused unless
// ALLOW_REMOTE_RESTORE=1, so a stray prod connection string can't be clobbered
// by accident.

const path = require('path');
const fs = require('fs');

// Default destination to the local emulator from local.settings.json.
if (!process.env.TABLE_CONNECTION_STRING) {
  try {
    const settings = require(path.join(__dirname, '../api/local.settings.json'));
    for (const [key, val] of Object.entries(settings.Values || {})) {
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* CI / env-provided */ }
}

const { TableClient } = require(path.join(__dirname, '../api/node_modules/@azure/data-tables'));

const TABLES = ['users', 'magicTokens', 'matches', 'predictions', 'playoffPredictions', 'results'];

const conn = process.env.TABLE_CONNECTION_STRING;
if (!conn) {
  console.error('TABLE_CONNECTION_STRING is not set.');
  process.exit(1);
}

const isLocal = /UseDevelopmentStorage=true/i.test(conn) || /127\.0\.0\.1|localhost|azurite/i.test(conn);
if (!isLocal && process.env.ALLOW_REMOTE_RESTORE !== '1') {
  console.error('Destination does not look local. Refusing to restore.');
  console.error('Set ALLOW_REMOTE_RESTORE=1 to restore into a remote account (e.g. disaster recovery).');
  process.exit(1);
}

function resolveBackupDir() {
  const arg = process.argv[2];
  if (arg) return path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg);
  const pointer = path.join(__dirname, '..', 'backups', 'latest.txt');
  if (fs.existsSync(pointer)) {
    return path.join(__dirname, '..', 'backups', fs.readFileSync(pointer, 'utf8').trim());
  }
  throw new Error('No backup dir given and backups/latest.txt not found — run backupTables.js first.');
}

async function ensureTable(client) {
  try {
    await client.createTable();
  } catch (err) {
    if (err.statusCode !== 409) throw err; // 409 = already exists
  }
}

async function restore() {
  const dir = resolveBackupDir();
  if (!fs.existsSync(dir)) throw new Error(`Backup dir not found: ${dir}`);
  console.log(`Restoring from ${dir}`);
  console.log(`Destination: ${isLocal ? 'LOCAL Azurite emulator' : 'REMOTE account'}\n`);

  const summary = {};
  for (const name of TABLES) {
    const file = path.join(dir, `${name}.json`);
    if (!fs.existsSync(file)) {
      console.log(`(skip) ${name}: no backup file`);
      summary[name] = null;
      continue;
    }
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    const client = TableClient.fromConnectionString(conn, name);
    await ensureTable(client);
    let count = 0;
    for (const entity of rows) {
      await client.upsertEntity(entity, 'Replace');
      count++;
    }
    summary[name] = count;
    console.log(`Restored ${name}: ${count} ${count === 1 ? 'entity' : 'entities'}`);
  }

  console.log('\nSummary:', JSON.stringify(summary));
}

restore().catch((err) => {
  console.error('Restore failed:', err.message);
  process.exit(1);
});
