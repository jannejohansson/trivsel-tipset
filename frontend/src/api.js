const BASE = '/api';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const e = new Error(err.error || 'API error');
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export const api = {
  getMe: () => apiFetch('/auth/me'),
  sendMagicLink: (email) =>
    apiFetch('/auth/send-magic-link', { method: 'POST', body: JSON.stringify({ email }) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  getMatches: () => apiFetch('/matches'),
  savePrediction: (matchId, homeScore, awayScore) =>
    apiFetch('/predictions', {
      method: 'POST',
      body: JSON.stringify({ matchId, homeScore, awayScore }),
    }),
  resetGroupPredictions: (group) =>
    apiFetch('/predictions/reset', { method: 'POST', body: JSON.stringify({ group }) }),
  updateProfile: (displayName) =>
    apiFetch('/auth/profile', { method: 'POST', body: JSON.stringify({ displayName }) }),
  getLeaderboard: () => apiFetch('/leaderboard'),
  getPredictionBreakdown: () => apiFetch('/prediction-breakdown'),
  getLeaderboardHistory: () => apiFetch('/leaderboard-history'),
  getUserPredictions: (userId, reveal) =>
    apiFetch(`/users/${encodeURIComponent(userId)}/predictions${reveal ? '?reveal=1' : ''}`),
  getPlayoff: () => apiFetch('/playoff'),
  savePlayoffPick: (koMatchId, winner) =>
    apiFetch('/playoff', { method: 'POST', body: JSON.stringify({ koMatchId, winner }) }),
  getResults: () => apiFetch('/results'),
  saveResults: (payload) =>
    apiFetch('/results', { method: 'POST', body: JSON.stringify(payload) }),
  getUsers: () => apiFetch('/users'),
  updateUser: (userId, patch) =>
    apiFetch(`/users/${encodeURIComponent(userId)}`, { method: 'POST', body: JSON.stringify(patch) }),
  // Best-effort: the build id of the currently deployed frontend, served from the
  // (non-hashed, no-cache) /version.json. Returns null on any failure so callers
  // can treat "couldn't check" as "no update". Not under /api — plain static file.
  getDeployedVersion: async () => {
    try {
      const res = await fetch('/version.json', { cache: 'no-store' });
      if (!res.ok) return null;
      const { version } = await res.json();
      return version ?? null;
    } catch {
      return null;
    }
  },
};
