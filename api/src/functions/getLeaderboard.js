'use strict';

const { app } = require('@azure/functions');
const { getPredictionsTable, getPlayoffTable } = require('../shared/tableClient');
const { collectUsers, collectByUser } = require('../shared/leaderboardData');
const { loadResults } = require('../shared/results');
const { MATCHES } = require('../shared/matchData');
const { resolveSpotlight } = require('../shared/spotlight');
const { buildBracket } = require('../shared/bracket');
const { scoreGroupTotal, scorePlayoff, scoreGroup } = require('../shared/scoring');
const { isPlayoffMode } = require('../shared/phase');

// A bracket's predicted champion as { team, flag } (flag pulled from the final's slots),
// or null when no final winner is picked yet.
function championOf(bracket) {
  if (!bracket.champion) return null;
  const final = bracket.matches.find((m) => m.id === 'ko_104');
  if (!final) return { team: bracket.champion, flag: null };
  const flag = final.home.team === bracket.champion ? final.home.flag
    : final.away.team === bracket.champion ? final.away.flag : null;
  return { team: bracket.champion, flag };
}

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

// Sign of a scoreline (1 home win / 0 draw / -1 away win), used for outcome comparison.
const sign = (h, a) => (h > a ? 1 : h < a ? -1 : 0);

