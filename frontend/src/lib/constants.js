// Tournament kicks off with the first match (21:00 Swedish time, CEST = UTC+2);
// predictions lock at this moment. Keep in sync with the backend copy in
// api/src/shared/constants.js.
export const KICKOFF_TS = new Date('2026-06-11T19:00:00Z').getTime();

// Display-name changes stay open a few days into the tournament so people can
// still fix their name after the first matches have started.
export const NAME_LOCKOUT_TS = new Date('2026-06-14T19:00:00Z').getTime();

// Total predictable matches: 72 group-stage games, 31 knockout matches predicted
// (R32→final; the bronze match isn't tipped).
export const TOTAL_MATCHES = 72;
export const TOTAL_PLAYOFF = 31;
