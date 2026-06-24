// Achievement badges awarded server-side (api getLeaderboard). Emoji + Swedish label/description,
// the per-user `achievements` field each maps to, and whether the value is a signed delta.
// Array order drives display order (leaderboard legend + profile list); BADGE_META is the
// keyed lookup used when rendering a winner's badge.
export const ACHIEVEMENTS = [
  { key: 'prickskytt', emoji: '🎯', label: 'Prickskytt', desc: 'flest exakta resultat', field: 'exact' },
  { key: 'streak', emoji: '🔥', label: 'Längsta svit', desc: 'längst poängsvit i rad', field: 'streak' },
  { key: 'raket', emoji: '🚀', label: 'Raketen', desc: 'störst klättring senaste 3 dagarna', field: 'climb', signed: true },
  { key: 'stryktipparen', emoji: '✅', label: 'Stryktipparen', desc: 'flest rätt tecken (1X2)', field: 'outcome' },
  { key: 'tursam', emoji: '🍀', label: 'Tursam', desc: 'tippat helt fel men fått poäng ändå', field: 'lucky' },
];

export const BADGE_META = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.key, a]));
