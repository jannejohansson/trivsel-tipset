'use strict';

// NOTE: Verify all match data against the official FIFA World Cup 2026 schedule at www.fifa.com
// Groups are based on the December 5, 2024 draw. Kickoff times are approximations.
// Update kickoffUtc and venue for each match before going live.

// Groups: 12 groups (A–L), 4 teams each.
// Each group produces 6 matches: MD1 (0v1, 2v3), MD2 (0v2, 1v3), MD3 (0v3, 1v2)
// MD3 games within a group kick off simultaneously.

const GROUPS = {
  A: {
    teams: ['Mexico', 'Jamaica', 'Venezuela', 'Ecuador'],
    flags: ['mx', 'jm', 've', 'ec'],
    venues: ['Estadio Azteca, Ciudad de México', 'Estadio BBVA, Monterrey', 'Estadio Akron, Guadalajara'],
  },
  B: {
    teams: ['USA', 'Panama', 'Uruguay', 'Senegal'],
    flags: ['us', 'pa', 'uy', 'sn'],
    venues: ['SoFi Stadium, Los Angeles', 'Levi\'s Stadium, San Francisco', 'Lumen Field, Seattle'],
  },
  C: {
    teams: ['Canada', 'Honduras', 'Chile', 'Morocco'],
    flags: ['ca', 'hn', 'cl', 'ma'],
    venues: ['BC Place, Vancouver', 'BMO Field, Toronto', 'Gillette Stadium, Boston'],
  },
  D: {
    teams: ['Brazil', 'Ecuador', 'South Korea', 'South Africa'],
    flags: ['br', 'ec', 'kr', 'za'],
    venues: ['MetLife Stadium, New York/New Jersey', 'Hard Rock Stadium, Miami', 'Lincoln Financial Field, Philadelphia'],
  },
  E: {
    teams: ['Argentina', 'Colombia', 'Australia', 'Nigeria'],
    flags: ['ar', 'co', 'au', 'ng'],
    venues: ['AT&T Stadium, Dallas', 'Arrowhead Stadium, Kansas City', 'Allegiant Stadium, Las Vegas'],
  },
  F: {
    teams: ['Spain', 'Croatia', 'Japan', 'Cameroon'],
    flags: ['es', 'hr', 'jp', 'cm'],
    venues: ['SoFi Stadium, Los Angeles', 'Levi\'s Stadium, San Francisco', 'Lumen Field, Seattle'],
  },
  G: {
    teams: ['France', 'Belgium', 'Saudi Arabia', 'Algeria'],
    flags: ['fr', 'be', 'sa', 'dz'],
    venues: ['MetLife Stadium, New York/New Jersey', 'Gillette Stadium, Boston', 'Lincoln Financial Field, Philadelphia'],
  },
  H: {
    teams: ['England', 'Serbia', 'Iran', 'Egypt'],
    flags: ['gb-eng', 'rs', 'ir', 'eg'],
    venues: ['AT&T Stadium, Dallas', 'Hard Rock Stadium, Miami', 'Mercedes-Benz Stadium, Atlanta'],
  },
  I: {
    teams: ['Germany', 'Portugal', 'Paraguay', 'Tunisia'],
    flags: ['de', 'pt', 'py', 'tn'],
    venues: ['MetLife Stadium, New York/New Jersey', 'Arrowhead Stadium, Kansas City', 'Mercedes-Benz Stadium, Atlanta'],
  },
  J: {
    teams: ['Netherlands', 'Poland', 'Ivory Coast', 'New Zealand'],
    flags: ['nl', 'pl', 'ci', 'nz'],
    venues: ['SoFi Stadium, Los Angeles', 'Allegiant Stadium, Las Vegas', 'Levi\'s Stadium, San Francisco'],
  },
  K: {
    teams: ['Switzerland', 'Czech Republic', 'Uzbekistan', 'DR Congo'],
    flags: ['ch', 'cz', 'uz', 'cd'],
    venues: ['AT&T Stadium, Dallas', 'Hard Rock Stadium, Miami', 'Lincoln Financial Field, Philadelphia'],
  },
  L: {
    teams: ['Austria', 'Turkey', 'Costa Rica', 'Ghana'],
    flags: ['at', 'tr', 'cr', 'gh'],
    venues: ['Estadio Azteca, Ciudad de México', 'Estadio BBVA, Monterrey', 'BMO Field, Toronto'],
  },
};

