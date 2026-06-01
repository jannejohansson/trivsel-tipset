import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import LeaderboardChart from '../components/LeaderboardChart.jsx';

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
  viewToggle: {
    display: 'inline-flex',
    gap: '4px',
    marginTop: '18px',
    padding: '4px',
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '999px',
  },
  viewBtn: {
    border: 'none',
    background: 'transparent',
    color: 'rgba(255,255,255,0.85)',
    fontSize: '14px',
    fontWeight: 600,
    padding: '8px 18px',
    borderRadius: '999px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  viewBtnActive: {
    background: '#ffffff',
    color: 'var(--text)',
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
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    textDecoration: 'underline',
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
  pointsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '7px',
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
  deltaUp: { background: 'var(--green-dim)', color: '#0b6b32' },
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
  progressTrack: {
    height: '6px',
    background: 'var(--surface-2)',
    borderRadius: '999px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #15a34a, #58c46f)',
    borderRadius: '999px',
    transition: 'width 0.3s',
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
    color: '#0b6b32',
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

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set()); // expanded userIds
  const [view, setView] = useState('standings'); // 'standings' | 'history'
  const [history, setHistory] = useState(null); // lazy-loaded { checkpoints, series }
  const [historyError, setHistoryError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    api.getLeaderboard()
      .then(setData)
      .catch(() => setError('Kunde inte ladda deltagarlistan.'));
  }, []);

  // Fetch the history series only the first time the user opens the chart view.
  useEffect(() => {
    if (view !== 'history' || history) return;
    api.getLeaderboardHistory()
      .then(setHistory)
      .catch(() => setHistoryError('Kunde inte ladda poängutvecklingen.'));
  }, [view, history]);

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

  // The progress bar now visualises scored points relative to the current
  // leader, rather than how many matches a user has filled in.
  const maxPoints = sortedUsers.reduce((m, u) => Math.max(m, u.points || 0), 0);

  // Whether there are any spotlight fixtures to reveal (same set for everyone).
  const sp = data?.spotlight;
  const hasSpotlight = !!sp && ((sp.recent?.length || 0) + (sp.inProgress?.length || 0) + (sp.next?.length || 0)) > 0;

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
        <div style={styles.viewToggle} role="tablist" aria-label="Visningsläge">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'standings'}
            style={{ ...styles.viewBtn, ...(view === 'standings' ? styles.viewBtnActive : {}) }}
            onClick={() => setView('standings')}
          >
            Ställning
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'history'}
            style={{ ...styles.viewBtn, ...(view === 'history' ? styles.viewBtnActive : {}) }}
            onClick={() => setView('history')}
          >
            Utveckling
          </button>
        </div>
      </section>

      <div style={styles.page}>
        {error && (
          <p style={{ color: 'var(--danger)', textAlign: 'center', padding: '16px' }}>{error}</p>
        )}

        {view === 'history' && (
          historyError
            ? <p style={{ color: 'var(--danger)', textAlign: 'center', padding: '16px' }}>{historyError}</p>
            : history
              ? <LeaderboardChart checkpoints={history.checkpoints} series={history.series} />
              : <p style={styles.empty}>Laddar poängutveckling…</p>
        )}

        {view === 'standings' && data && sortedUsers.length === 0 && (
          <p style={styles.empty}>Inga deltagare registrerade ännu.</p>
        )}

        {view === 'standings' && sortedUsers.length > 0 && hasSpotlight && (
          <div style={styles.toolbar}>
            <button type="button" style={styles.expandAllBtn} onClick={toggleAll}>
              {allExpanded ? 'Dölj senaste & kommande tips' : 'Visa senaste & kommande tips'}
            </button>
          </div>
        )}

        {view === 'standings' && sortedUsers.length > 0 && (
          <div style={styles.list}>
            {sortedUsers.map((u, i) => {
              const points = u.points || 0;
              const pct = maxPoints > 0 ? Math.min(100, (points / maxPoints) * 100) : 0;
              const isExpanded = expanded.has(u.userId);
              // Movement since yesterday's standing (null on day one, 0 = unchanged).
              const delta = u.prevRank != null ? u.prevRank - u.rank : null;
              return (
                <div key={u.userId || u.displayName + i} style={styles.row}>
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
                          to={`/predictions/${u.userId}`}
                          style={styles.nameLink}
                          onClick={(e) => e.stopPropagation()}
                          title={`Visa ${u.displayName}s tips`}
                        >
                          {u.displayName}
                        </Link>
                      </div>
                      <div style={styles.progressTrack} title={`${points} poäng`}>
                        <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                      </div>
                    </div>
                    <div style={styles.right}>
                      <div style={styles.pointsRow}>
                        {delta ? (
                          delta > 0
                            ? <span style={{ ...styles.deltaChip, ...styles.deltaUp }} title={`Upp ${delta} sedan igår`}>▲ {delta}</span>
                            : <span style={{ ...styles.deltaChip, ...styles.deltaDown }} title={`Ner ${Math.abs(delta)} sedan igår`}>▼ {Math.abs(delta)}</span>
                        ) : null}
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
                  {isExpanded && <SpotlightStrip shared={data.spotlight} mine={u.spotlight} />}
                </div>
              );
            })}
          </div>
        )}

        {view === 'standings' && data && (
          <div style={styles.footer}>
            {data.count} deltagare registrerade
          </div>
        )}
      </div>
    </>
  );
}
