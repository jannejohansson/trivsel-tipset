// Tournament kicks off with the first match; predictions and display-name changes
// lock at this moment. Keep in sync with the backend copy in api/src/shared/constants.js.
export const KICKOFF_TS = new Date('2026-06-11T18:00:00Z').getTime();

// Total predictable matches: 72 group-stage games, 31 knockout matches predicted
// (R32→final; the bronze match isn't tipped).
export const TOTAL_MATCHES = 72;
export const TOTAL_PLAYOFF = 31;
