'use strict';

// Source: 2026 FIFA World Cup group-stage fixtures.
// Final Draw held 5 December 2025 in Washington D.C.
// Venue naming follows FIFA's metro-area convention (e.g. "SoFi Stadium, Los Angeles"
// not the municipal address "…Inglewood"). Kickoff times derived from US-Eastern (ET)
// references, converted to ISO 8601 UTC. MD3 pairs within each group kick off
// simultaneously.

const TEAMS = {
  'Mexico':                  { flag: 'mx' },
  'South Korea':             { flag: 'kr' },
  'South Africa':            { flag: 'za' },
  'Czech Republic':          { flag: 'cz' },
  'Canada':                  { flag: 'ca' },
  'Switzerland':             { flag: 'ch' },
  'Qatar':                   { flag: 'qa' },
  'Bosnia and Herzegovina':  { flag: 'ba' },
  'Brazil':                  { flag: 'br' },
  'Morocco':                 { flag: 'ma' },
  'Scotland':                { flag: 'gb-sct' },
  'Haiti':                   { flag: 'ht' },
  'United States':           { flag: 'us' },
  'Australia':               { flag: 'au' },
  'Paraguay':                { flag: 'py' },
  'Turkey':                  { flag: 'tr' },
  'Germany':                 { flag: 'de' },
  'Ecuador':                 { flag: 'ec' },
  'Ivory Coast':             { flag: 'ci' },
  'Curaçao':                 { flag: 'cw' },
  'Netherlands':             { flag: 'nl' },
  'Japan':                   { flag: 'jp' },
  'Tunisia':                 { flag: 'tn' },
  'Sweden':                  { flag: 'se' },
  'Belgium':                 { flag: 'be' },
  'Iran':                    { flag: 'ir' },
  'Egypt':                   { flag: 'eg' },
  'New Zealand':             { flag: 'nz' },
  'Spain':                   { flag: 'es' },
  'Uruguay':                 { flag: 'uy' },
  'Saudi Arabia':            { flag: 'sa' },
  'Cape Verde':              { flag: 'cv' },
  'France':                  { flag: 'fr' },
  'Senegal':                 { flag: 'sn' },
  'Norway':                  { flag: 'no' },
  'Iraq':                    { flag: 'iq' },
  'Argentina':               { flag: 'ar' },
  'Austria':                 { flag: 'at' },
  'Algeria':                 { flag: 'dz' },
  'Jordan':                  { flag: 'jo' },
  'Portugal':                { flag: 'pt' },
  'Colombia':                { flag: 'co' },
  'Uzbekistan':              { flag: 'uz' },
  'DR Congo':                { flag: 'cd' },
  'England':                 { flag: 'gb-eng' },
  'Croatia':                 { flag: 'hr' },
  'Panama':                  { flag: 'pa' },
  'Ghana':                   { flag: 'gh' },
};

const GROUPS = {
  A: ['Mexico', 'South Korea', 'South Africa', 'Czech Republic'],
  B: ['Canada', 'Switzerland', 'Qatar', 'Bosnia and Herzegovina'],
  C: ['Brazil', 'Morocco', 'Scotland', 'Haiti'],
  D: ['United States', 'Australia', 'Paraguay', 'Turkey'],
  E: ['Germany', 'Ecuador', 'Ivory Coast', 'Curaçao'],
  F: ['Netherlands', 'Japan', 'Tunisia', 'Sweden'],
  G: ['Belgium', 'Iran', 'Egypt', 'New Zealand'],
  H: ['Spain', 'Uruguay', 'Saudi Arabia', 'Cape Verde'],
  I: ['France', 'Senegal', 'Norway', 'Iraq'],
  J: ['Argentina', 'Austria', 'Algeria', 'Jordan'],
  K: ['Portugal', 'Colombia', 'Uzbekistan', 'DR Congo'],
  L: ['England', 'Croatia', 'Panama', 'Ghana'],
};

