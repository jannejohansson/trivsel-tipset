'use strict';

const { TIER_POINTS } = require('./scoring');

// The round a match's winner advances INTO, and thus the reached-set / tier that
// "predicting this fixture's winner to go through" maps onto. Final winners reach CHAMP.
const NEXT_ROUND = { R32: 'R16', R16: 'QF', QF: 'SF', SF: 'F', F: 'CHAMP' };

// Base per-fixture info derived from the actual (admin-curated) bracket — only fixtures
// whose two real teams are both resolved are returned. `status` combines the admin winner
// (completed) with the scheduled kickoff (inProgress vs upcoming). `advanceRound` is the
// reached-round a winner earns, worth `advancePoints`. Consumers annotate per-user or in
// aggregate on top of this. Ordered chronologically by kickoff.
function actualFixtures(actualBracket, knockoutWinners, now = Date.now()) {
  const out = [];
  for (const m of actualBracket.matches) {
    if (!m.home.team || !m.away.team) continue; // real teams not known yet
    const completed = !!knockoutWinners[m.id];
    const kicked = m.kickoffUtc ? now >= new Date(m.kickoffUtc).getTime() : false;
    const advanceRound = NEXT_ROUND[m.round];
    out.push({
      id: m.id,
      round: m.round,
      kickoffUtc: m.kickoffUtc,
      venue: m.venue,
      home: { team: m.home.team, flag: m.home.flag },
      away: { team: m.away.team, flag: m.away.flag },
      status: completed ? 'completed' : kicked ? 'inProgress' : 'upcoming',
      actualWinner: completed ? m.pick : null,
      advanceRound,
      advancePoints: TIER_POINTS[advanceRound],
    });
  }
  out.sort((a, b) => new Date(a.kickoffUtc) - new Date(b.kickoffUtc));
  return out;
}

// Teams a bracket sends to the Round of 32 (i.e. predicted to qualify from the groups),
// as an ordered Map name -> flag. Mirrors reachedSets(...).R32 but keeps the flags.
function r32Map(bracket) {
  const map = new Map();
  for (const m of bracket.matches) {
    if (m.round !== 'R32') continue;
    if (m.home.team) map.set(m.home.team, m.home.flag);
    if (m.away.team) map.set(m.away.team, m.away.flag);
  }
  return map;
}

module.exports = { actualFixtures, r32Map, NEXT_ROUND };
