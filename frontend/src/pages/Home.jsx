import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import MatchCard from '../components/MatchCard.jsx';
import PlayoffFixtureCard from '../components/PlayoffFixtureCard.jsx';
import { TOTAL_MATCHES, TOTAL_PLAYOFF } from '../lib/constants.js';

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
  page: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  section: {
    marginBottom: '32px',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: 'var(--text)',
    margin: 0,
  },
  sectionLink: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--green)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  placeCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '9px 14px',
    marginBottom: '24px',
    textDecoration: 'none',
    color: 'inherit',
  },
  placeText: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '6px',
    minWidth: 0,
    flexWrap: 'wrap',
  },
  placeLabel: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  placeRankNum: {
    fontSize: '15px',
    fontWeight: 800,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
  },
  placeOf: {
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  placeRight: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  deltaChip: {
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '999px',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  deltaUp: { background: 'var(--green-dim)', color: 'var(--green-text)' },
  deltaDown: { background: 'rgba(220,38,38,0.10)', color: 'var(--danger)' },
  deltaSame: { background: 'var(--surface-2)', color: 'var(--text-muted)' },
  placeSince: {
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  notice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    background: 'rgba(184,134,11,0.10)',
    border: '1px solid rgba(184,134,11,0.35)',
    color: 'var(--text)',
    borderRadius: 'var(--radius)',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '16px',
    textDecoration: 'none',
  },
  noticeStrong: {
    background: 'rgba(184,134,11,0.16)',
    borderColor: 'rgba(184,134,11,0.6)',
    fontWeight: 600,
  },
  noticeLocked: {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: 'var(--radius)',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '16px',
  },
  noticeText: { minWidth: 0 },
  noticeCta: {
    color: 'var(--green)',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  // Celebratory champion-reveal banner shown once the bracket locks.
  reveal: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'linear-gradient(135deg, rgba(21,163,74,0.16), rgba(184,134,11,0.16))',
    border: '1px solid var(--green)',
    borderRadius: 'var(--radius)',
    padding: '14px 16px',
    marginBottom: '16px',
    textDecoration: 'none',
    color: 'var(--text)',
  },
  revealEmoji: { fontSize: '22px', flexShrink: 0, lineHeight: 1 },
  revealBody: { minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  revealTitle: { fontWeight: 800, fontSize: '15px', color: 'var(--text)' },
  revealSub: { fontSize: '13px', color: 'var(--text-muted)' },
  revealCta: { color: 'var(--green)', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 },
  revealClose: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '17px',
    lineHeight: 1,
    padding: '4px',
    flexShrink: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  qualGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  qualChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text)',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '999px',
    padding: '4px 11px 4px 8px',
  },
  qualChipThrough: {
    background: 'var(--green-dim)',
    borderColor: 'var(--green)',
    color: 'var(--green-text)',
  },
  qualChipOut: { opacity: 0.5 },
  qualFlag: {
    width: '20px', height: '15px', borderRadius: '2px', flexShrink: 0,
    boxShadow: '0 1px 2px rgba(13,27,42,0.18)',
  },
  qualCount: {
    fontSize: '13px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
  },
  empty: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-card)',
    padding: '20px 16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  emptyLink: {
    display: 'inline-block',
    marginTop: '10px',
    color: 'var(--green)',
    fontWeight: 700,
    textDecoration: 'none',
  },
  status: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    padding: '60px 20px',
  },
  error: {
    textAlign: 'center',
    color: 'var(--danger)',
    padding: '60px 20px',
  },
};

// Day bucket key in Swedish local time (Europe/Stockholm), independent of the
// viewer's browser timezone. sv-SE formats as 'YYYY-MM-DD', so string equality
// is a safe same-day test.
const dayKey = (d) =>
  new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);

// The user's current leaderboard placement, with movement since yesterday when
// there's a prior standing to compare against (prevRank is null on day one).
function PlacementCard({ rank, total, prevRank }) {
  const delta = prevRank != null ? prevRank - rank : null; // >0 climbed, <0 dropped
  return (
    <Link to="/leaderboard" style={styles.placeCard}>
      <span style={styles.placeText}>
        <span style={styles.placeLabel}>Din placering</span>
        <span style={styles.placeRankNum}>#{rank}</span>
        <span style={styles.placeOf}>av {total}</span>
      </span>
      {delta != null && (
        <span style={styles.placeRight}>
          {delta > 0 && <span style={{ ...styles.deltaChip, ...styles.deltaUp }}>▲ {delta}</span>}
          {delta < 0 && <span style={{ ...styles.deltaChip, ...styles.deltaDown }}>▼ {Math.abs(delta)}</span>}
          {delta === 0 && <span style={{ ...styles.deltaChip, ...styles.deltaSame }}>oförändrad</span>}
          <span style={styles.placeSince}>sedan igår</span>
        </span>
      )}
    </Link>
  );
}

