'use strict';

// Shared knockout-bracket logic for FIFA WC 2026.
// CommonJS (backend) sibling of frontend/src/lib/bracket.js — keep the two in sync.
//
// The Round of 32 is seeded from group standings: the 12 group winners (1X) and
// runners-up (2X) qualify directly; the 8 best third-placed teams are slotted via
// FIFA's published Annex C combination matrix (thirdPlaceMatrix.json). Later rounds
// are filled by the user's winner picks.

const THIRD_PLACE_MATRIX = require('./thirdPlaceMatrix.json');

const GROUP_LETTERS = 'ABCDEFGHIJKL'.split('');

// First knockout kickoff — 28 June 2026 21:00 Swedish local time (CEST, UTC+2).
// At this moment the predicted bracket becomes final, so playoff picks lock here.
const PLAYOFF_LOCKOUT = new Date('2026-06-28T19:00:00Z').getTime();

// Slot descriptors:
//   { t:'1'|'2', g:'A' }      group winner / runner-up
//   { t:'3', w:'1E' }         a best-third, looked up in the matrix by winner column
//   { t:'W', from:'ko_74' }   winner of an earlier knockout match
const KO_MATCHES = [
  // Round of 32
  { id: 'ko_73', num: 73, round: 'R32', a: { t: '2', g: 'A' }, b: { t: '2', g: 'B' } },
  { id: 'ko_74', num: 74, round: 'R32', a: { t: '1', g: 'E' }, b: { t: '3', w: '1E' } },
  { id: 'ko_75', num: 75, round: 'R32', a: { t: '1', g: 'F' }, b: { t: '2', g: 'C' } },
  { id: 'ko_76', num: 76, round: 'R32', a: { t: '1', g: 'C' }, b: { t: '2', g: 'F' } },
  { id: 'ko_77', num: 77, round: 'R32', a: { t: '1', g: 'I' }, b: { t: '3', w: '1I' } },
  { id: 'ko_78', num: 78, round: 'R32', a: { t: '2', g: 'E' }, b: { t: '2', g: 'I' } },
  { id: 'ko_79', num: 79, round: 'R32', a: { t: '1', g: 'A' }, b: { t: '3', w: '1A' } },
  { id: 'ko_80', num: 80, round: 'R32', a: { t: '1', g: 'L' }, b: { t: '3', w: '1L' } },
  { id: 'ko_81', num: 81, round: 'R32', a: { t: '1', g: 'D' }, b: { t: '3', w: '1D' } },
  { id: 'ko_82', num: 82, round: 'R32', a: { t: '1', g: 'G' }, b: { t: '3', w: '1G' } },
  { id: 'ko_83', num: 83, round: 'R32', a: { t: '2', g: 'K' }, b: { t: '2', g: 'L' } },
  { id: 'ko_84', num: 84, round: 'R32', a: { t: '1', g: 'H' }, b: { t: '2', g: 'J' } },
  { id: 'ko_85', num: 85, round: 'R32', a: { t: '1', g: 'B' }, b: { t: '3', w: '1B' } },
  { id: 'ko_86', num: 86, round: 'R32', a: { t: '1', g: 'J' }, b: { t: '2', g: 'H' } },
  { id: 'ko_87', num: 87, round: 'R32', a: { t: '1', g: 'K' }, b: { t: '3', w: '1K' } },
  { id: 'ko_88', num: 88, round: 'R32', a: { t: '2', g: 'D' }, b: { t: '2', g: 'G' } },
  // Round of 16
  { id: 'ko_89', num: 89, round: 'R16', a: { t: 'W', from: 'ko_74' }, b: { t: 'W', from: 'ko_77' } },
  { id: 'ko_90', num: 90, round: 'R16', a: { t: 'W', from: 'ko_73' }, b: { t: 'W', from: 'ko_75' } },
  { id: 'ko_91', num: 91, round: 'R16', a: { t: 'W', from: 'ko_76' }, b: { t: 'W', from: 'ko_78' } },
  { id: 'ko_92', num: 92, round: 'R16', a: { t: 'W', from: 'ko_79' }, b: { t: 'W', from: 'ko_80' } },
  { id: 'ko_93', num: 93, round: 'R16', a: { t: 'W', from: 'ko_83' }, b: { t: 'W', from: 'ko_84' } },
  { id: 'ko_94', num: 94, round: 'R16', a: { t: 'W', from: 'ko_81' }, b: { t: 'W', from: 'ko_82' } },
  { id: 'ko_95', num: 95, round: 'R16', a: { t: 'W', from: 'ko_86' }, b: { t: 'W', from: 'ko_88' } },
  { id: 'ko_96', num: 96, round: 'R16', a: { t: 'W', from: 'ko_85' }, b: { t: 'W', from: 'ko_87' } },
  // Quarter-finals
  { id: 'ko_97', num: 97, round: 'QF', a: { t: 'W', from: 'ko_89' }, b: { t: 'W', from: 'ko_90' } },
  { id: 'ko_98', num: 98, round: 'QF', a: { t: 'W', from: 'ko_93' }, b: { t: 'W', from: 'ko_94' } },
  { id: 'ko_99', num: 99, round: 'QF', a: { t: 'W', from: 'ko_91' }, b: { t: 'W', from: 'ko_92' } },
  { id: 'ko_100', num: 100, round: 'QF', a: { t: 'W', from: 'ko_95' }, b: { t: 'W', from: 'ko_96' } },
  // Semi-finals
  { id: 'ko_101', num: 101, round: 'SF', a: { t: 'W', from: 'ko_97' }, b: { t: 'W', from: 'ko_98' } },
  { id: 'ko_102', num: 102, round: 'SF', a: { t: 'W', from: 'ko_99' }, b: { t: 'W', from: 'ko_100' } },
  // Final (match 103, the bronze game, is intentionally omitted)
  { id: 'ko_104', num: 104, round: 'F', a: { t: 'W', from: 'ko_101' }, b: { t: 'W', from: 'ko_102' } },
];

