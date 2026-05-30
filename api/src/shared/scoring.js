'use strict';

// Shared scoring logic for FIFA WC 2026 (CommonJS sibling of frontend/src/lib/scoring.js).

// --- Group stage -----------------------------------------------------------
// Per match, comparing a prediction to the actual score (max 5 points):
//   +2 correct outcome (1/X/2), +1 correct home goals, +1 correct away goals,
//   +1 bonus when the exact score is right (which also implies the three above).
function scoreGroup(prediction, actual) {
  if (!prediction || !actual) return 0;
  const ph = Number(prediction.homeScore), pa = Number(prediction.awayScore);
  const ah = Number(actual.homeScore), aa = Number(actual.awayScore);
  if (![ph, pa, ah, aa].every(Number.isFinite)) return 0;

  const sign = (h, a) => (h > a ? 1 : h < a ? -1 : 0);
  let pts = 0;
  if (sign(ph, pa) === sign(ah, aa)) pts += 2; // outcome
  if (ph === ah) pts += 1;                      // home goals
  if (pa === aa) pts += 1;                      // away goals
  if (ph === ah && pa === aa) pts += 1;         // exact-score bonus
  return pts;
}

// Sum group points across all matches for one user's predictions vs actual results.
//   predictions / actuals: Map|object of matchId -> { homeScore, awayScore }
function scoreGroupTotal(predictions, actuals) {
  const get = (c, id) => (c instanceof Map ? c.get(id) : c ? c[id] : undefined);
  const ids = actuals instanceof Map ? [...actuals.keys()] : Object.keys(actuals || {});
  let total = 0;
  for (const id of ids) total += scoreGroup(get(predictions, id), get(actuals, id));
  return total;
}

// --- Playoff ---------------------------------------------------------------
// Points per team correctly predicted to REACH each round.
const TIER_POINTS = { R32: 1, R16: 3, QF: 7, SF: 11, F: 15, CHAMP: 25 };

// Teams present in each round of a built bracket (i.e. teams that reached it),
// plus the predicted champion.
function reachedSets(bracket) {
  const sets = { R32: new Set(), R16: new Set(), QF: new Set(), SF: new Set(), F: new Set(), CHAMP: new Set() };
  for (const m of bracket.matches) {
    if (m.home.team) sets[m.round].add(m.home.team);
    if (m.away.team) sets[m.round].add(m.away.team);
  }
  if (bracket.champion) sets.CHAMP.add(bracket.champion);
  return sets;
}

// Compare a user's predicted bracket to the actual bracket (both produced by
// buildBracket). Returns { total, breakdown: { round: { hits, points } } }.
function scorePlayoff(predictedBracket, actualBracket) {
  const ps = reachedSets(predictedBracket);
  const as = reachedSets(actualBracket);
  const breakdown = {};
  let total = 0;
  for (const round of Object.keys(TIER_POINTS)) {
    let hits = 0;
    for (const team of ps[round]) if (as[round].has(team)) hits++;
    const points = hits * TIER_POINTS[round];
    breakdown[round] = { hits, points };
    total += points;
  }
  return { total, breakdown };
}

module.exports = { scoreGroup, scoreGroupTotal, TIER_POINTS, reachedSets, scorePlayoff };
