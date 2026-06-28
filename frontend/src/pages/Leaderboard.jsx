import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useIsMobile } from '../lib/useIsMobile.js';
import useAutoRefresh from '../hooks/useAutoRefresh.js';
import { BADGE_META } from '../lib/achievements.js';
import { ROUND_LABELS } from '../lib/bracket.js';

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    padding: '36px 20px 28px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '8px',
    fontWeight: 600,
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    margin: 0,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '14px',
    marginTop: '8px',
  },
  chatLink: {
    color: '#ffffff',
    fontWeight: 700,
    textDecoration: 'none',
    borderBottom: '1px solid rgba(255,255,255,0.6)',
    paddingBottom: '1px',
  },
  page: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '24px',
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-card)',
    borderLeft: '3px solid var(--green)',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  rowMe: {
    borderLeftWidth: '4px',
    background: 'var(--green-dim)',
  },
  rowTop: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    cursor: 'pointer',
  },
  chevron: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    flexShrink: 0,
    marginLeft: '-4px',
    width: '14px',
    textAlign: 'center',
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '10px',
  },
  expandAllBtn: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '999px',
    padding: '7px 14px',
    color: 'var(--text)',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    minWidth: 0,
  },
  nameLink: {
    fontWeight: 700,
    fontSize: '15px',
    color: 'var(--text)',
    textDecoration: 'none',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    minWidth: 0,
  },
  titleStars: {
    flexShrink: 0,
    fontSize: '12px',
    letterSpacing: '1px',
    whiteSpace: 'nowrap',
    cursor: 'help',
  },
  compareLink: {
    flexShrink: 0,
    fontSize: '13px',
    lineHeight: 1,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  championFlag: {
    flexShrink: 0,
    width: '20px',
    height: '15px',
    borderRadius: '2px',
    boxShadow: '0 1px 2px rgba(13,27,42,0.18)',
    cursor: 'help',
  },
  pointsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '7px',
  },
  deltaSlot: {
    width: '40px',
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  deltaChip: {
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'center',
    fontSize: '11px',
    fontWeight: 800,
    padding: '1px 7px',
    borderRadius: '999px',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  deltaUp: { background: 'var(--green-dim)', color: 'var(--green-text)' },
  deltaDown: { background: 'rgba(220,38,38,0.10)', color: 'var(--danger)' },
  rank: {
    width: '28px',
    height: '28px',
    borderRadius: '999px',
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '13px',
    flexShrink: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  rankTop: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(21,163,74,0.3)',
  },
  middle: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  badges: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    flexShrink: 0,
  },
  badge: {
    fontSize: '14px',
    lineHeight: 1,
    cursor: 'help',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--text-muted)',
    fontSize: '11px',
    lineHeight: 1.4,
    marginBottom: '12px',
    textAlign: 'center',
  },
  legendItem: {
    // Each entry on its own line; descriptions wrap instead of overflowing on narrow screens.
    maxWidth: '100%',
  },
  right: {
    textAlign: 'right',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    fontVariantNumeric: 'tabular-nums',
  },
  count: {
    fontSize: '19px',
    fontWeight: 800,
    color: 'var(--text)',
    // Reserve space for up to a 3-digit score ("150 p") so the points text width
    // doesn't vary row-to-row and shift the progress bar. tabular-nums on `.right`
    // keeps the digits aligned.
    minWidth: '52px',
    textAlign: 'right',
  },
  countDone: {
    color: 'var(--green)',
  },
  date: {
    color: 'var(--text-muted)',
    fontSize: '11px',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    padding: '40px 20px',
  },
  footer: {
    borderTop: '1px solid var(--border)',
    paddingTop: '20px',
    marginTop: '8px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  // ── Per-row prediction spotlight ─────────────────────────────
  strip: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px',
    borderTop: '1px dashed var(--border)',
    paddingTop: '10px',
    WebkitOverflowScrolling: 'touch',
  },
  cell: {
    flexShrink: 0,
    minWidth: '150px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '7px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  cellNext: {
    background: 'transparent',
    borderStyle: 'dashed',
  },
  cellLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    whiteSpace: 'nowrap',
  },
  cellTeams: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  cellFlag: {
    width: '20px',
    height: '14px',
    borderRadius: '2px',
    flexShrink: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    boxShadow: '0 1px 2px rgba(13,27,42,0.15)',
  },
  score: {
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  scoreMuted: {
    color: 'var(--text-muted)',
    fontWeight: 700,
  },
  cellMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
  },
  actualNote: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  pointsPill: {
    fontSize: '11px',
    fontWeight: 800,
    padding: '1px 7px',
    borderRadius: '999px',
    background: 'var(--green-dim)',
    color: 'var(--green-text)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  pointsPillZero: {
    background: 'var(--surface)',
    color: 'var(--text-muted)',
  },
  hiddenScore: {
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--text-muted)',
    letterSpacing: '1px',
  },
  caption: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  // ── Playoff spotlight cell ───────────────────────────────────
  poWinner: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    minWidth: 0,
  },
  poWinnerName: {
    fontSize: '14px',
    fontWeight: 800,
    color: 'var(--green-text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  poBeat: {
    fontSize: '10px',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  poPick: {
    fontSize: '10px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  poPickRight: { color: 'var(--green-text)' },
  poPickWrong: { color: 'var(--text-muted)' },
};

function formatKickoff(utc) {
  return new Date(utc).toLocaleString('sv-SE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// One fixture mini-block in the row's spotlight strip. Header is the kickoff date/time.
// Read-only (no nested interactive elements) so a tap anywhere in the row follows the Link.
//   hidden  → not kicked off yet; prediction withheld (carries no score data)
//   actual  → completed; show predicted score, the result, and points earned
//   else    → in progress; show predicted score, awaiting result
function SpotlightCell({ fixture, prediction, hidden }) {
  const actual = fixture.actual;
  const predStr = prediction && Number.isFinite(Number(prediction.homeScore))
    ? `${prediction.homeScore}–${prediction.awayScore}` : null;
  const points = prediction?.points;
  return (
    <div style={{ ...styles.cell, ...(hidden ? styles.cellNext : {}) }}>
      <div style={styles.cellLabel}>{formatKickoff(fixture.kickoffUtc)}</div>
      <div style={styles.cellTeams}>
        <span className={`fi fi-${fixture.homeFlag}`} style={styles.cellFlag} aria-hidden="true" />
        {hidden
          ? <span style={styles.hiddenScore}>•••</span>
          : <span style={{ ...styles.score, ...(predStr ? {} : styles.scoreMuted) }}>{predStr || '–'}</span>}
        <span className={`fi fi-${fixture.awayFlag}`} style={styles.cellFlag} aria-hidden="true" />
      </div>
      {hidden && <div style={styles.caption}>Visas vid avspark</div>}
      {!hidden && actual && (
        <div style={styles.cellMeta}>
          <span style={styles.actualNote}>Resultat {actual.homeScore}–{actual.awayScore}</span>
          <span style={{ ...styles.pointsPill, ...(points > 0 ? {} : styles.pointsPillZero) }}>
            +{points || 0} p
          </span>
        </div>
      )}
      {!hidden && !actual && <div style={styles.caption}>Inväntar resultat</div>}
    </div>
  );
}

// The per-row prediction strip: up to three recently completed matches, any in-progress
// matches, and the next (not-yet-started) fixtures. `shared` holds the public fixture
// metadata (same for everyone); `mine` maps matchId → this user's prediction (+points).
function SpotlightStrip({ shared, mine }) {
  if (!shared) return null;
  const { recent = [], inProgress = [], next = [] } = shared;
  if (recent.length === 0 && inProgress.length === 0 && next.length === 0) return null;
  return (
    <div style={styles.strip}>
      {recent.map((f) => <SpotlightCell key={f.id} fixture={f} prediction={mine?.[f.id]} />)}
      {inProgress.map((f) => <SpotlightCell key={f.id} fixture={f} prediction={mine?.[f.id]} />)}
      {next.map((f) => <SpotlightCell key={f.id} fixture={f} hidden />)}
    </div>
  );
}

// One decided knockout tie in the playoff-mode spotlight: the team that advanced, who
// it beat, this user's pick correctness and the points earned. `mine` is this user's
// per-fixture data { predictedHome, predictedAway, points }.
function PlayoffSpotlightCell({ fixture, mine }) {
  const { home, away, actualWinner } = fixture;
  const loser = actualWinner === home.team ? away : actualWinner === away.team ? home : null;
  const winnerFlag = actualWinner === home.team ? home.flag : actualWinner === away.team ? away.flag : null;
  const points = mine?.points || 0;
  const picked = mine?.predictedHome ? home.team : mine?.predictedAway ? away.team : null;
  const right = !!picked && picked === actualWinner;
  return (
    <div style={styles.cell}>
      <div style={styles.cellLabel}>{ROUND_LABELS[fixture.round] || fixture.round} · {formatKickoff(fixture.kickoffUtc)}</div>
      <div style={styles.poWinner}>
        {winnerFlag && <span className={`fi fi-${winnerFlag}`} style={styles.cellFlag} aria-hidden="true" />}
        <span style={styles.poWinnerName}>{actualWinner}</span>
        <span style={styles.cellLabel}>vidare</span>
      </div>
      {loser && <div style={styles.poBeat}>slog {loser.team}</div>}
      <div style={styles.cellMeta}>
        <span style={{ ...styles.poPick, ...(right ? styles.poPickRight : styles.poPickWrong) }}>
          {picked ? (right ? '✓ Du tippade rätt' : `✗ Du: ${picked}`) : 'Ingen gissning'}
        </span>
        <span style={{ ...styles.pointsPill, ...(points > 0 ? {} : styles.pointsPillZero) }}>+{points} p</span>
      </div>
    </div>
  );
}

// Playoff-mode per-row strip: the last few decided knockout ties (newest first).
function PlayoffSpotlightStrip({ shared, mine }) {
  if (!shared || shared.length === 0) return null;
  return (
    <div style={styles.strip}>
      {shared.map((f) => <PlayoffSpotlightCell key={f.id} fixture={f} mine={mine?.[f.id]} />)}
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set()); // expanded userIds
  const isMobile = useIsMobile();

  // Background-safe loader: replaces `data` in place so the leaderboard updates
  // live as the admin scores matches, without disturbing the locally-held
  // `expanded` set (keyed by userId, so it survives a refresh).
  const load = useCallback(() => {
    return api.getLeaderboard()
      .then(setData)
      .catch(() => setError('Kunde inte ladda deltagarlistan.'));
  }, []);

  useEffect(() => { load(); }, [load]);
  useAutoRefresh(load, 60000);

  // Prefer the server-assigned rank so the displayed position matches the rank
  // that movement (prevRank → rank) is measured against; fall back to a local
  // comparator only if rank is absent.
  const sortedUsers = data?.users
    ? [...data.users].sort((a, b) =>
        (a.rank != null && b.rank != null
          ? a.rank - b.rank
          : (b.points || 0) - (a.points || 0)
            || (b.predictionCount || 0) - (a.predictionCount || 0)
            || (a.displayName || '').localeCompare(b.displayName || ''))
      )
    : [];

  // Whether any user has earned a badge (drives the badge legend's visibility).
  const hasBadges = sortedUsers.some((u) => u.badges?.length);

  // Whether any user has winner stars (drives the star legend's visibility).
  const hasStars = sortedUsers.some((u) => u.titles > 0);

  // Playoff mode: name links jump straight to the bracket, and each row shows the
  // user's predicted champion flag (picks are public once locked).
  const playoffMode = !!data?.playoffMode;
  const hasChampions = playoffMode && sortedUsers.some((u) => u.champion?.flag);

  // Row expand content (same set for everyone). In playoff mode the strip shows recently
  // decided knockout ties; before any are decided (e.g. scoring on but pre-lock) we fall
  // back to the recent group matches, which are still the latest relevant tips.
  const sp = data?.spotlight;
  const poSpotlight = data?.playoffSpotlight;
  const hasGroupSpotlight = !!sp && ((sp.recent?.length || 0) + (sp.inProgress?.length || 0) + (sp.next?.length || 0)) > 0;
  const usePlayoffStrip = playoffMode && !!poSpotlight && poSpotlight.length > 0;
  const hasSpotlight = usePlayoffStrip || hasGroupSpotlight;

  const allExpanded = sortedUsers.length > 0 && sortedUsers.every((u) => expanded.has(u.userId));

  const toggleRow = (userId) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });

  const toggleAll = () =>
    setExpanded(allExpanded ? new Set() : new Set(sortedUsers.map((u) => u.userId)));

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Trivseltipset · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Aktuell ställning</h1>
        <p style={styles.sub}>
          <a
            href="https://chat.whatsapp.com/FaL9Yh9Ofkd8p5LJTeDib2"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.chatLink}
          >
            💬 Gå med i gruppchatten och snacka VM-tips!
          </a>
        </p>
      </section>

      <div style={styles.page}>
        {error && (
          <p style={{ color: 'var(--danger)', textAlign: 'center', padding: '16px' }}>{error}</p>
        )}

        {data && sortedUsers.length === 0 && (
          <p style={styles.empty}>Inga deltagare registrerade ännu.</p>
        )}

        {sortedUsers.length > 0 && hasSpotlight && (
          <div style={styles.toolbar}>
            <button type="button" style={styles.expandAllBtn} onClick={toggleAll}>
              {usePlayoffStrip
                ? (allExpanded ? 'Dölj senaste slutspelsresultat' : 'Visa senaste slutspelsresultat')
                : (allExpanded ? 'Dölj senaste & kommande tips' : 'Visa senaste & kommande tips')}
            </button>
          </div>
        )}

        {sortedUsers.length > 0 && (
          <div style={styles.list}>
            {sortedUsers.map((u, i) => {
              const points = u.points || 0;
              const isExpanded = expanded.has(u.userId);
              const isMe = !!user && u.userId === user.userId;
              // Movement since yesterday's standing (null on day one, 0 = unchanged).
              const delta = u.prevRank != null ? u.prevRank - u.rank : null;
              return (
                <div key={u.userId || u.displayName + i} style={{ ...styles.row, ...(isMe ? styles.rowMe : {}) }}>
                  <div
                    style={styles.rowTop}
                    role={hasSpotlight ? 'button' : undefined}
                    tabIndex={hasSpotlight ? 0 : undefined}
                    aria-expanded={hasSpotlight ? isExpanded : undefined}
                    onClick={hasSpotlight ? () => toggleRow(u.userId) : undefined}
                    onKeyDown={hasSpotlight ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleRow(u.userId); }
                    } : undefined}
                  >
                    <div style={{ ...styles.rank, ...(i < 3 ? styles.rankTop : {}) }}>{i + 1}</div>
                    <div style={styles.middle}>
                      <div style={styles.nameRow}>
                        <Link
                          to={playoffMode ? `/predictions/${u.userId}?view=playoff` : `/predictions/${u.userId}`}
                          style={styles.nameLink}
                          onClick={(e) => e.stopPropagation()}
                          title={`Visa ${u.displayName}s tips`}
                        >
                          {u.displayName}
                        </Link>
                        {!isMe && (
                          <Link
                            to={`/jamfor/${u.userId}`}
                            style={styles.compareLink}
                            onClick={(e) => e.stopPropagation()}
                            title={`Jämför med ${u.displayName}`}
                            aria-label={`Jämför med ${u.displayName}`}
                          >
                            ⚔️
                          </Link>
                        )}
                        {playoffMode && u.champion?.flag && (
                          <span
                            className={`fi fi-${u.champion.flag}`}
                            style={styles.championFlag}
                            title={`Tippad världsmästare: ${u.champion.team}`}
                            aria-label={`Tippad världsmästare: ${u.champion.team}`}
                          />
                        )}
                        {u.titles > 0 && (
                          <span
                            style={styles.titleStars}
                            title={`${u.titles} tidigare ${u.titles === 1 ? 'seger' : 'segrar'} i Trivseltipset`}
                            aria-label={`${u.titles} tidigare ${u.titles === 1 ? 'seger' : 'segrar'}`}
                          >
                            {u.titles <= 3 ? '⭐'.repeat(u.titles) : `⭐×${u.titles}`}
                          </span>
                        )}
                        {u.badges?.length > 0 && (
                          <span style={styles.badges}>
                            {u.badges.map((b) => {
                              const meta = BADGE_META[b.key];
                              if (!meta) return null;
                              return (
                                <span
                                  key={b.key}
                                  style={styles.badge}
                                  title={`${meta.label} · ${meta.desc} (${b.value})`}
                                  aria-label={meta.label}
                                >
                                  {meta.emoji}
                                </span>
                              );
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={styles.right}>
                      <div style={styles.pointsRow}>
                        {/* Fixed-width slot so a present/absent chip doesn't change
                            the width of `.right` and shift the points column. */}
                        <span style={styles.deltaSlot}>
                          {delta ? (
                            delta > 0
                              ? <span style={{ ...styles.deltaChip, ...styles.deltaUp }} title={`Upp ${delta} sedan igår`}>▲ {delta}</span>
                              : <span style={{ ...styles.deltaChip, ...styles.deltaDown }} title={`Ner ${Math.abs(delta)} sedan igår`}>▼ {Math.abs(delta)}</span>
                          ) : null}
                        </span>
                        <span style={{ ...styles.count, ...styles.countDone }}>{points} p</span>
                      </div>
                      {!isMobile && (
                        <span style={styles.date}>
                          Grupp {u.groupPoints || 0} · Slutspel {u.playoffPoints || 0}
                        </span>
                      )}
                    </div>
                    {hasSpotlight && (
                      <span style={styles.chevron} aria-hidden="true">{isExpanded ? '▴' : '▾'}</span>
                    )}
                  </div>
                  {isExpanded && (usePlayoffStrip
                    ? <PlayoffSpotlightStrip shared={data.playoffSpotlight} mine={u.playoffSpotlight} />
                    : <SpotlightStrip shared={data.spotlight} mine={u.spotlight} />)}
                </div>
              );
            })}
          </div>
        )}

        {(hasStars || hasBadges || hasChampions) && (
          <div style={styles.legend}>
            {hasChampions && (
              <span style={styles.legendItem}>
                🏆 Flagga vid namnet – deltagarens tippade världsmästare
              </span>
            )}
            {hasStars && (
              <span style={styles.legendItem}>
                ⭐ Stjärna – tidigare seger i Trivseltipset
              </span>
            )}
            {hasBadges && Object.values(BADGE_META).map((m) => (
              <span key={m.label} style={styles.legendItem}>
                {m.emoji} {m.label} – {m.desc}
              </span>
            ))}
          </div>
        )}

        {data && (
          <div style={styles.footer}>
            {data.count} deltagare registrerade
          </div>
        )}
      </div>
    </>
  );
}