const KO_IDS = new Set(KO_MATCHES.map((m) => m.id));
const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'F'];

// Normalise a predictions container (Map or plain object) to a getter.
function predGetter(predictions) {
  if (predictions instanceof Map) return (id) => predictions.get(id);
  return (id) => (predictions ? predictions[id] : undefined);
}

// Standard football standings (3/1/0) for one group's matches, ordered by FIFA
// criteria: points -> goal difference -> goals for, then head-to-head among any
// teams still level, then team name. Mirror of computeGroupStandings in
// frontend/src/lib/bracket.js — keep the two in sync.
function computeGroupStandings(matches, predictions) {
  const get = predGetter(predictions);
  const teams = new Map();
  const seed = (name, flag) => {
    if (!teams.has(name)) teams.set(name, { team: name, flag, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 });
  };
  for (const m of matches) { seed(m.homeTeam, m.homeFlag); seed(m.awayTeam, m.awayFlag); }

  const played = [];
  for (const m of matches) {
    const pred = get(m.id);
    if (!pred) continue;
    const hs = Number(pred.homeScore);
    const as = Number(pred.awayScore);
    if (!Number.isFinite(hs) || !Number.isFinite(as)) continue;
    played.push({ home: m.homeTeam, away: m.awayTeam, hs, as });
    const home = teams.get(m.homeTeam);
    const away = teams.get(m.awayTeam);
    home.P++; away.P++;
    home.GF += hs; home.GA += as; away.GF += as; away.GA += hs;
    if (hs > as) { home.W++; home.Pts += 3; away.L++; }
    else if (hs < as) { away.W++; away.Pts += 3; home.L++; }
    else { home.D++; away.D++; home.Pts += 1; away.Pts += 1; }
  }
  for (const t of teams.values()) t.GD = t.GF - t.GA;

  // FIFA tie-break for teams level on overall points/GD/goals: a mini-table of
  // only the matches played among those teams, ranked by head-to-head points ->
  // goal difference -> goals scored (criteria d-f). Falls back to team name as a
  // deterministic last resort (we don't model fair-play points or drawing of lots).
  const headToHead = (names) => {
    const set = new Set(names);
    const mini = new Map(names.map((n) => [n, { Pts: 0, GD: 0, GF: 0 }]));
    for (const g of played) {
      if (!set.has(g.home) || !set.has(g.away)) continue;
      const h = mini.get(g.home);
      const a = mini.get(g.away);
      h.GF += g.hs; h.GD += g.hs - g.as;
      a.GF += g.as; a.GD += g.as - g.hs;
      if (g.hs > g.as) h.Pts += 3;
      else if (g.hs < g.as) a.Pts += 3;
      else { h.Pts += 1; a.Pts += 1; }
    }
    return mini;
  };

  const sorted = [...teams.values()].sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    if (b.GD !== a.GD) return b.GD - a.GD;
    if (b.GF !== a.GF) return b.GF - a.GF;
    return 0;
  });

  // Re-rank each block of teams tied on overall points/GD/goals via head-to-head.
  const ranked = [];
  for (let i = 0; i < sorted.length;) {
    let j = i + 1;
    while (j < sorted.length
      && sorted[j].Pts === sorted[i].Pts
      && sorted[j].GD === sorted[i].GD
      && sorted[j].GF === sorted[i].GF) j++;
    const tied = sorted.slice(i, j);
    if (tied.length > 1) {
      const mini = headToHead(tied.map((t) => t.team));
      tied.sort((a, b) => {
        const ma = mini.get(a.team);
        const mb = mini.get(b.team);
        if (mb.Pts !== ma.Pts) return mb.Pts - ma.Pts;
        if (mb.GD !== ma.GD) return mb.GD - ma.GD;
        if (mb.GF !== ma.GF) return mb.GF - ma.GF;
        return a.team.localeCompare(b.team);
      });
    }
    ranked.push(...tied);
    i = j;
  }
  return ranked;
}

