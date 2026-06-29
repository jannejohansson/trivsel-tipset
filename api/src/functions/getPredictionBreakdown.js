'use strict';

const { app } = require('@azure/functions');
const { getUsersTable, getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { loadResults } = require('../shared/results');
const { resolveSpotlight } = require('../shared/spotlight');
const { scoreGroup, reachedSets, TIER_POINTS } = require('../shared/scoring');
const { MATCHES } = require('../shared/matchData');
const { buildBracket } = require('../shared/bracket');
const { isPlayoffDisplay, isPlayoffLocked } = require('../shared/phase');
const { actualFixtures } = require('../shared/playoffView');
const { collectUsers, collectByUser } = require('../shared/leaderboardData');

// Sort display names in Swedish locale order (used for predictor name lists).
const svSort = (a, b) => a.localeCompare(b, 'sv');

// Tiers in advance order. A team's "points at risk" in a given fixture is the sum of
// these from the fixture's advance round up to the furthest round a user predicted the
// team to reach — i.e. everything that backer still has to win, and would forfeit if the
// team lost here. (Tiers already banked, up to the current round, are not at risk.)
const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'F', 'CHAMP'];

// A built bracket's champion as { team, flag } from the final's slots, or null.
function championOf(bracket) {
  if (!bracket.champion) return null;
  const final = bracket.matches.find((m) => m.id === 'ko_104');
  if (!final) return { team: bracket.champion, flag: null };
  const flag = final.home.team === bracket.champion ? final.home.flag
    : final.away.team === bracket.champion ? final.away.flag : null;
  return { team: bracket.champion, flag };
}

