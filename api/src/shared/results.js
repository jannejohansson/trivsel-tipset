'use strict';

const { getResultsTable } = require('./tableClient');

// Load all admin-curated actual results into a structured object:
//   { groupResults: { matchId: {homeScore,awayScore} },
//     knockoutWinners: { koMatchId: team },
//     thirdOrder: [groupLetters] }
//
// `opts.asOfMs` reconstructs the results as they stood at a past instant: any
// entity whose `updatedAt` is at/after the cutoff is skipped (its value didn't
// exist yet). Entities without an `updatedAt` are treated as pre-existing. Used
// to compute "yesterday's" standings for leaderboard movement.
async function loadResults({ asOfMs = null } = {}) {
  const table = getResultsTable();
  const groupResults = {};
  const knockoutWinners = {};
  let thirdOrder = [];
  for await (const e of table.listEntities()) {
    if (asOfMs != null && e.updatedAt && new Date(e.updatedAt).getTime() >= asOfMs) continue;
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
