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

app.http('getLeaderboard', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaderboard',
  handler: async () => {
    const [usersRaw, predsByUser, picksByUser, results] = await Promise.all([
      collectUsers(),
      collectByUser(getPredictionsTable(), (e) => ({ homeScore: e.homeScore, awayScore: e.awayScore })),
      collectByUser(getPlayoffTable(), (e) => e.winner),
      loadResults(),
    ]);

    // The single shared actual bracket every user's playoff picks are scored against.
    const actualBracket = buildBracket(MATCHES, results.groupResults, results.knockoutWinners, {
      thirdOrder: results.thirdOrder,
    });

    const { recent, inProgress, next } = resolveSpotlight(results.groupResults);

    const users = usersRaw.map((u) => {
      const preds = predsByUser.get(u.userId) || {};
      const picks = picksByUser.get(u.userId) || {};
      const groupPoints = scoreGroupTotal(preds, results.groupResults);
      const predictedBracket = buildBracket(MATCHES, preds, picks);
      const playoffPoints = scorePlayoff(predictedBracket, actualBracket).total;

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
        playoffPredictionCount: Object.keys(picks).length,
        groupPoints,
        playoffPoints,
        points: groupPoints + playoffPoints,
        spotlight,
      };
    });

    users.sort((a, b) =>
      b.points - a.points ||
      b.predictionCount - a.predictionCount ||
      new Date(b.lastLoginAt) - new Date(a.lastLoginAt)
    );

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
    users.push({
      userId: entity.rowKey,
      displayName: entity.displayName || entity.rowKey,
      lastLoginAt: entity.lastLoginAt,
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
