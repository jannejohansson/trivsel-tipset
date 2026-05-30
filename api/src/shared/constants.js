'use strict';

// Tournament kicks off with the first match. Everything (predictions, display-name
// changes) locks at this moment. Keep this in sync with the frontend copy in
// frontend/src/lib/constants.js.
const KICKOFF_UTC = '2026-06-11T18:00:00Z';
const LOCKOUT_TIMESTAMP = new Date(KICKOFF_UTC).getTime();

module.exports = { KICKOFF_UTC, LOCKOUT_TIMESTAMP };
