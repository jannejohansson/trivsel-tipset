'use strict';

const { app } = require('@azure/functions');
const { getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { collectUsers, collectByUser } = require('../shared/leaderboardData');
const { loadResults } = require('../shared/results');
const { MATCHES } = require('../shared/matchData');
const { buildBracket, KO_MATCHES, ROUND_ORDER } = require('../shared/bracket');
const { scoreGroupTotal, scorePlayoff } = require('../shared/scoring');

// Ordered tournament stages used as the chart's x-axis checkpoints. Each represents
// "the standing as of the latest results in that stage". Labels are user-facing Swedish.
const STAGES = [
  { key: 'MD1', label: 'Omg 1', kind: 'group', matchday: 1 },
  { key: 'MD2', label: 'Omg 2', kind: 'group', matchday: 2 },
  { key: 'MD3', label: 'Omg 3', kind: 'group', matchday: 3 },
  { key: 'R32', label: '16-del', kind: 'ko', round: 'R32' },
  { key: 'R16', label: '8-del', kind: 'ko', round: 'R16' },
  { key: 'QF', label: 'Kvart', kind: 'ko', round: 'QF' },
  { key: 'SF', label: 'Semi', kind: 'ko', round: 'SF' },
  { key: 'F', label: 'Final', kind: 'ko', round: 'F' },
];

const MATCHDAY_BY_ID = new Map(MATCHES.map((m) => [m.id, m.matchday]));
const KO_ROUND_BY_ID = new Map(KO_MATCHES.map((m) => [m.id, m.round]));
const ROUND_INDEX = new Map(ROUND_ORDER.map((r, i) => [r, i]));

// Cumulative points per participant across the tournament stages — the data behind the
// "Utveckling" line chart. History is reconstructed on demand: predictions lock at each
// match's kickoff, so a played match's contribution is identical to what it was at the
// time. We rescore using only the results known as of each stage. No snapshots stored.
app.http('getLeaderboardHistory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'leaderboard-history',
  handler: async () => {
    const [usersRaw, predsByUser, picksByUser, results] = await Promise.all([
      collectUsers(),
      collectByUser(getPredictionsTable(), (e) => ({ homeScore: e.homeScore, awayScore: e.awayScore })),
      collectByUser(getPlayoffTable(), (e) => e.winner),
      loadResults(),
    ]);

    const groupResultIds = Object.keys(results.groupResults);
    const koResultIds = Object.keys(results.knockoutWinners);

    // A stage is a chart checkpoint only once it has at least one actual result, so the
    // x-axis grows as the tournament progresses (empty before kickoff).
    const stageActive = (stage) =>
      stage.kind === 'group'
        ? groupResultIds.some((id) => MATCHDAY_BY_ID.get(id) === stage.matchday)
        : koResultIds.some((id) => KO_ROUND_BY_ID.get(id) === stage.round);
    const activeStages = STAGES.filter(stageActive);

    // Each user's predicted bracket is independent of the checkpoint — build it once.
    const predicted = usersRaw.map((u) => {
      const preds = predsByUser.get(u.userId) || {};
      const picks = picksByUser.get(u.userId) || {};
      return { user: u, preds, bracket: buildBracket(MATCHES, preds, picks) };
    });

    const series = predicted.map((p) => ({
      userId: p.user.userId,
      displayName: p.user.displayName,
      points: [],
    }));

    for (const stage of activeStages) {
      // Slice the actual results down to what was known by the end of this stage.
      let groupSoFar;
      let koSoFar;
      if (stage.kind === 'group') {
        groupSoFar = {};
        for (const id of groupResultIds) {
          if (MATCHDAY_BY_ID.get(id) <= stage.matchday) groupSoFar[id] = results.groupResults[id];
        }
        koSoFar = {};
      } else {
        groupSoFar = results.groupResults; // all groups are decided by the knockout stage
        koSoFar = {};
        const maxRound = ROUND_INDEX.get(stage.round);
        for (const id of koResultIds) {
          if (ROUND_INDEX.get(KO_ROUND_BY_ID.get(id)) <= maxRound) koSoFar[id] = results.knockoutWinners[id];
        }
      }

      // One shared "results so far" bracket, scored against every user's predicted bracket.
      const actualBracket = buildBracket(MATCHES, groupSoFar, koSoFar, { thirdOrder: results.thirdOrder });

      predicted.forEach((p, i) => {
        const groupPts = scoreGroupTotal(p.preds, groupSoFar);
        const playoffPts = scorePlayoff(p.bracket, actualBracket).total;
        series[i].points.push(groupPts + playoffPts);
      });
    }

    // Highest final total first, for stable and sensible colour/legend ordering.
    series.sort((a, b) => (b.points[b.points.length - 1] || 0) - (a.points[a.points.length - 1] || 0));

    return {
      status: 200,
      jsonBody: {
        checkpoints: activeStages.map((s) => ({ key: s.key, label: s.label })),
        series,
      },
    };
  },
});
