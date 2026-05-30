'use strict';

const { getResultsTable } = require('./tableClient');

// Load all admin-curated actual results into a structured object:
//   { groupResults: { matchId: {homeScore,awayScore} },
//     knockoutWinners: { koMatchId: team },
//     thirdOrder: [groupLetters] }
async function loadResults() {
  const table = getResultsTable();
  const groupResults = {};
  const knockoutWinners = {};
  let thirdOrder = [];
  for await (const e of table.listEntities()) {
    if (e.partitionKey === 'group') {
      groupResults[e.rowKey] = { homeScore: e.homeScore, awayScore: e.awayScore };
    } else if (e.partitionKey === 'ko') {
      knockoutWinners[e.rowKey] = e.winner;
    } else if (e.partitionKey === 'meta' && e.rowKey === 'thirdOrder') {
      try { thirdOrder = JSON.parse(e.value || '[]'); } catch { thirdOrder = []; }
    }
  }
  return { groupResults, knockoutWinners, thirdOrder };
}

module.exports = { loadResults };
