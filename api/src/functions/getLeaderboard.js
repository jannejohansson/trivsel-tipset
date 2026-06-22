'use strict';

const { app } = require('@azure/functions');
const { getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { collectUsers, collectByUser } = require('../shared/leaderboardData');
const { loadResults } = require('../shared/results');
const { MATCHES } = require('../shared/matchData');
const { resolveSpotlight } = require('../shared/spotlight');
const { buildBracket } = require('../shared/bracket');
const { scoreGroupTotal, scorePlayoff, scoreGroup } = require('../shared/scoring');

// Public-only fixture fields (no predictions) shared across all rows.
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

// Real-UTC instant of the most recent Europe/Stockholm midnight (start of "today"
// in Swedish local time). Used as the cutoff for the previous-day snapshot.
function startOfTodayStockholmMs() {
  const tz = 'Europe/Stockholm';
  const now = new Date();
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(now).reduce((a, x) => { a[x.type] = x.value; return a; }, {});
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offset = asUTC - now.getTime();                      // Stockholm wall − real UTC
  return Date.UTC(+p.year, +p.month - 1, +p.day) - offset;   // Stockholm midnight as real UTC
}

// Stable leaderboard ordering: points desc, then more predictions, then most
// recent login. Shared by the live ranking and the previous-day ranking so the
// movement delta reflects only point changes.
function makeComparator(pointsOf) {
  return (a, b) =>
    pointsOf(b) - pointsOf(a) ||
    b.predictionCount - a.predictionCount ||
    new Date(b.lastLoginAt) - new Date(a.lastLoginAt);
}

app.http('getLeaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaderboard',
  handler: async () => {
    const cutoffMs = startOfTodayStockholmMs();
    const [usersRaw, predsByUser, picksByUser, results, prevResults] = await Promise.all([
      collectUsers(),
      collectByUser(getPredictionsTable(), (e) => ({ homeScore: e.homeScore, awayScore: e.awayScore })),
      collectByUser(getPlayoffTable(), (e) => e.winner),
      loadResults(),
      loadResults({ asOfMs: cutoffMs }),
    ]);

    // The single shared actual bracket every user's playoff picks are scored against,
    // plus its previous-day counterpart for computing rank movement. allowPartial lets
    // it resolve from results so far (so playoff scoring can be tested before the group
    // stage is fully complete); the playoffScoring switch gates whether points count.
    const actualBracket = buildBracket(MATCHES, results.groupResults, results.knockoutWinners, {
      thirdOrder: results.thirdOrder, allowPartial: true,
    });
    const prevBracket = buildBracket(MATCHES, prevResults.groupResults, prevResults.knockoutWinners, {
      thirdOrder: prevResults.thirdOrder, allowPartial: true,
    });
    // Admin master-switch: while off, no playoff points are awarded to users.
    const playoffOn = results.playoffScoring;
    const prevPlayoffOn = prevResults.playoffScoring;
    // Only surface movement once there was a standing to move from (≥1 result before today).
    const hadPriorResults =
      Object.keys(prevResults.groupResults).length > 0 || Object.keys(prevResults.knockoutWinners).length > 0;

    const { recent, inProgress, next } = resolveSpotlight(results.groupResults);

    const users = usersRaw.map((u) => {
      const preds = predsByUser.get(u.userId) || {};
      const picks = picksByUser.get(u.userId) || {};
      const groupPoints = scoreGroupTotal(preds, results.groupResults);
      const predictedBracket = buildBracket(MATCHES, preds, picks, { allowPartial: true });
      const playoffPoints = playoffOn ? scorePlayoff(predictedBracket, actualBracket).total : 0;
      // Previous-day total reuses the same predicted bracket (predictions don't
      // depend on actual results) — only the actual results/bracket differ.
      const prevPoints = scoreGroupTotal(preds, prevResults.groupResults)
        + (prevPlayoffOn ? scorePlayoff(predictedBracket, prevBracket).total : 0);

      // Per-user spotlight predictions, keyed by matchId — only for matches whose tips are
      // already public (completed or in progress). Completed matches also carry the points
      // earned. The `next` matches' predictions are never serialized.
      const spotlight = {};
      for (const m of recent) {
        if (preds[m.id]) spotlight[m.id] = { ...preds[m.id], points: scoreGroup(preds[m.id], results.groupResults[m.id]) };
      }
      for (const m of inProgress) {
        if (preds[m.id]) spotlight[m.id] = { ...preds[m.id] };
      }

      return {
        ...u,
        predictionCount: Object.keys(preds).length,
        groupPredictionCount: Object.keys(preds).length,
        // Count only picks still valid in the current bracket: stale picks (orphaned
        // when a group edit changed who advances) linger in the table but buildBracket
        // nulls them out, so Object.keys(picks).length would overcount.
        playoffPredictionCount: predictedBracket.matches.filter((m) => m.pick).length,
        groupPoints,
        playoffPoints,
        points: groupPoints + playoffPoints,
        _prevPoints: prevPoints,
        spotlight,
      };
    });

    // Current standing order + 1-based rank.
    users.sort(makeComparator((u) => u.points));
    users.forEach((u, i) => { u.rank = i + 1; });

    // Previous-day rank, by the same comparator on yesterday's points. Null until
    // there was a prior standing to compare against.
    if (hadPriorResults) {
      const prevRank = new Map();
      [...users].sort(makeComparator((u) => u._prevPoints)).forEach((u, i) => prevRank.set(u.userId, i + 1));
      users.forEach((u) => { u.prevRank = prevRank.get(u.userId); });
    } else {
      users.forEach((u) => { u.prevRank = null; });
    }
    users.forEach((u) => { delete u._prevPoints; });

    return {
      status: 200,
      jsonBody: {
        count: users.length,
        users,
        spotlight: {
          recent: recent.map((m) => ({ ...fixtureMeta(m), actual: results.groupResults[m.id] })),
          inProgress: inProgress.map(fixtureMeta),
          next: next.map(fixtureMeta),
        },
      },
    };
  },
});