// Standings for every group keyed by letter. `complete` = all that group's
// matches predicted (so its 1st/2nd/3rd are final).
function computeAllStandings(matches, predictions) {
  const byGroup = {};
  for (const g of GROUP_LETTERS) byGroup[g] = [];
  for (const m of matches) { if (byGroup[m.group]) byGroup[m.group].push(m); }
  const out = {};
  const get = predGetter(predictions);
  for (const g of GROUP_LETTERS) {
    const gm = byGroup[g];
    const predicted = gm.filter((m) => get(m.id)).length;
    out[g] = { rows: computeGroupStandings(gm, predictions), complete: gm.length > 0 && predicted === gm.length };
  }
  return out;
}

// Rank the 12 third-placed teams (best first). `thirdOrder`, when supplied as an
// ordered array of group letters, overrides the computed ranking (used by the
// admin-curated actual bracket); otherwise rank by points -> GD -> GF -> name.
function rankThirdPlace(allStandings, thirdOrder) {
  const thirds = GROUP_LETTERS
    .filter((g) => allStandings[g] && allStandings[g].rows[2])
    .map((g) => ({ group: g, ...allStandings[g].rows[2] }));
  if (Array.isArray(thirdOrder) && thirdOrder.length) {
    const rank = new Map(thirdOrder.map((g, i) => [g, i]));
    thirds.sort((a, b) => (rank.has(a.group) ? rank.get(a.group) : 99) - (rank.has(b.group) ? rank.get(b.group) : 99));
  } else {
    thirds.sort((a, b) => {
      if (b.Pts !== a.Pts) return b.Pts - a.Pts;
      if (b.GD !== a.GD) return b.GD - a.GD;
      if (b.GF !== a.GF) return b.GF - a.GF;
      return a.team.localeCompare(b.team);
    });
  }
  return thirds;
}

const slotLabel = (slot) => {
  if (slot.t === '1') return `1${slot.g}`;
  if (slot.t === '2') return `2${slot.g}`;
  if (slot.t === '3') return '3rd';
  return `V${slot.from.replace('ko_', '')}`; // "Vinnare match N"
};

