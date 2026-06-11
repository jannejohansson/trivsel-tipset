'use strict';

const { MATCHES } = require('./matchData');

// Resolve the global "spotlight" fixtures relative to now (all chronological):
//   recent     – up to the last three completed matches (a result exists)
//   inProgress – matches kicked off but not yet resulted
//   next       – the next matches not yet kicked off; all that share the earliest
//                kickoff time (group-stage MD3 pairs start simultaneously)
// A match's predictions are public iff it has kicked off or has a result; `next`
// matches must never leak any prediction, so callers must treat them as metadata-only.
function resolveSpotlight(groupResults) {
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
  return { recent: completed.slice(-3), inProgress, next };
}

module.exports = { resolveSpotlight };
