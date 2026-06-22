'use strict';

const { app } = require('@azure/functions');
const { verifyAuth, isAdminEmail } = require('../shared/authMiddleware');
const {
  getUsersTable,
  getMatchesTable,
  getPredictionsTable,
  getPlayoffTable,
} = require('../shared/tableClient');
const { loadResults } = require('../shared/results');
const { MATCHES } = require('../shared/matchData');
const { buildBracket, PLAYOFF_LOCKOUT } = require('../shared/bracket');
const { scoreGroup, scorePlayoff } = require('../shared/scoring');

// Read ANOTHER participant's predictions. Visibility is enforced here, server-side:
//   - group matches: a prediction is included only once that match has locked
//     (kicked off); otherwise the fixture is returned with `hidden: true` and no score.
//   - playoff bracket: returned only once PLAYOFF_LOCKOUT has passed.
// An admin may pass ?reveal=1 to bypass the filter (re-verified here), and a user
// viewing their own page always sees everything. Hidden predictions are dropped
// before serialization, so they never reach the client.
app.http('getUserPredictions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{userId}/predictions',
  handler: async (request) => {
    let viewer;
    try {
      viewer = verifyAuth(request);
    } catch (err) {
      return { status: err.status || 401, jsonBody: { error: err.message } };
    }

    const userId = request.params.userId;
    if (!userId) {
      return { status: 400, jsonBody: { error: 'userId required' } };
    }

    let target;
    try {
      target = await getUsersTable().getEntity('user', userId);
    } catch {
      return { status: 404, jsonBody: { error: 'User not found' } };
    }
    const displayName = target.displayName || userId;

    const viewerIsAdmin = isAdminEmail(viewer.email);
    const isSelf = viewer.userId === userId;
    // Reveal is honored only after re-verifying the requester is an admin.
    const revealAll = isSelf || (viewerIsAdmin && request.query.get('reveal') === '1');

    const now = Date.now();

    const [preds, picks, results] = await Promise.all([
      collectUserMap(getPredictionsTable(), userId, (e) => ({ homeScore: e.homeScore, awayScore: e.awayScore })),
      collectUserMap(getPlayoffTable(), userId, (e) => e.winner),
      loadResults(),
    ]);

    // Group matches, locked individually at their own kickoff.
    const matches = [];
    for await (const entity of getMatchesTable().listEntities()) {
      const id = entity.rowKey;
      const locked = entity.kickoffUtc ? now >= new Date(entity.kickoffUtc).getTime() : false;
      const m = {
        id,
        group: entity.partitionKey,
        matchday: entity.matchday,
        matchNumber: entity.matchNumber,
        homeTeam: entity.homeTeam,
        homeFlag: entity.homeFlag,
        awayTeam: entity.awayTeam,
        awayFlag: entity.awayFlag,
        kickoffUtc: entity.kickoffUtc,
        venue: entity.venue,
        locked,
      };
      if (locked || revealAll) {
        const pred = preds[id];
        const actual = results.groupResults[id];
        if (pred) m.prediction = pred;
        if (actual) {
          m.actual = actual;
          m.points = scoreGroup(pred, actual); // 0 when no/partial prediction
        }
      } else {
        m.hidden = true;
      }
      matches.push(m);
    }
    matches.sort((a, b) => a.matchNumber - b.matchNumber);

    // Playoff bracket: revealed as a whole once group play is done (or admin/self).
    const playoffLocked = now >= PLAYOFF_LOCKOUT;
    let playoff = null;
    let playoffScore = null;
    if (playoffLocked || revealAll) {
      const predictedBracket = buildBracket(MATCHES, preds, picks, { allowPartial: true });
      playoff = { matches: predictedBracket.matches, champion: predictedBracket.champion };
      // Playoff points only count once the admin enables scoring (playoff started).
      if (results.playoffScoring) {
        const actualBracket = buildBracket(MATCHES, results.groupResults, results.knockoutWinners, {
          thirdOrder: results.thirdOrder, allowPartial: true,
        });
        playoffScore = scorePlayoff(predictedBracket, actualBracket);
      }
    }

    return {
      status: 200,
      jsonBody: {
        user: { userId, displayName },
        matches,
        playoff,
        playoffScore,
        playoffLocked,
        revealed: revealAll,
        viewerIsAdmin,
        isSelf,
      },
    };
  },
});

// Collect one user's rows from a table (partitioned by userId) into { rowKey: mapFn(entity) }.
async function collectUserMap(table, userId, mapFn) {
  const out = {};
  for await (const e of table.listEntities({
    queryOptions: { filter: `PartitionKey eq '${userId}'` },
  })) {
    out[e.rowKey] = mapFn(e);
  }
  return out;
}
