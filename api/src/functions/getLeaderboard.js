'use strict';

const { app } = require('@azure/functions');
const { getUsersTable, getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { loadResults } = require('../shared/results');
const { MATCHES } = require('../shared/matchData');
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

// Resolve the global "spotlight" fixtures relative to now (all chronological):
//   recent     – up to the last three completed matches (a result exists)
//   inProgress – matches kicked off but not yet resulted
//   next       – the next matches not yet kicked off; all that share the earliest
//                kickoff time (group-stage MD3 pairs start simultaneously)
// A match's predictions are public iff it has kicked off or has a result; `next`
// matches must never leak any prediction, so they carry fixture metadata only.
function resolveSpotlight(groupResults) {
  const now = Date.now();
  const byKickoff = (a, b) =>
    new Date(a.kickoffUtc) - new Date(b.kickoffUtc) || a.matchNumber - b.matchNumber;

  const completed = [];
  const inProgress = [];
  const notStarted = [];
  for (const m of MATCHES) {
    const result = groupResults[m.id];
    const kickedOff = m.kickoffUtc ? now >= new Date(m.kickoffUtc).getTime() : false;
    if (result) completed.push(m);
    else if (kickedOff) inProgress.push(m);
    else notStarted.push(m);
  }
  completed.sort(byKickoff);
  inProgress.sort(byKickoff);
  notStarted.sort(byKickoff);

  const next = notStarted.length
    ? notStarted.filter((m) => m.kickoffUtc === notStarted[0].kickoffUtc)
    : [];
  return { recent: completed.slice(-3), inProgress, next };
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
    // plus its previous-day counterpart for computing rank movement.
    const actualBracket = buildBracket(MATCHES, results.groupResults, results.knockoutWinners, {
      thirdOrder: results.thirdOrder,
    });
    const prevBracket = buildBracket(MATCHES, prevResults.groupResults, prevResults.knockoutWinners, {
      thirdOrder: prevResults.thirdOrder,
    });
    // Only surface movement once there was a standing to move from (≥1 result before today).
    const hadPriorResults =
      Object.keys(prevResults.groupResults).length > 0 || Object.keys(prevResults.knockoutWinners).length > 0;

    const { recent, inProgress, next } = resolveSpotlight(results.groupResults);

    const users = usersRaw.map((u) => {
      const preds = predsByUser.get(u.userId) || {};
      const picks = picksByUser.get(u.userId) || {};
      const groupPoints = scoreGroupTotal(preds, results.groupResults);
      const predictedBracket = buildBracket(MATCHES, preds, picks);
      const playoffPoints = scorePlayoff(predictedBracket, actualBracket).total;
      // Previous-day total reuses the same predicted bracket (predictions don't
      // depend on actual results) — only the actual results/bracket differ.
      const prevPoints = scoreGroupTotal(preds, prevResults.groupResults)
        + scorePlayoff(predictedBracket, prevBracket).total;

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

async function collectUsers() {
  const users = [];
  for await (const entity of getUsersTable().listEntities({
    queryOptions: { filter: `PartitionKey eq 'user'` },
  })) {
    if (entity.hidden === true) continue; // soft-removed: excluded from the public leaderboard
    users.push({
      userId: entity.rowKey,
      displayName: entity.displayName || entity.rowKey,
      lastLoginAt: entity.lastLoginAt,
      paid: entity.paid === true,
    });
  }
  return users;
}

// Bucket an entire table by partitionKey (userId) into { rowKey: mapFn(entity) }.
async function collectByUser(table, mapFn) {
  const byUser = new Map();
  for await (const entity of table.listEntities()) {
    const uid = entity.partitionKey;
    if (!byUser.has(uid)) byUser.set(uid, {});
    byUser.get(uid)[entity.rowKey] = mapFn(entity);
  }
  return byUser;
}
