'use strict';

const { app } = require('@azure/functions');
const { getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { collectUsers, collectByUser } = require('../shared/leaderboardData');
const { loadResults } = require('../shared/results');
const { MATCHES } = require('../shared/matchData');
const { buildBracket, KO_MATCHES } = require('../shared/bracket');
const { scoreGroupTotal, scorePlayoff } = require('../shared/scoring');

// Swedish stage label per knockout round (group stages are labelled "Omg N").
const KO_STAGE_LABEL = { R32: '16-del', R16: '8-del', QF: 'Kvart', SF: 'Semi', F: 'Final' };

// Every match in official number order (group 1-72, then knockout 73-104). Each
// checkpoint on the chart is one played match, so the line steps up match by match.
const ORDERED_MATCHES = [
  ...MATCHES.map((m) => ({ id: m.id, num: m.matchNumber, stage: `Omg ${m.matchday}`, kind: 'group' })),
  ...KO_MATCHES.map((m) => ({ id: m.id, num: m.num, stage: KO_STAGE_LABEL[m.round], kind: 'ko' })),
].sort((a, b) => a.num - b.num);

// Cumulative points per participant after each played match — the data behind the
// "Utveckling" line chart. History is reconstructed on demand: predictions lock at each
// match's kickoff, so a played match's contribution is identical to what it was at the
// time. We walk the matches in order, growing the set of known results, and rescore at
// each step. No snapshots stored. Cumulative totals are monotonic non-decreasing.
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

    // Checkpoints = the matches that actually have a result, in number order.
    const hasResult = (mm) =>
      mm.kind === 'group' ? !!results.groupResults[mm.id] : !!results.knockoutWinners[mm.id];
    const checkpoints = ORDERED_MATCHES.filter(hasResult);

    // Each user's predicted bracket is independent of the checkpoint — build it once.
    const predicted = usersRaw.map((u) => {
      const preds = predsByUser.get(u.userId) || {};
      const picks = picksByUser.get(u.userId) || {};
      return { user: u, preds, bracket: buildBracket(MATCHES, preds, picks, { allowPartial: true }) };
    });

    const series = predicted.map((p) => ({
      userId: p.user.userId,
      displayName: p.user.displayName,
      points: [],
    }));

    // Walk checkpoints in order, accumulating the results known so far, and rescore.
    const groupSoFar = {};
    const koSoFar = {};
    for (const cp of checkpoints) {
      if (cp.kind === 'group') groupSoFar[cp.id] = results.groupResults[cp.id];
      else koSoFar[cp.id] = results.knockoutWinners[cp.id];

      // One shared "results so far" bracket, scored against every user's predicted bracket.
      const actualBracket = buildBracket(MATCHES, groupSoFar, koSoFar, { thirdOrder: results.thirdOrder, allowPartial: true });

      predicted.forEach((p, i) => {
        const groupPts = scoreGroupTotal(p.preds, groupSoFar);
        // Playoff points only count once the admin enables scoring (playoff started).
        const playoffPts = results.playoffScoring ? scorePlayoff(p.bracket, actualBracket).total : 0;
        series[i].points.push(groupPts + playoffPts);
      });
    }

    // Highest final total first, for stable and sensible colour/legend ordering.
    series.sort((a, b) => (b.points[b.points.length - 1] || 0) - (a.points[a.points.length - 1] || 0));

    return {
      status: 200,
      jsonBody: {
        checkpoints: checkpoints.map((c) => ({ key: c.id, num: c.num, stage: c.stage })),
        series,
      },
    };
  },
});
