'use strict';

const { app } = require('@azure/functions');
const { getUsersTable, getPredictionsTable } = require('../shared/tableClient');
const { loadResults } = require('../shared/results');
const { resolveSpotlight } = require('../shared/spotlight');

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
    const { recent, inProgress } = resolveSpotlight(results.groupResults);
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
      return {
        ...fixtureMeta(m),
        status: actual ? 'completed' : 'inProgress',
        actual: actual ? { homeScore: actual.homeScore, awayScore: actual.awayScore } : null,
        total,
        scorelines,
      };
    });

    return { status: 200, jsonBody: { matches } };
  },
});
