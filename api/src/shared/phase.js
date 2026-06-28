'use strict';

const { PLAYOFF_LOCKOUT } = require('./bracket');

// Two distinct playoff signals — keep them separate:
//
// isPlayoffDisplay — the knockout-format PRESENTATION (dashboard, leaderboard, "vad
//   tippar andra" all switch to bracket/advancement views). On when the admin flips the
//   `playoffScoring` master switch OR the hard lockout time (match 73 kickoff) has passed.
//   The admin can turn this on early to start awarding playoff points and show the
//   playoff UI without making anyone's picks final or visible to others.
//
// isPlayoffLocked — picks become FINAL and VISIBLE to others. Driven solely by the
//   lockout time, never by the scoring switch. This gates editing (getPlayoff /
//   savePlayoffPrediction) and the reveal of other users' knockout picks (brackets,
//   predicted champions, per-user advancement). Group-derived info (e.g. who reached the
//   Round of 32) is already public per-match at kickoff, so it isn't gated here.
function isPlayoffDisplay(results, now = Date.now()) {
  return !!(results && results.playoffScoring) || now >= PLAYOFF_LOCKOUT;
}

function isPlayoffLocked(now = Date.now()) {
  return now >= PLAYOFF_LOCKOUT;
}

module.exports = { isPlayoffDisplay, isPlayoffLocked };