// Approximate matchday base dates per group (UTC midnight, kickoffs later in the day)
// MD3 games within a group are simultaneous — use the same date/time for both.
const GROUP_SCHEDULE = {
  A: { md1: ['2026-06-11T18:00:00Z', '2026-06-11T21:00:00Z'], md2: ['2026-06-17T18:00:00Z', '2026-06-17T21:00:00Z'], md3: '2026-06-26T18:00:00Z' },
  B: { md1: ['2026-06-12T18:00:00Z', '2026-06-12T21:00:00Z'], md2: ['2026-06-18T18:00:00Z', '2026-06-18T21:00:00Z'], md3: '2026-06-26T22:00:00Z' },
  C: { md1: ['2026-06-13T18:00:00Z', '2026-06-13T21:00:00Z'], md2: ['2026-06-19T18:00:00Z', '2026-06-19T21:00:00Z'], md3: '2026-06-27T18:00:00Z' },
  D: { md1: ['2026-06-13T00:00:00Z', '2026-06-13T23:00:00Z'], md2: ['2026-06-19T00:00:00Z', '2026-06-19T23:00:00Z'], md3: '2026-06-27T22:00:00Z' },
  E: { md1: ['2026-06-14T18:00:00Z', '2026-06-14T21:00:00Z'], md2: ['2026-06-20T18:00:00Z', '2026-06-20T21:00:00Z'], md3: '2026-06-28T18:00:00Z' },
  F: { md1: ['2026-06-14T00:00:00Z', '2026-06-14T23:00:00Z'], md2: ['2026-06-20T00:00:00Z', '2026-06-20T23:00:00Z'], md3: '2026-06-28T22:00:00Z' },
  G: { md1: ['2026-06-15T18:00:00Z', '2026-06-15T21:00:00Z'], md2: ['2026-06-21T18:00:00Z', '2026-06-21T21:00:00Z'], md3: '2026-06-29T18:00:00Z' },
  H: { md1: ['2026-06-15T00:00:00Z', '2026-06-15T23:00:00Z'], md2: ['2026-06-21T00:00:00Z', '2026-06-21T23:00:00Z'], md3: '2026-06-29T22:00:00Z' },
  I: { md1: ['2026-06-16T18:00:00Z', '2026-06-16T21:00:00Z'], md2: ['2026-06-22T18:00:00Z', '2026-06-22T21:00:00Z'], md3: '2026-06-30T18:00:00Z' },
  J: { md1: ['2026-06-16T00:00:00Z', '2026-06-16T23:00:00Z'], md2: ['2026-06-22T00:00:00Z', '2026-06-22T23:00:00Z'], md3: '2026-06-30T22:00:00Z' },
  K: { md1: ['2026-06-17T18:00:00Z', '2026-06-17T21:00:00Z'], md2: ['2026-06-23T18:00:00Z', '2026-06-23T21:00:00Z'], md3: '2026-07-01T18:00:00Z' },
  L: { md1: ['2026-06-17T00:00:00Z', '2026-06-17T23:00:00Z'], md2: ['2026-06-23T00:00:00Z', '2026-06-23T23:00:00Z'], md3: '2026-07-01T22:00:00Z' },
};

function generateMatches() {
  const matches = [];
  let matchNumber = 1;

  for (const [group, { teams, flags, venues }] of Object.entries(GROUPS)) {
    const sched = GROUP_SCHEDULE[group];

    // Matchday 1: team[0] vs team[1], team[2] vs team[3]
    matches.push(makeMatch(matchNumber++, group, 1, teams[0], flags[0], teams[1], flags[1], sched.md1[0], venues[0]));
    matches.push(makeMatch(matchNumber++, group, 1, teams[2], flags[2], teams[3], flags[3], sched.md1[1], venues[1]));

    // Matchday 2: team[0] vs team[2], team[1] vs team[3]
    matches.push(makeMatch(matchNumber++, group, 2, teams[0], flags[0], teams[2], flags[2], sched.md2[0], venues[1]));
    matches.push(makeMatch(matchNumber++, group, 2, teams[1], flags[1], teams[3], flags[3], sched.md2[1], venues[2]));

    // Matchday 3 (simultaneous): team[0] vs team[3], team[1] vs team[2]
    matches.push(makeMatch(matchNumber++, group, 3, teams[0], flags[0], teams[3], flags[3], sched.md3, venues[0]));
    matches.push(makeMatch(matchNumber++, group, 3, teams[1], flags[1], teams[2], flags[2], sched.md3, venues[2]));
  }

  return matches;
}

function makeMatch(num, group, matchday, homeTeam, homeFlag, awayTeam, awayFlag, kickoffUtc, venue) {
  return {
    id: `match_${String(num).padStart(3, '0')}`,
    group,
    matchday,
    matchNumber: num,
    homeTeam,
    homeFlag,
    awayTeam,
    awayFlag,
    kickoffUtc,
    venue,
  };
}

const MATCHES = generateMatches();

module.exports = { MATCHES, GROUPS };