// Aggregate the whole field's playoff brackets into:
//   fixtures – per real knockout fixture (both teams known), how many predicted each side
//              to advance (independent reached-set membership), with names + percentages
//   champions – distribution of predicted world champions
//   r32ByUser – per-user Round-of-32 accuracy (derived from group predictions)
// `revealed` (lockout time passed) controls whether the still-editable knockout picks
// may be shown: until then, only r32ByUser is returned (it derives from group predictions,
// which are already public per-match at kickoff), while fixtures + champions stay hidden.
async function playoffBreakdown(results, revealed) {
  const [users, predsByUser, picksByUser] = await Promise.all([
    collectUsers(),
    collectByUser(getPredictionsTable(), (e) => ({ homeScore: e.homeScore, awayScore: e.awayScore })),
    collectByUser(getPlayoffTable(), (e) => e.winner),
  ]);

  const actualBracket = buildBracket(MATCHES, results.groupResults, results.knockoutWinners, {
    thirdOrder: results.thirdOrder, allowPartial: true,
  });
  const base = actualFixtures(actualBracket, results.knockoutWinners);

  // Build each participant's bracket once → reached sets + champion.
  const perUser = users.map((u) => {
    const b = buildBracket(MATCHES, predsByUser.get(u.userId) || {}, picksByUser.get(u.userId) || {}, { allowPartial: true });
    const champ = championOf(b);
    return { name: u.displayName, reached: reachedSets(b), champion: champ ? champ.team : null, championFlag: champ ? champ.flag : null };
  });
  const total = perUser.length;
  const pct = (n) => (total ? Math.round((100 * n) / total) : 0);

  // Per-user Round-of-32 accuracy: points (1 per team correctly predicted to qualify)
  // and the teams they got wrong (predicted to qualify but didn't). Derived purely from
  // group predictions — already public per-match at kickoff — so it's safe to show before
  // the lock. Only meaningful once the actual qualifiers are known, so empty until then.
  const flagByTeam = new Map();
  for (const m of MATCHES) { flagByTeam.set(m.homeTeam, m.homeFlag); flagByTeam.set(m.awayTeam, m.awayFlag); }
  const actualR32 = new Set(actualBracket.matches.filter((m) => m.round === 'R32').flatMap((m) => [m.home.team, m.away.team]).filter(Boolean));
  let r32ByUser = [];
  if (actualR32.size > 0) {
    r32ByUser = perUser
      .map((p) => {
        const predicted = [...p.reached.R32];
        if (predicted.length === 0) return null; // hasn't predicted the groups
        const misses = predicted
          .filter((team) => !actualR32.has(team))
          .map((team) => ({ team, flag: flagByTeam.get(team) || null }))
          .sort((a, b) => a.team.localeCompare(b.team, 'sv'));
        return { name: p.name, points: predicted.length - misses.length, total: actualR32.size, misses };
      })
      .filter(Boolean)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'sv'));
  }

  // Before the lockout the bracket and champion picks are still editable and private —
  // expose only the group-derived R32 accuracy, never who-picked-what for the knockouts.
  if (!revealed) {
    return { playoff: true, playoffMode: true, picksHidden: true, totalUsers: total, champPoints: TIER_POINTS.CHAMP, fixtures: [], champions: [], r32ByUser };
  }

  // For one team in a fixture: the backers who tipped it to advance from here, plus those
  // backers grouped by how many points they'd forfeit if it lost (stake = tiers from the
  // advance round up to each backer's furthest predicted round). Highest stake first.
  const sideStakes = (team, advanceRound) => {
    const advIdx = ROUND_ORDER.indexOf(advanceRound);
    const byStake = new Map(); // stake -> [name]
    const users = [];
    for (const p of perUser) {
      let furthest = -1;
      for (let i = advIdx; i < ROUND_ORDER.length; i++) {
        if (p.reached[ROUND_ORDER[i]].has(team)) furthest = i;
      }
      if (furthest < advIdx) continue; // didn't tip this team to advance from here
      let stake = 0;
      for (let i = advIdx; i <= furthest; i++) stake += TIER_POINTS[ROUND_ORDER[i]];
      users.push(p.name);
      if (!byStake.has(stake)) byStake.set(stake, []);
      byStake.get(stake).push(p.name);
    }
    users.sort(svSort);
    const stakeGroups = [...byStake.entries()]
      .map(([stake, names]) => ({ stake, users: names.sort(svSort) }))
      .sort((a, b) => b.stake - a.stake);
    return { users, stakeGroups };
  };

  const fixtures = base.map((f) => {
    const home = sideStakes(f.home.team, f.advanceRound);
    const away = sideStakes(f.away.team, f.advanceRound);
    return {
      id: f.id, round: f.round, kickoffUtc: f.kickoffUtc, venue: f.venue,
      status: f.status, actualWinner: f.actualWinner, advancePoints: f.advancePoints, total,
      home: { ...f.home, count: home.users.length, pct: pct(home.users.length), users: home.users, stakeGroups: home.stakeGroups },
      away: { ...f.away, count: away.users.length, pct: pct(away.users.length), users: away.users, stakeGroups: away.stakeGroups },
    };
  });

  const champMap = new Map();
  for (const p of perUser) {
    if (!p.champion) continue;
    if (!champMap.has(p.champion)) champMap.set(p.champion, { team: p.champion, flag: p.championFlag, users: [] });
    champMap.get(p.champion).users.push(p.name);
  }
  const champions = [...champMap.values()]
    .map((c) => ({ team: c.team, flag: c.flag, count: c.users.length, pct: pct(c.users.length), users: c.users.sort(svSort) }))
    .sort((a, b) => b.count - a.count || a.team.localeCompare(b.team, 'sv'));

  return { playoff: true, playoffMode: true, totalUsers: total, champPoints: TIER_POINTS.CHAMP, fixtures, champions, r32ByUser };
}

// Outcome bucket: 0 = home win, 1 = draw, 2 = away win.
function outcomeRank(s) {
  const d = s.homeScore - s.awayScore;
  return d > 0 ? 0 : d === 0 ? 1 : 2;
}

// Order scorelines as an outcome spectrum:
//   home wins  – highest home score first, then falling (away score ascending)
//   draws      – low to high (0–0, 1–1, 2–2, …)
//   away wins  – lowest away score first, then rising (home score ascending)
function compareScorelines(a, b) {
  const ra = outcomeRank(a);
  const rb = outcomeRank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 0) return b.homeScore - a.homeScore || a.awayScore - b.awayScore;
  if (ra === 1) return a.homeScore - b.homeScore;
  return a.awayScore - b.awayScore || a.homeScore - b.homeScore;
}