// [group, matchday, homeTeam, awayTeam, kickoffUtc, venue]
const RAW_MATCHES = [
  // ── Group A ────────────────────────────────────────────────
  ['A', 1, 'Mexico',           'South Africa',           '2026-06-11T19:00:00Z', 'Estadio Azteca, Mexico City'],
  ['A', 1, 'South Korea',      'Czech Republic',         '2026-06-12T02:00:00Z', 'Estadio Akron, Guadalajara'],
  ['A', 2, 'Czech Republic',   'South Africa',           '2026-06-18T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta'],
  ['A', 2, 'Mexico',           'South Korea',            '2026-06-19T01:00:00Z', 'Estadio Akron, Guadalajara'],
  ['A', 3, 'Czech Republic',   'Mexico',                 '2026-06-25T01:00:00Z', 'Estadio Azteca, Mexico City'],
  ['A', 3, 'South Africa',     'South Korea',            '2026-06-25T01:00:00Z', 'Estadio BBVA, Monterrey'],

  // ── Group B ────────────────────────────────────────────────
  ['B', 1, 'Canada',           'Bosnia and Herzegovina', '2026-06-12T19:00:00Z', 'BMO Field, Toronto'],
  ['B', 1, 'Qatar',            'Switzerland',            '2026-06-13T19:00:00Z', "Levi's Stadium, San Francisco Bay Area"],
  ['B', 2, 'Switzerland',      'Bosnia and Herzegovina', '2026-06-18T19:00:00Z', 'SoFi Stadium, Los Angeles'],
  ['B', 2, 'Canada',           'Qatar',                  '2026-06-18T22:00:00Z', 'BC Place, Vancouver'],
  ['B', 3, 'Switzerland',      'Canada',                 '2026-06-24T19:00:00Z', 'BC Place, Vancouver'],
  ['B', 3, 'Bosnia and Herzegovina', 'Qatar',            '2026-06-24T19:00:00Z', 'Lumen Field, Seattle'],

  // ── Group C ────────────────────────────────────────────────
  ['C', 1, 'Brazil',           'Morocco',                '2026-06-13T22:00:00Z', 'MetLife Stadium, New York/New Jersey'],
  ['C', 1, 'Haiti',            'Scotland',               '2026-06-14T01:00:00Z', 'Gillette Stadium, Boston'],
  ['C', 2, 'Scotland',         'Morocco',                '2026-06-19T22:00:00Z', 'Gillette Stadium, Boston'],
  ['C', 2, 'Brazil',           'Haiti',                  '2026-06-20T01:00:00Z', 'Lincoln Financial Field, Philadelphia'],
  ['C', 3, 'Scotland',         'Brazil',                 '2026-06-24T22:00:00Z', 'Hard Rock Stadium, Miami'],
  ['C', 3, 'Morocco',          'Haiti',                  '2026-06-24T22:00:00Z', 'Mercedes-Benz Stadium, Atlanta'],

  // ── Group D ────────────────────────────────────────────────
  ['D', 1, 'United States',    'Paraguay',               '2026-06-13T01:00:00Z', 'SoFi Stadium, Los Angeles'],
  ['D', 1, 'Australia',        'Turkey',                 '2026-06-14T04:00:00Z', 'BC Place, Vancouver'],
  ['D', 2, 'United States',    'Australia',              '2026-06-19T19:00:00Z', 'Lumen Field, Seattle'],
  ['D', 2, 'Turkey',           'Paraguay',               '2026-06-20T03:00:00Z', "Levi's Stadium, San Francisco Bay Area"],
  ['D', 3, 'Turkey',           'United States',          '2026-06-26T02:00:00Z', 'SoFi Stadium, Los Angeles'],
  ['D', 3, 'Paraguay',         'Australia',              '2026-06-26T02:00:00Z', "Levi's Stadium, San Francisco Bay Area"],

  // ── Group E ────────────────────────────────────────────────
  ['E', 1, 'Germany',          'Curaçao',                '2026-06-14T17:00:00Z', 'NRG Stadium, Houston'],
  ['E', 1, 'Ivory Coast',      'Ecuador',                '2026-06-14T23:00:00Z', 'Lincoln Financial Field, Philadelphia'],
  ['E', 2, 'Germany',          'Ivory Coast',            '2026-06-20T20:00:00Z', 'BMO Field, Toronto'],
  ['E', 2, 'Ecuador',          'Curaçao',                '2026-06-21T00:00:00Z', 'Arrowhead Stadium, Kansas City'],
  ['E', 3, 'Curaçao',          'Ivory Coast',            '2026-06-25T20:00:00Z', 'Lincoln Financial Field, Philadelphia'],
  ['E', 3, 'Ecuador',          'Germany',                '2026-06-25T20:00:00Z', 'MetLife Stadium, New York/New Jersey'],

  // ── Group F ────────────────────────────────────────────────
  ['F', 1, 'Netherlands',      'Japan',                  '2026-06-14T20:00:00Z', 'AT&T Stadium, Dallas'],
  ['F', 1, 'Sweden',           'Tunisia',                '2026-06-15T02:00:00Z', 'Estadio BBVA, Monterrey'],
  ['F', 2, 'Netherlands',      'Sweden',                 '2026-06-20T17:00:00Z', 'NRG Stadium, Houston'],
  ['F', 2, 'Tunisia',          'Japan',                  '2026-06-21T04:00:00Z', 'Estadio BBVA, Monterrey'],
  ['F', 3, 'Japan',            'Sweden',                 '2026-06-25T23:00:00Z', 'AT&T Stadium, Dallas'],
  ['F', 3, 'Tunisia',          'Netherlands',            '2026-06-25T23:00:00Z', 'Arrowhead Stadium, Kansas City'],

  // ── Group G ────────────────────────────────────────────────
  ['G', 1, 'Belgium',          'Egypt',                  '2026-06-15T19:00:00Z', 'Lumen Field, Seattle'],
  ['G', 1, 'Iran',             'New Zealand',            '2026-06-16T01:00:00Z', 'SoFi Stadium, Los Angeles'],
  ['G', 2, 'Belgium',          'Iran',                   '2026-06-21T19:00:00Z', 'SoFi Stadium, Los Angeles'],
  ['G', 2, 'New Zealand',      'Egypt',                  '2026-06-22T01:00:00Z', 'BC Place, Vancouver'],
  ['G', 3, 'Egypt',            'Iran',                   '2026-06-27T03:00:00Z', 'Lumen Field, Seattle'],
  ['G', 3, 'New Zealand',      'Belgium',                '2026-06-27T03:00:00Z', 'BC Place, Vancouver'],

  // ── Group H ────────────────────────────────────────────────
  ['H', 1, 'Spain',            'Cape Verde',             '2026-06-15T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta'],
  ['H', 1, 'Saudi Arabia',     'Uruguay',                '2026-06-15T22:00:00Z', 'Hard Rock Stadium, Miami'],
  ['H', 2, 'Spain',            'Saudi Arabia',           '2026-06-21T16:00:00Z', 'Mercedes-Benz Stadium, Atlanta'],
  ['H', 2, 'Uruguay',          'Cape Verde',             '2026-06-21T22:00:00Z', 'Hard Rock Stadium, Miami'],
  ['H', 3, 'Cape Verde',       'Saudi Arabia',           '2026-06-27T00:00:00Z', 'NRG Stadium, Houston'],
  ['H', 3, 'Uruguay',          'Spain',                  '2026-06-27T00:00:00Z', 'Estadio Akron, Guadalajara'],

  // ── Group I ────────────────────────────────────────────────
  ['I', 1, 'France',           'Senegal',                '2026-06-16T19:00:00Z', 'MetLife Stadium, New York/New Jersey'],
  ['I', 1, 'Iraq',             'Norway',                 '2026-06-16T22:00:00Z', 'Gillette Stadium, Boston'],
  ['I', 2, 'France',           'Iraq',                   '2026-06-22T21:00:00Z', 'Lincoln Financial Field, Philadelphia'],
  ['I', 2, 'Norway',           'Senegal',                '2026-06-23T00:00:00Z', 'MetLife Stadium, New York/New Jersey'],
  ['I', 3, 'Norway',           'France',                 '2026-06-26T19:00:00Z', 'Gillette Stadium, Boston'],
  ['I', 3, 'Senegal',          'Iraq',                   '2026-06-26T19:00:00Z', 'BMO Field, Toronto'],

  // ── Group J ────────────────────────────────────────────────
  ['J', 1, 'Argentina',        'Algeria',                '2026-06-17T01:00:00Z', 'Arrowhead Stadium, Kansas City'],
  ['J', 1, 'Austria',          'Jordan',                 '2026-06-17T04:00:00Z', "Levi's Stadium, San Francisco Bay Area"],
  ['J', 2, 'Argentina',        'Austria',                '2026-06-22T17:00:00Z', 'AT&T Stadium, Dallas'],
  ['J', 2, 'Jordan',           'Algeria',                '2026-06-23T03:00:00Z', "Levi's Stadium, San Francisco Bay Area"],
  ['J', 3, 'Algeria',          'Austria',                '2026-06-28T02:00:00Z', 'Arrowhead Stadium, Kansas City'],
  ['J', 3, 'Jordan',           'Argentina',              '2026-06-28T02:00:00Z', 'AT&T Stadium, Dallas'],

  // ── Group K ────────────────────────────────────────────────
  ['K', 1, 'Portugal',         'DR Congo',               '2026-06-17T17:00:00Z', 'NRG Stadium, Houston'],
  ['K', 1, 'Uzbekistan',       'Colombia',               '2026-06-18T02:00:00Z', 'Estadio Azteca, Mexico City'],
  ['K', 2, 'Portugal',         'Uzbekistan',             '2026-06-23T17:00:00Z', 'NRG Stadium, Houston'],
  ['K', 2, 'Colombia',         'DR Congo',               '2026-06-24T02:00:00Z', 'Estadio Akron, Guadalajara'],
  ['K', 3, 'Colombia',         'Portugal',               '2026-06-27T23:30:00Z', 'Hard Rock Stadium, Miami'],
  ['K', 3, 'DR Congo',         'Uzbekistan',             '2026-06-27T23:30:00Z', 'Mercedes-Benz Stadium, Atlanta'],

  // ── Group L ────────────────────────────────────────────────
  ['L', 1, 'England',          'Croatia',                '2026-06-17T20:00:00Z', 'AT&T Stadium, Dallas'],
  ['L', 1, 'Ghana',            'Panama',                 '2026-06-17T23:00:00Z', 'BMO Field, Toronto'],
  ['L', 2, 'England',          'Ghana',                  '2026-06-23T20:00:00Z', 'Gillette Stadium, Boston'],
  ['L', 2, 'Panama',           'Croatia',                '2026-06-23T23:00:00Z', 'BMO Field, Toronto'],
  ['L', 3, 'Panama',           'England',                '2026-06-27T21:00:00Z', 'MetLife Stadium, New York/New Jersey'],
  ['L', 3, 'Croatia',          'Ghana',                  '2026-06-27T21:00:00Z', 'Lincoln Financial Field, Philadelphia'],
];

const MATCHES = RAW_MATCHES.map(([group, matchday, homeTeam, awayTeam, kickoffUtc, venue], i) => {
  const num = i + 1;
  return {
    id: `match_${String(num).padStart(3, '0')}`,
    group,
    matchday,
    matchNumber: num,
    homeTeam,
    homeFlag: TEAMS[homeTeam].flag,
    awayTeam,
    awayFlag: TEAMS[awayTeam].flag,
    kickoffUtc,
    venue,
  };
});

if (MATCHES.length !== 72) {
  throw new Error(`Expected 72 group-stage matches, got ${MATCHES.length}`);
}

module.exports = { MATCHES, GROUPS, TEAMS };