// Build the full bracket from group predictions + the user's knockout winner picks.
//   matches      group-stage fixtures (with team names/flags)
//   predictions  Map|object of group matchId -> { homeScore, awayScore }
//   picks        Map|object of ko matchId -> winning team name
//   opts.thirdOrder  optional ranked group letters for the third-place table
// Returns { matches: [{ id,num,round, home, away, pick, complete }], champion }.
function buildBracket(matches, predictions, picks, opts = {}) {
  const getPick = predGetter(picks);
  const all = computeAllStandings(matches, predictions);

  // Predicted brackets pass { allowPartial: true } so a user who left a few group
  // matches unpredicted still gets a fully-resolved grid to pick from — standings are
  // taken as-is from whatever was predicted (unpredicted games simply don't count).
  // Actual-result brackets omit it, keeping the strict gating: a group's qualifiers
  // aren't resolved until every match in the group has a result.
  const resolvable = (g) => all[g] && (opts.allowPartial || all[g].complete);

  // Guard each row: a group's standings are empty until its matches are loaded
  // (e.g. the first render before data arrives), so rows[0..2] may be undefined.
  const winner = (g) => (resolvable(g) && all[g].rows[0] ? all[g].rows[0].team : null);
  const runner = (g) => (resolvable(g) && all[g].rows[1] ? all[g].rows[1].team : null);
  const third = (g) => (resolvable(g) && all[g].rows[2] ? all[g].rows[2].team : null);

  // Resolve the eight best-third slots once every group is resolvable.
  let thirdSlotTeam = {}; // winnerKey ('1E'...) -> team name
  const allResolvable = GROUP_LETTERS.every((g) => resolvable(g));
  if (allResolvable) {
    const best8 = rankThirdPlace(all, opts.thirdOrder).slice(0, 8).map((t) => t.group);
    const key = best8.slice().sort().join('');
    const mapping = THIRD_PLACE_MATRIX[key];
    if (mapping) {
      for (const wkey of Object.keys(mapping)) thirdSlotTeam[wkey] = third(mapping[wkey]);
    }
  }

  const flagOf = new Map();
  for (const m of matches) { flagOf.set(m.homeTeam, m.homeFlag); flagOf.set(m.awayTeam, m.awayFlag); }
  const teamObj = (name, label) => ({ team: name || null, flag: name ? flagOf.get(name) || null : null, label });

  const resolved = {}; // ko id -> { home, away, pick }
  const out = [];
  const resolveSlot = (slot) => {
    if (slot.t === '1') return teamObj(winner(slot.g), slotLabel(slot));
    if (slot.t === '2') return teamObj(runner(slot.g), slotLabel(slot));
    if (slot.t === '3') return teamObj(thirdSlotTeam[slot.w] || null, slotLabel(slot));
    // winner-of: take the user's pick for the referenced match, if it is valid there
    const src = resolved[slot.from];
    const adv = src ? src.pick : null;
    return teamObj(adv, slotLabel(slot));
  };

  for (const ko of KO_MATCHES) {
    const home = resolveSlot(ko.a);
    const away = resolveSlot(ko.b);
    let pick = getPick(ko.id) || null;
    // A pick is only valid if it is one of the two resolved teams.
    if (pick && pick !== home.team && pick !== away.team) pick = null;
    resolved[ko.id] = { home, away, pick };
    out.push({ id: ko.id, num: ko.num, round: ko.round, home, away, pick, complete: !!(home.team && away.team) });
  }

  const champion = resolved['ko_104'] ? resolved['ko_104'].pick : null;
  return { matches: out, champion };
}

module.exports = {
  KO_MATCHES,
  KO_IDS,
  ROUND_ORDER,
  PLAYOFF_LOCKOUT,
  GROUP_LETTERS,
  computeGroupStandings,
  computeAllStandings,
  rankThirdPlace,
  buildBracket,
};
