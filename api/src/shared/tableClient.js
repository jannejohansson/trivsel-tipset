'use strict';

const { TableClient } = require('@azure/data-tables');

function getTable(name) {
  const conn = process.env.TABLE_CONNECTION_STRING;
  if (!conn) throw new Error('TABLE_CONNECTION_STRING is not set');
  return TableClient.fromConnectionString(conn, name);
}

function getUsersTable() { return getTable('users'); }
function getTokensTable() { return getTable('magicTokens'); }
function getMatchesTable() { return getTable('matches'); }
function getPredictionsTable() { return getTable('predictions'); }
function getPlayoffTable() { return getTable('playoffPredictions'); }
function getResultsTable() { return getTable('results'); }

module.exports = {
  getUsersTable,
  getTokensTable,
  getMatchesTable,
  getPredictionsTable,
  getPlayoffTable,
  getResultsTable,
};