// Per-user group achievement counters, derived by walking the chronologically-ordered
// list of completed group matches (oldest → newest) against one user's predictions.
//   exact   – exact-score hits (scoreGroup === 5)
//   streak  – current ONGOING run of consecutive completed matches that scored > 0,
//             counting back from the most recent completed match (resets to 0 the moment
//             a 0-point match breaks it — so only users on a live hot streak qualify)
//   outcome – correct 1X2 outcomes (→ Stryktipparen)
//   lucky   – outcome WRONG yet exactly one goal side matched (→ Tursam); when the outcome
//             is wrong both sides can't match (that would be an exact score), so this is a
//             goal point won "by luck"
function groupAchievements(preds, completed, groupResults) {
  let exact = 0, outcome = 0, lucky = 0, run = 0;
  for (const m of completed) {
    const p = preds[m.id];
    const a = groupResults[m.id];
    const pts = scoreGroup(p, a);
    // `run` is the live ongoing streak: a 0-point match resets it, so after the loop it
    // reflects only the unbroken run ending at the most recent completed match.
    if (pts > 0) run += 1; else run = 0;
    if (!p || !a) continue;
    const ph = Number(p.homeScore), pa = Number(p.awayScore);
    const ah = Number(a.homeScore), aa = Number(a.awayScore);
    if (![ph, pa, ah, aa].every(Number.isFinite)) continue;
    if (pts === 5) exact += 1;
    const outcomeRight = sign(ph, pa) === sign(ah, aa);
    if (outcomeRight) outcome += 1;
    else if ((ph === ah) !== (pa === aa)) lucky += 1;
  }
  return { exact, streak: run, outcome, lucky };
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
    const threeDaysAgoMs = Date.now() - 3 * 24 * 60 * 60 * 1000;
    const [usersRaw, predsByUser, picksByUser, results, prevResults, weekResults] = await Promise.all([
      collectUsers(),
      collectByUser(getPredictionsTable(), (e) => ({ homeScore: e.homeScore, awayScore: e.awayScore })),
      collectByUser(getPlayoffTable(), (e) => e.winner),
      loadResults(),
      loadResults({ asOfMs: cutoffMs }),
      loadResults({ asOfMs: threeDaysAgoMs }),
    ]);

    // The single shared actual bracket every user's playoff picks are scored against,
    // plus its previous-day counterpart for computing rank movement. allowPartial lets
    // it resolve from results so far (so playoff scoring can be tested before the group
    // stage is fully complete); the playoffScoring switch gates whether points count.
    const actualBracket = buildBracket(MATCHES, results.groupResults, results.knockoutWinners, {
      thirdOrder: results.thirdOrder, allowPartial: true,
    });
    const prevBracket = buildBracket(MATCHES, prevResults.groupResults, prevResults.knockoutWinners, {
      thirdOrder: prevResults.thirdOrder, allowPartial: true,
    });
    // 3-day-ago snapshot for the "Raketen" climber award.
    const weekBracket = buildBracket(MATCHES, weekResults.groupResults, weekResults.knockoutWinners, {
      thirdOrder: weekResults.thirdOrder, allowPartial: true,
    });
    // Admin master-switch: while off, no playoff points are awarded to users.
    const playoffOn = results.playoffScoring;
    // Playoff display mode (scoring switch OR lockout time) — gates champion exposure etc.
    const playoffMode = isPlayoffMode(results);
    const prevPlayoffOn = prevResults.playoffScoring;
    const weekPlayoffOn = weekResults.playoffScoring;
    // Only surface movement once there was a standing to move from (≥1 result before today).
    const hadPriorResults =
      Object.keys(prevResults.groupResults).length > 0 || Object.keys(prevResults.knockoutWinners).length > 0;
    const hadResults3d =
      Object.keys(weekResults.groupResults).length > 0 || Object.keys(weekResults.knockoutWinners).length > 0;

    // Completed group matches, oldest → newest, for streak/achievement walking. Mirrors the
    // chronological ordering resolveSpotlight uses. A match is "completed" iff it has a result.
    const completedGroup = MATCHES
      .filter((m) => results.groupResults[m.id])
      .sort((a, b) => new Date(a.kickoffUtc) - new Date(b.kickoffUtc) || a.matchNumber - b.matchNumber);

    const { recent, inProgress, next } = resolveSpotlight(results.groupResults);

    const users = usersRaw.map((u) => {
      const preds = predsByUser.get(u.userId) || {};
      const picks = picksByUser.get(u.userId) || {};
      const groupPoints = scoreGroupTotal(preds, results.groupResults);
      const predictedBracket = buildBracket(MATCHES, preds, picks, { allowPartial: true });
      const playoffPoints = playoffOn ? scorePlayoff(predictedBracket, actualBracket).total : 0;
      // Previous-day / 3-days-ago totals reuse the same predicted bracket (predictions don't
      // depend on actual results) — only the actual results/bracket differ.
      const prevPoints = scoreGroupTotal(preds, prevResults.groupResults)
        + (prevPlayoffOn ? scorePlayoff(predictedBracket, prevBracket).total : 0);
      const weekPoints = scoreGroupTotal(preds, weekResults.groupResults)
        + (weekPlayoffOn ? scorePlayoff(predictedBracket, weekBracket).total : 0);
      const ach = groupAchievements(preds, completedGroup, results.groupResults);

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
        _weekPoints: weekPoints,
        _ach: ach,
        spotlight,
        // Predicted champion is public only in playoff mode (picks are locked by then).
        champion: playoffMode ? championOf(predictedBracket) : null,
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

    // Rank gain over the last 3 days (for the "Raketen" climber award). climbDelta > 0 = moved up.
    if (hadResults3d) {
      const weekRank = new Map();
      [...users].sort(makeComparator((u) => u._weekPoints)).forEach((u, i) => weekRank.set(u.userId, i + 1));
      users.forEach((u) => { u._climbDelta = weekRank.get(u.userId) - u.rank; });
    } else {
      users.forEach((u) => { u._climbDelta = null; });
    }

    // Public per-user achievement numbers (profile page shows everyone their own values).
    users.forEach((u) => {
      u.achievements = {
        exact: u._ach.exact, streak: u._ach.streak, outcome: u._ach.outcome, lucky: u._ach.lucky,
        climb: u._climbDelta,
        // Positions lost over the same window (for "Ankaret"): a positive count when the user
        // dropped, so the shared max-resolver below picks the biggest faller. null/≤0 = didn't fall.
        anchor: u._climbDelta != null ? -u._climbDelta : null,
      };
    });

    // Resolve each achievement category: the user(s) with the max value win the badge and define
    // the category leader, provided the value clears a floor (so nobody "wins" a trivial title).
    // Ties → every tied user gets the badge and appears as a co-leader.
    const CATEGORIES = [
      { key: 'prickskytt', label: 'Prickskytt', field: 'exact', floor: 1 },
      { key: 'streak', label: 'Hetast just nu', field: 'streak', floor: 3 },
      { key: 'stryktipparen', label: 'Stryktipparen', field: 'outcome', floor: 1 },
      { key: 'tursam', label: 'Tursam', field: 'lucky', floor: 1 },
      { key: 'raket', label: 'Raketen', field: 'climb', floor: 1 },
      { key: 'ankaret', label: 'Ankaret', field: 'anchor', floor: 1 },
    ];
    const achievementLeaders = {};
    for (const cat of CATEGORIES) {
      let best = cat.floor - 1;
      for (const u of users) { const v = u.achievements[cat.field]; if (v != null && v > best) best = v; }
      if (best < cat.floor) { achievementLeaders[cat.key] = null; continue; }
      const winners = users.filter((u) => u.achievements[cat.field] === best);
      for (const u of winners) (u.badges ||= []).push({ key: cat.key, label: cat.label, value: best });
      achievementLeaders[cat.key] = {
        value: best,
        names: winners.map((u) => u.displayName),
        userIds: winners.map((u) => u.userId),
      };
    }

    users.forEach((u) => { delete u._prevPoints; delete u._weekPoints; delete u._ach; delete u._climbDelta; });

    return {
      status: 200,
      jsonBody: {
        count: users.length,
        users,
        achievementLeaders,
        playoffMode,
        spotlight: {
          recent: recent.map((m) => ({ ...fixtureMeta(m), actual: results.groupResults[m.id] })),
          inProgress: inProgress.map(fixtureMeta),
          next: next.map(fixtureMeta),
        },
      },
    };
  },
});