// localStorage key remembering that the user has seen (and dismissed) the one-time
// champion-reveal banner that appears when the knockout bracket locks.
const CHAMP_REVEAL_KEY = 'championRevealSeen';

// One-time celebratory banner: once the bracket locks (match 73 kickoff), everyone's
// predicted world champion becomes public. Links to "Vad tippar andra?"; dismissal is
// remembered so it only nags once.
function ChampionRevealBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(CHAMP_REVEAL_KEY) === '1'; } catch { return false; }
  });
  if (dismissed) return null;
  const close = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.setItem(CHAMP_REVEAL_KEY, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };
  return (
    <Link to="/vad-tippar-andra" style={styles.reveal}>
      <span style={styles.revealEmoji} aria-hidden="true">🏆</span>
      <span style={styles.revealBody}>
        <span style={styles.revealTitle}>Slutspelet är igång!</span>
        <span style={styles.revealSub}>Allas tippade världsmästare är nu avslöjade.</span>
      </span>
      <span style={styles.revealCta}>Se allas tips →</span>
      <button type="button" style={styles.revealClose} onClick={close} aria-label="Dölj">✕</button>
    </Link>
  );
}

// A clickable reminder banner nudging the user to finish their predictions.
// `strong` gives the playoff reminder extra visual weight.
function NoticeLink({ to, strong, children }) {
  return (
    <Link to={to} style={{ ...styles.notice, ...(strong ? styles.noticeStrong : {}) }}>
      <span style={styles.noticeText}>{children}</span>
      <span style={styles.noticeCta}>Tippa →</span>
    </Link>
  );
}

