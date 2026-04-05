'use strict';

const { app } = require('@azure/functions');
const { tryAuth } = require('../shared/authMiddleware');
const { getMatchesContainer, getPredictionsContainer } = require('../shared/cosmosClient');

// Predictions locked when the first match kicks off
const LOCKOUT_TIMESTAMP = new Date('2026-06-11T18:00:00Z').getTime();

app.http('getMatches', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'matches',
  handler: async (request, context) => {
    const user = tryAuth(request);
    const locked = Date.now() >= LOCKOUT_TIMESTAMP;

    // Fetch all matches
    const matchesContainer = getMatchesContainer();
    let matches;
    try {
      const { resources } = await matchesContainer.items
        .query('SELECT * FROM c ORDER BY c.kickoffUtc', { enableCrossPartitionQuery: true })
        .fetchAll();
      matches = resources;
    } catch (err) {
      context.log('Error fetching matches:', err);
      return { status: 500, jsonBody: { error: 'Failed to load matches' } };
    }

    // Merge in user's predictions if authenticated
    if (user) {
      try {
        const predsContainer = getPredictionsContainer();
        const { resources: predictions } = await predsContainer.items
          .query({
            query: 'SELECT * FROM c WHERE c.userId = @userId',
            parameters: [{ name: '@userId', value: user.userId }],
          })
          .fetchAll();

        const predMap = {};
        for (const p of predictions) {
          predMap[p.matchId] = { homeScore: p.homeScore, awayScore: p.awayScore };
        }

        matches = matches.map(m => ({
          ...m,
          prediction: predMap[m.id] || null,
        }));
      } catch (err) {
        context.log('Error fetching predictions:', err);
        // Non-fatal — return matches without predictions
      }
    }

    return { status: 200, jsonBody: { matches, locked } };
  },
});
