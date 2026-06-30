'use strict';

// Still-achievable points & standings movement (server-only — no frontend mirror).
//
// Group points are banked per match once a result exists; the only way to still gain
// group points is from a predicted-but-unplayed match (max 5 each). Playoff points are
// awarded per team correctly predicted to REACH a round, scored against the single shared
// actual bracket. Computing a user's best/worst still-possible playoff total is an
// optimization over the real knockout tree: each undecided real match can go either way,
// but only ONE of the two teams advances — so a user who tipped both teams of a real tie
// to go further can't bank both. A small DP up the bracket captures this exactly, and the
// worst-case pass captures GUARANTEED future points (e.g. two of a user's predicted
// finalists meeting in a real semi → one is certain to reach the final).

const { KO_MATCHES } = require('./bracket');
const { TIER_POINTS, reachedSets } = require('./scoring');
const { NEXT_ROUND } = require('./playoffView');

// Feeder match ids for each knockout match (the two earlier matches whose winners meet
// here), or null for a direct group seed. R32 matches are leaves (both null).
const FEEDERS = {};
for (const ko of KO_MATCHES) {
  FEEDERS[ko.id] = [ko.a.t === 'W' ? ko.a.from : null, ko.b.t === 'W' ? ko.b.from : null];
}

// Best- and worst-case TOTAL playoff points (banked + still-possible future) for one user,
// given their predicted bracket and the shared actual bracket + admin-entered KO winners.
//   { max, min }   max ≥ current ≥ ... and min ≥ current (banked points can't be lost)
function playoffBounds(predictedBracket, actualBracket, knockoutWinners) {
  const reached = reachedSets(predictedBracket);
  const actualReached = reachedSets(actualBracket);
  const userPts = (team, round) => (team && reached[round].has(team) ? TIER_POINTS[round] : 0);

  // R32-reach points are fixed by the (admin-curated) group results — count the seeded teams
  // the user predicted to reach R32. Added to both bounds.
  let base = 0;
  for (const team of actualReached.R32) if (reached.R32.has(team)) base += TIER_POINTS.R32;

  // The bracket DP needs the real R32 seeding. Until every R32 tie has both teams (group
  // stage finished), fall back to: max = the user's whole bracket coming true, min = current.
  const aById = new Map(actualBracket.matches.map((m) => [m.id, m]));
  const r32Seeded = KO_MATCHES
    .filter((ko) => ko.round === 'R32')
    .every((ko) => { const m = aById.get(ko.id); return m && m.home.team && m.away.team; });
  if (!r32Seeded) {
    let full = 0;
    for (const round of Object.keys(TIER_POINTS)) full += reached[round].size * TIER_POINTS[round];
    let current = 0;
    for (const round of Object.keys(TIER_POINTS)) {
      for (const t of reached[round]) if (actualReached[round].has(t)) current += TIER_POINTS[round];
    }
    return { max: full, min: current };
  }

  // dp[id]: Map(team -> { max, min }) = best/worst future-round points in the subtree rooted
  // at this match, GIVEN `team` wins it (includes team's advance points for the next round).
  // KO_MATCHES is ordered R32 → Final, so every feeder is computed before its parent.
  const dp = new Map();
  for (const ko of KO_MATCHES) {
    const next = NEXT_ROUND[ko.round];
    const decided = knockoutWinners[ko.id] || null;
    const out = new Map();
    const [f1, f2] = FEEDERS[ko.id];

    if (!f1 && !f2) {
      // R32 leaf: entrants are the two real seeded teams.
      const am = aById.get(ko.id);
      const entrants = [am.home.team, am.away.team].filter(Boolean);
      const cands = decided ? [decided] : entrants;
      for (const c of cands) out.set(c, { max: userPts(c, next), min: userPts(c, next) });
    } else {
      const own = (team) => (dp.get(f1)?.has(team) ? f1 : f2);
      const otherOf = (team) => (own(team) === f1 ? f2 : f1);
      // Best/worst the other side of this match can send up. 0 only when that feeder has no
      // resolved entrants — never as a floor on an otherwise-positive contribution.
      const dpMax = (id) => { const vs = [...(dp.get(id)?.values() || [])]; return vs.length ? Math.max(...vs.map((v) => v.max)) : 0; };
      const dpMin = (id) => { const vs = [...(dp.get(id)?.values() || [])]; return vs.length ? Math.min(...vs.map((v) => v.min)) : 0; };
      const entrants = [...new Set([...(dp.get(f1)?.keys() || []), ...(dp.get(f2)?.keys() || [])])];
      const cands = decided ? [decided] : entrants;
      for (const c of cands) {
        const ownDp = dp.get(own(c)).get(c);
        const oth = otherOf(c);
        out.set(c, {
          max: userPts(c, next) + ownDp.max + dpMax(oth),
          min: userPts(c, next) + ownDp.min + dpMin(oth),
        });
      }
    }
    dp.set(ko.id, out);
  }

  const final = [...(dp.get('ko_104')?.values() || [])];
  const max = base + Math.max(0, ...final.map((v) => v.max));
  const min = base + Math.min(...(final.length ? final.map((v) => v.min) : [0]));
  return { max, min };
}

module.exports = { playoffBounds };