// Public-only fixture fields shared with the client (no predictions here).
function fixtureMeta(m) {
  return {
    id: m.id,
    matchNumber: m.matchNumber,
    group: m.group,
    homeTeam: m.homeTeam,
    homeFlag: m.homeFlag,
    awayTeam: m.awayTeam,
    awayFlag: m.awayFlag,
    kickoffUtc: m.kickoffUtc,
    venue: m.venue,
  };
}

// Aggregate the whole field's predictions for the currently in-progress match(es)
// and the last few finished matches into a per-scoreline breakdown (count + names).
// Predictions are only ever revealed for matches that have kicked off or have a
// result — resolveSpotlight's `recent` + `inProgress` — never for `next` fixtures.
// Auth gating is on the frontend (AuthGuard), matching getLeaderboard.
app.http('getPredictionBreakdown', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'prediction-breakdown',
  handler: async () => {
    const results = await loadResults();

    // In playoff display mode the format changes from group scorelines to bracket
    // advancement. Others' knockout picks are only revealed once the lockout has passed.
    if (isPlayoffDisplay(results)) {
      return { status: 200, jsonBody: await playoffBreakdown(results, isPlayoffLocked()) };
    }

    // Show more history here than the leaderboard spotlight: up to the six most recent
    // finished matches, but only those from the last 24 hours.
    const { recent, inProgress } = resolveSpotlight(results.groupResults, {
      recentMax: 6,
      recentWindowMs: 24 * 60 * 60 * 1000,
    });
    // In-progress first (the live match is the most interesting), then most-recent finished.
    const targets = [...inProgress, ...[...recent].reverse()];

    // Map userId → displayName, excluding soft-removed (hidden) participants so their
    // predictions never surface here.
    const nameByUser = new Map();
    for await (const e of getUsersTable().listEntities({
      queryOptions: { filter: `PartitionKey eq 'user'` },
    })) {
      if (e.hidden === true) continue;
      nameByUser.set(e.rowKey, e.displayName || e.rowKey);
    }

    // For each target match, bucket predictions by exact scoreline. Keyed by matchId
    // → Map("h-a" → { homeScore, awayScore, users: [displayName] }). Only predictions
    // from non-hidden users are counted.
    const targetIds = new Set(targets.map((m) => m.id));
    const byMatch = new Map(targets.map((m) => [m.id, new Map()]));
    for await (const e of getPredictionsTable().listEntities()) {
      const name = nameByUser.get(e.partitionKey);
      if (!name) continue;                       // hidden/unknown user
      if (!targetIds.has(e.rowKey)) continue;    // not a spotlight match
      if (!Number.isInteger(e.homeScore) || !Number.isInteger(e.awayScore)) continue;
      const buckets = byMatch.get(e.rowKey);
      const key = `${e.homeScore}-${e.awayScore}`;
      if (!buckets.has(key)) buckets.set(key, { homeScore: e.homeScore, awayScore: e.awayScore, users: [] });
      buckets.get(key).users.push(name);
    }

    const matches = targets.map((m) => {
      const buckets = byMatch.get(m.id);
      const scorelines = [...buckets.values()].map((b) => ({
        homeScore: b.homeScore,
        awayScore: b.awayScore,
        count: b.users.length,
        users: b.users.sort((a, b2) => a.localeCompare(b2, 'sv')),
      }));
      // Order as an outcome spectrum: home wins first (highest home score down,
      // biggest margin first within a score), then draws (low to high), then away
      // wins (lowest away score up). Independent of how many picked each.
      scorelines.sort(compareScorelines);
      const total = scorelines.reduce((n, s) => n + s.count, 0);
      const actual = results.groupResults[m.id] || null;
      // For finished matches, attach the group-stage points each scoreline earns
      // against the actual result (null while the match is still in progress).
      for (const s of scorelines) {
        s.points = actual ? scoreGroup(s, actual) : null;
      }
      return {
        ...fixtureMeta(m),
        status: actual ? 'completed' : 'inProgress',
        actual: actual ? { homeScore: actual.homeScore, awayScore: actual.awayScore } : null,
        total,
        scorelines,
      };
    });

    return { status: 200, jsonBody: { playoff: false, matches } };
  },
});
