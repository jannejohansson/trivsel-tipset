'use strict';

const { app } = require('@azure/functions');
const { tryAuth } = require('../shared/authMiddleware');
const { getMatchesTable, getPredictionsTable } = require('../shared/tableClient');
const { loadResults } = require('../shared/results');

app.http('getMatches', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'matches',
  handler: async (request) => {
    const user = tryAuth(request);
    const now = Date.now();

    // A match locks at its own kickoff, or earlier once the admin has entered a
    // result for it (clearing the result unlocks it again, unless kickoff passed).
    const { groupResults } = await loadResults();
    const matchesTable = getMatchesTable();
    const matches = [];
    for await (const entity of matchesTable.listEntities()) {
      const kickedOff = entity.kickoffUtc ? now >= new Date(entity.kickoffUtc).getTime() : false;
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
        locked: kickedOff || !!groupResults[entity.rowKey],
      });
    }
    matches.sort((a, b) => a.matchNumber - b.matchNumber);
    const locked = matches.length > 0 && matches.every((m) => m.locked);

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
