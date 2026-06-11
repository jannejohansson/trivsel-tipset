'use strict';

// Tournament kicks off with the first match (21:00 Swedish time, CEST = UTC+2).
// Predictions lock at this moment. Keep this in sync with the frontend copy in
// frontend/src/lib/constants.js.
const KICKOFF_UTC = '2026-06-11T19:00:00Z';
const LOCKOUT_TIMESTAMP = new Date(KICKOFF_UTC).getTime();

// Display-name changes stay open a few days into the tournament so people can
// still fix their name after the first matches have started.
const NAME_LOCKOUT_UTC = '2026-06-14T19:00:00Z';
const NAME_LOCKOUT_TIMESTAMP = new Date(NAME_LOCKOUT_UTC).getTime();

module.exports = { KICKOFF_UTC, LOCKOUT_TIMESTAMP, NAME_LOCKOUT_UTC, NAME_LOCKOUT_TIMESTAMP };
