'use strict';

const { getResultsTable } = require('./tableClient');

// Load all admin-curated actual results into a structured object:
//   { groupResults: { matchId: {homeScore,awayScore} },
//     knockoutWinners: { koMatchId: team },
//     thirdOrder: [groupLetters],
//     playoffScoring: bool }
//
// `playoffScoring` is an admin master-switch: while false, playoff points are not
// awarded to users (so the admin can populate/test the knockout tree before the
// playoff actually starts). Defaults to false until explicitly enabled.
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
  let playoffScoring = false;
  for await (const e of table.listEntities()) {
    if (asOfMs != null && e.updatedAt && new Date(e.updatedAt).getTime() >= asOfMs) continue;
    if (e.partitionKey === 'group') {
      groupResults[e.rowKey] = { homeScore: e.homeScore, awayScore: e.awayScore };
    } else if (e.partitionKey === 'ko') {
      knockoutWinners[e.rowKey] = e.winner;
    } else if (e.partitionKey === 'meta' && e.rowKey === 'thirdOrder') {
      try { thirdOrder = JSON.parse(e.value || '[]'); } catch { thirdOrder = []; }
    } else if (e.partitionKey === 'meta' && e.rowKey === 'playoffScoring') {
      playoffScoring = e.value === '1' || e.value === true || e.value === 'true';
    }
  }
  return { groupResults, knockoutWinners, thirdOrder, playoffScoring };
}

module.exports = { loadResults };