// A muted card prompting the user onward when a section has nothing to show.
function EmptyState({ children, to = '/matches', cta = 'Till alla tips →' }) {
  return (
    <div style={styles.empty}>
      <div>{children}</div>
      <Link to={to} style={styles.emptyLink}>{cta}</Link>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [standing, setStanding] = useState(null); // { rank, total, prevRank }
  // "Today"/"tomorrow" in Swedish local time, captured once on mount.
  const [{ todayKey, tomorrowKey }] = useState(() => {
    const now = Date.now();
    return { todayKey: dayKey(new Date(now)), tomorrowKey: dayKey(new Date(now + 86400000)) };
  });

  useEffect(() => {
    if (!user) return; // AuthGuard guarantees a user, but guard the auth-refresh race
    api.getUserPredictions(user.userId) // isSelf ⇒ full reveal + server-computed points
      .then((d) => { setData(d); setError(null); })
      .catch(() => setError('Kunde inte ladda din översikt.'));
  }, [user]);

  // Placement is best-effort: a leaderboard hiccup must not blank the dashboard.
  useEffect(() => {
    if (!user) return;
    api.getLeaderboard()
      .then((lb) => {
        const me = (lb.users || []).find((u) => u.userId === user.userId);
        if (me) setStanding({ rank: me.rank, total: lb.count, prevRank: me.prevRank ?? null });
      })
      .catch(() => { /* best-effort */ });
  }, [user]);

  if (error) return <div style={styles.error}>{error}</div>;
  if (!data) return <div style={styles.status}>Laddar...</div>;

  const matches = data.matches || [];
  const keyOf = (m) => dayKey(new Date(m.kickoffUtc));
  // Chronological by actual kickoff time — match numbers don't always follow the
  // schedule (same-day matches can kick off out of number order).
  const byKickoff = (a, b) => new Date(a.kickoffUtc) - new Date(b.kickoffUtc);

  // Three states per match:
  //   past        – admin has reported a result (m.actual)
  //   in progress – kicked off (m.locked) but no result yet
  //   upcoming    – not kicked off and no result → still editable
  // Last three completed matches (newest first), with predicted score, result and points.
  const recent = matches
    .filter((m) => m.actual)
    .sort((a, b) => byKickoff(b, a))
    .slice(0, 3);

  // In progress: kicked off, awaiting an admin result. Shown locked, not editable.
  const inProgress = matches.filter((m) => m.locked && !m.actual).sort(byKickoff);

  // Upcoming and editable: today's and tomorrow's matches merged into one
  // chronological list (Swedish-local kickoff day).
  const editable = matches.filter((m) => !m.locked && !m.actual);
  const upcoming = editable
    .filter((m) => keyOf(m) === todayKey || keyOf(m) === tomorrowKey)
    .sort(byKickoff);
  const groupStageOver = matches.length > 0 && matches.every((m) => m.locked);

  // Reminders to finish predicting. Group matches lock individually at kickoff, so
  // split unpredicted ones into still-tippable vs already-kicked-off (locked — can no
  // longer be tipped). Playoff picks all lock together at the bracket lockout.
  // Mirrors the notices on the Tippa page so the landing page nudges the same gaps.
  const groupPredicted = matches.filter((m) => m.prediction).length;
  const groupOpenRemaining = matches.filter((m) => !m.locked && !m.prediction).length;
  const groupMissed = matches.filter((m) => m.locked && !m.prediction).length;
  const playoffPicks = data.playoff ? data.playoff.matches.filter((m) => m.pick).length : 0;
  const playoffRemaining = Math.max(0, TOTAL_PLAYOFF - playoffPicks);
  // Playoff picks stay editable until the bracket lockout (match 73 kickoff), even when
  // playoff display mode is already on — so the "finish your bracket" nudge tracks the
  // lock (mirrors the Tippa page), not the display switch.
  const playoffOpen = !data.playoffLocked;

  // Playoff display mode: the dashboard switches from group scorelines to knockout
  // advancement (on once the admin enables scoring, or at the lockout time).
  const playoffMode = !!data.playoffMode;
  const pFixtures = data.playoffFixtures || [];
  const pCompleted = pFixtures.filter((f) => f.status === 'completed').sort((a, b) => byKickoff(b, a)).slice(0, 6);
  const pInProgress = pFixtures.filter((f) => f.status === 'inProgress').sort(byKickoff);
  const pUpcomingAll = pFixtures.filter((f) => f.status === 'upcoming').sort(byKickoff);
  // Prefer today's/tomorrow's knockout games; if there's a gap day, fall back to the next two.
  const pUpcomingSoon = pUpcomingAll.filter((f) => keyOf(f) === todayKey || keyOf(f) === tomorrowKey);
  const pUpcoming = pUpcomingSoon.length ? pUpcomingSoon : pUpcomingAll.slice(0, 2);
  // The teams this user predicted to reach the Round of 32 (qualify from the groups).
  const pR32 = data.playoffR32 || [];
  const pR32Through = pR32.filter((t) => t.qualified).length;
  const pR32HasResult = pR32.some((t) => t.qualified);

  // Push an edited scoreline into local state so the bracket/derived views stay
  // in sync; the actual save is handled (debounced) inside ScoreInput.
  const handlePredictionChange = (matchId, pred) =>
    setData((prev) => prev && ({
      ...prev,
      matches: prev.matches.map((m) => (m.id === matchId ? { ...m, prediction: pred } : m)),
    }));

  // Editable today/tomorrow card (the match is upcoming — not kicked off, no result).
  const editableCard = (m) => (
    <MatchCard
      key={m.id}
      match={m}
      prediction={m.prediction}
      locked={m.locked}
      onPredictionChange={(pred) => handlePredictionChange(m.id, pred)}
    />
  );

  // In-progress card: kicked off, awaiting result. Locked (static boxes + 🔒 padlock).
  const inProgressCard = (m) => (
    <MatchCard key={m.id} match={m} prediction={m.prediction} locked />
  );

  const displayName = user?.displayName || '';

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Trivseltipset · FIFA World Cup 2026</div>
        <h1 style={styles.title}>{displayName ? `Hej ${displayName}!` : 'Välkommen'}</h1>
        <p style={styles.sub}>
          {playoffMode
            ? 'Slutspelet – dina lag i matcherna och hur det går'
            : 'Din översikt – senaste resultat och dagens matcher'}
        </p>
      </section>

      <div style={styles.page}>
        {/* Din placering */}
        {standing && <PlacementCard rank={standing.rank} total={standing.total} prevRank={standing.prevRank} />}

        {/* Slutspelet har låsts – allas mästartips avslöjade (visas en gång) */}
        {data.playoffLocked && <ChampionRevealBanner />}

        {/* Påminnelser om att tippa klart – slutspelet först (lättast att missa). */}
        {playoffOpen && playoffRemaining > 0 && (
          <NoticeLink to="/slutspel" strong>
            ⚠ Du har tippat {playoffPicks} av {TOTAL_PLAYOFF} slutspelsval – {playoffRemaining} kvar. Tippa klart slutspelet!
          </NoticeLink>
        )}
        {!groupStageOver && groupOpenRemaining > 0 && (
          <NoticeLink to="/matches">
            ⚠ Du har tippat {groupPredicted} av {TOTAL_MATCHES} gruppspelsmatcher – {groupOpenRemaining} kvar att tippa.
          </NoticeLink>
        )}
        {!groupStageOver && groupMissed > 0 && (
          <div style={styles.noticeLocked}>
            🔒 {groupMissed} {groupMissed === 1 ? 'gruppspelsmatch' : 'gruppspelsmatcher'} har redan startat och kan inte längre tippas.
          </div>
        )}

        {playoffMode ? (
          <>
            {/* Senaste slutspelsresultat */}
            <section style={styles.section}>
              <div style={styles.sectionHead}>
                <h2 style={styles.sectionTitle}>Senaste slutspelsresultat</h2>
                <Link to="/leaderboard" style={styles.sectionLink}>Ställning →</Link>
              </div>
              {pCompleted.length > 0 ? (
                <div style={styles.list}>
                  {pCompleted.map((f) => <PlayoffFixtureCard key={f.id} fixture={f} />)}
                </div>
              ) : (
                <EmptyState to="/slutspel" cta="Till slutspelet →">
                  Inga avgjorda slutspelsmatcher ännu. Håll utkik här när slutspelet drar igång!
                </EmptyState>
              )}
            </section>

            {/* Pågående slutspelsmatcher */}
            {pInProgress.length > 0 && (
              <section style={styles.section}>
                <div style={styles.sectionHead}>
                  <h2 style={styles.sectionTitle}>Pågående</h2>
                </div>
                <div style={styles.list}>
                  {pInProgress.map((f) => <PlayoffFixtureCard key={f.id} fixture={f} />)}
                </div>
              </section>
            )}

            {/* Kommande slutspelsmatcher */}
            <section style={styles.section}>
              <div style={styles.sectionHead}>
                <h2 style={styles.sectionTitle}>Kommande slutspelsmatcher</h2>
              </div>
              {pUpcoming.length > 0 ? (
                <div style={styles.list}>
                  {pUpcoming.map((f) => <PlayoffFixtureCard key={f.id} fixture={f} />)}
                </div>
              ) : (
                <EmptyState to="/slutspel" cta="Till slutspelet →">
                  Inga fler slutspelsmatcher med kända lag just nu.
                </EmptyState>
              )}
            </section>

            {/* Dina lag till sextondelsfinalen (gruppspelets kval enligt dina tips) */}
            {pR32.length > 0 && (
              <section style={styles.section}>
                <div style={styles.sectionHead}>
                  <h2 style={styles.sectionTitle}>Dina lag till sextondelsfinalen</h2>
                  {pR32HasResult && (
                    <span style={styles.qualCount}>{pR32Through}/{pR32.length} vidare</span>
                  )}
                </div>
                <div style={styles.qualGrid}>
                  {pR32.map((t) => (
                    <span
                      key={t.team}
                      style={{
                        ...styles.qualChip,
                        ...(t.qualified ? styles.qualChipThrough : pR32HasResult ? styles.qualChipOut : {}),
                      }}
                      title={pR32HasResult ? (t.qualified ? `${t.team} – vidare` : `${t.team} – utslagen`) : t.team}
                    >
                      <span className={`fi fi-${t.flag}`} style={styles.qualFlag} aria-hidden="true" />
                      {t.team}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
        {/* Senaste resultat */}
        <section style={styles.section}>
          <div style={styles.sectionHead}>
            <h2 style={styles.sectionTitle}>Senaste resultat</h2>
            <Link to="/leaderboard" style={styles.sectionLink}>Ställning →</Link>
          </div>
          {recent.length > 0 ? (
            <div style={styles.list}>
              {recent.map((m) => (
                <MatchCard key={m.id} match={m} prediction={m.prediction} actual={m.actual} points={m.points} locked />
              ))}
            </div>
          ) : (
            <EmptyState>Inga avgjorda matcher ännu. Håll utkik här när matcherna börjar spelas!</EmptyState>
          )}
        </section>

        {/* Pågående matcher (avspark passerad, inväntar resultat) */}
        {inProgress.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHead}>
              <h2 style={styles.sectionTitle}>Pågående</h2>
            </div>
            <div style={styles.list}>
              {inProgress.map(inProgressCard)}
            </div>
          </section>
        )}

        {/* Kommande matcher att tippa (idag + imorgon, kronologiskt) */}
        {upcoming.length > 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHead}>
              <h2 style={styles.sectionTitle}>Kommande matcher</h2>
            </div>
            <div style={styles.list}>
              {upcoming.map(editableCard)}
            </div>
          </section>
        )}

        {/* Inget kvar att tippa idag eller imorgon */}
        {upcoming.length === 0 && (
          <section style={styles.section}>
            <div style={styles.sectionHead}>
              <h2 style={styles.sectionTitle}>Kommande matcher</h2>
            </div>
            {groupStageOver ? (
              <EmptyState to="/slutspel" cta="Till slutspelet →">
                Gruppspelet är klart – dags att tippa slutspelet!
              </EmptyState>
            ) : (
              <EmptyState>Inga matcher att tippa idag eller imorgon. Passa på att fylla i kommande omgångar.</EmptyState>
            )}
          </section>
        )}
          </>
        )}
      </div>
    </>
  );
}
