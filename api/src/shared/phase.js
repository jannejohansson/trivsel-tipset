'use strict';

const { PLAYOFF_LOCKOUT } = require('./bracket');

// Whether the app is in "playoff mode" — the knockout-format display/lock state.
// Reuses the admin's `playoffScoring` master switch (so the admin can flip the whole
// playoff experience on locally for testing) OR the hard lockout time (match 73 kickoff),
// at which point predictions are final regardless. Pass a `results` object from loadResults().
function isPlayoffMode(results, now = Date.now()) {
  return !!(results && results.playoffScoring) || now >= PLAYOFF_LOCKOUT;
}

module.exports = { isPlayoffMode };
