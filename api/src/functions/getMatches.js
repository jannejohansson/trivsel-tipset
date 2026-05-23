'use strict';

const { app } = require('@azure/functions');
const { tryAuth } = require('../shared/authMiddleware');
const { getMatchesTable, getPredictionsTable } = require('../shared/tableClient');

const LOCKOUT_TIMESTAMP = new Date('2026-06-11T18:00:00Z').getTime();

app.http('getMatches', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'matches',
  handler: async (request) => {
    const user = tryAuth(request);
    const locked = Date.now() >= LOCKOUT_TIMESTAMP;

    // Load all matches
    const matchesTable = getMatchesTable();
    const matches = [];
    for await (const entity of matchesTable.listEntities()) {
      matches.push({
        id: entity.rowKey,
        group: entity.partitionKey,
        matchday: entity.matchday,
        matchNumber: entity.matchNumber,
        homeTeam: entity.homeTeam,
        homeFlag: entity.homeFlag,
        awayTeam: entity.awayTeam,
        awayFlag: entity.awayFlag,
        kickoffUtc: entity.kickoffUtc,
        venue: entity.venue,
      });
    }
    matches.sort((a, b) => a.matchNumber - b.matchNumber);

    // Merge in user predictions if authenticated
    if (user) {
      const predictionsTable = getPredictionsTable();
      const predMap = new Map();
      for await (const entity of predictionsTable.listEntities({
        queryOptions: { filter: `PartitionKey eq '${user.userId}'` },
      })) {
        predMap.set(entity.rowKey, {
          homeScore: entity.homeScore,
          awayScore: entity.awayScore,
        });
      }
      for (const match of matches) {
        const pred = predMap.get(match.id);
        if (pred) match.prediction = pred;
      }
    }

    return { status: 200, jsonBody: { matches, locked } };
  },
});
