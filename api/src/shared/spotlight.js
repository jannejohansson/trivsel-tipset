'use strict';

const { MATCHES } = require('./matchData');

// Defaults for the "recent" spotlight: how many completed matches to surface and, optionally,
// how recently they must have kicked off. The leaderboard uses the defaults (last 3, no time
// window); the prediction-breakdown page widens this (see its call site).
const DEFAULT_RECENT_MAX = 3;

// Resolve the global "spotlight" fixtures relative to now (all chronological):
//   recent     – completed matches (a result exists), most recent last, capped at `recentMax`;
//                when `recentWindowMs` is set, also limited to matches kicked off within it
//   inProgress – matches kicked off but not yet resulted
//   next       – the next matches not yet kicked off; all that share the earliest
//                kickoff time (group-stage MD3 pairs start simultaneously)
// A match's predictions are public iff it has kicked off or has a result; `next`
// matches must never leak any prediction, so callers must treat them as metadata-only.
function resolveSpotlight(groupResults, { recentMax = DEFAULT_RECENT_MAX, recentWindowMs = null } = {}) {
  const now = Date.now();
  const byKickoff = (a, b) =>
    new Date(a.kickoffUtc) - new Date(b.kickoffUtc) || a.matchNumber - b.matchNumber;

  const completed = [];
  const inProgress = [];
  const notStarted = [];
  for (const m of MATCHES) {
    const result = groupResults[m.id];
    const kickedOff = m.kickoffUtc ? now >= new Date(m.kickoffUtc).getTime() : false;
    if (result) completed.push(m);
    else if (kickedOff) inProgress.push(m);
    else notStarted.push(m);
  }
  completed.sort(byKickoff);
  inProgress.sort(byKickoff);
  notStarted.sort(byKickoff);

  const next = notStarted.length
    ? notStarted.filter((m) => m.kickoffUtc === notStarted[0].kickoffUtc)
    : [];
  const recentCutoff = recentWindowMs == null ? null : now - recentWindowMs;
  const recent = completed
    .filter((m) => recentCutoff == null || (m.kickoffUtc && new Date(m.kickoffUtc).getTime() >= recentCutoff))
    .slice(-recentMax);
  return { recent, inProgress, next };
}

module.exports = { resolveSpotlight };
