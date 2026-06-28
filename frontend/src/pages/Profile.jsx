import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { api } from '../api.js';
import { KICKOFF_TS, NAME_LOCKOUT_TS, TOTAL_MATCHES, TOTAL_PLAYOFF } from '../lib/constants.js';
import { ACHIEVEMENTS } from '../lib/achievements.js';
import { useIsMobile } from '../lib/useIsMobile.js';
import ProfileProgress from '../components/ProfileProgress.jsx';

const styles = {
  page: {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '40px 20px 60px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px',
    color: 'var(--text)',
  },
  sub: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    marginBottom: '28px',
  },
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-card)',
    padding: '20px',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  hint: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    marginTop: '-4px',
  },
  btn: {
    padding: '12px',
    background: 'var(--green)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '15px',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    color: 'var(--danger)',
    fontSize: '13px',
    padding: '10px 14px',
    background: 'rgba(220, 38, 38, 0.1)',
    border: '1px solid rgba(220, 38, 38, 0.3)',
    borderRadius: 'var(--radius)',
  },
  success: {
    color: 'var(--green-text)',
    fontSize: '13px',
    padding: '10px 14px',
    background: 'var(--green-dim)',
    border: '1px solid rgba(21,163,74,0.3)',
    borderRadius: 'var(--radius)',
  },
  lockedName: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text)',
  },
  lockedNote: {
    color: 'var(--yellow)',
    fontSize: '13px',
    marginTop: '8px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
  },
  infoLabel: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  infoValue: {
    color: 'var(--text)',
    fontSize: '14px',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chips: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 10px',
    borderRadius: '999px',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap',
  },
  chipDone: {
    background: 'var(--green-dim)',
    color: 'var(--green-text)',
  },
  chipWarn: {
    background: 'rgba(184,134,11,0.14)',
    color: 'var(--yellow)',
    border: '1px solid rgba(184,134,11,0.35)',
  },
  chipUnpaid: {
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
    border: '1px solid var(--border)',
  },
  breakdown: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '12px',
  },
  achRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 0',
    borderBottom: '1px solid var(--border)',
  },
  achLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    minWidth: 0,
  },
  achEmoji: {
    fontSize: '17px',
    lineHeight: 1,
    flexShrink: 0,
  },
  achLabel: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text)',
  },
  achVals: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    flexShrink: 0,
    textAlign: 'right',
  },
  achMine: {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
  },
  achMineLead: {
    color: 'var(--green)',
  },
  achLeader: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    fontVariantNumeric: 'tabular-nums',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '180px',
  },
  logoutBtn: {
    width: '100%',
    padding: '12px',
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  // ── Theme switch ─────────────────────────────────────────
  themeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  themeLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text)',
    fontSize: '14px',
    fontWeight: 600,
  },
  switch: {
    position: 'relative',
    width: '46px',
    height: '26px',
    flexShrink: 0,
    borderRadius: '999px',
    border: '1px solid var(--border)',
    background: 'var(--surface-2)',
    cursor: 'pointer',
    padding: 0,
    transition: 'background 0.15s, border-color 0.15s',
  },
  switchOn: {
    background: 'var(--green)',
    borderColor: 'transparent',
  },
  switchKnob: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '20px',
    height: '20px',
    borderRadius: '999px',
    background: '#ffffff',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
    transition: 'transform 0.15s',
  },
  switchKnobOn: {
    transform: 'translateX(20px)',
  },
};

// Mirror the sort used on the leaderboard so a user's position here matches there.
function sortUsers(users) {
  return [...users].sort((a, b) =>
    (b.points || 0) - (a.points || 0)
    || (b.predictionCount || 0) - (a.predictionCount || 0)
    || (a.displayName || '').localeCompare(b.displayName || '')
  );
}

export default function Profile() {
  const { user, loading, refresh, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState(null); // { points[], leaderPoints[], avgPoints[], ranks[], total, isLeader }
  const isMobile = useIsMobile();

  // Lock state is fixed for the session, so capture it once on mount.
  // The tournament-started flag gates stats; the name lock lingers a few days.
  const [locked] = useState(() => Date.now() >= KICKOFF_TS);
  const [nameLocked] = useState(() => Date.now() >= NAME_LOCKOUT_TS);
  const nameLockLabel = new Date(NAME_LOCKOUT_TS).toLocaleString('sv-SE', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });

  useEffect(() => {
    if (user) setDisplayName(user.displayName || '');
  }, [user]);

  useEffect(() => {
    let active = true;
    api.getLeaderboard()
      .then((data) => {
        if (!active || !user) return;
        const sorted = sortUsers(data.users || []);
        const idx = sorted.findIndex(u => u.userId === user.userId);
        const me = idx >= 0 ? sorted[idx] : null;
        setStats({
          total: data.count ?? sorted.length,
          position: idx >= 0 ? idx + 1 : null,
          groupCount: me?.groupPredictionCount ?? me?.predictionCount ?? 0,
          playoffCount: me?.playoffPredictionCount ?? 0,
          points: me?.points ?? 0,
          groupPoints: me?.groupPoints ?? 0,
          playoffPoints: me?.playoffPoints ?? 0,
          paid: me?.paid ?? false,
          achievements: me?.achievements ?? null,
          achievementLeaders: data.achievementLeaders ?? null,
        });
      })
      .catch(() => { /* stats are best-effort */ });
    return () => { active = false; };
  }, [user]);

  // Personal points progression vs. the field: my cumulative-points series, the current
  // leader's series, and the field average at each checkpoint, plus my rank. Best-effort.
  useEffect(() => {
    if (!user) return undefined;
    let active = true;
    api.getLeaderboardHistory()
      .then((h) => {
        if (!active) return;
        const series = h.series || [];
        const mine = series.find((s) => s.userId === user.userId);
        if (!mine || mine.points.length === 0) { setProgress(null); return; }
        const n = mine.points.length;
        // The leader is the series with the most points at the final checkpoint
        // (getLeaderboardHistory already sorts highest-final-total first).
        const leader = series[0];
        const isLeader = leader.userId === user.userId;
        // Field average + my rank at each checkpoint.
        const avgPoints = [];
        const ranks = [];
        for (let i = 0; i < n; i++) {
          const sum = series.reduce((acc, s) => acc + (s.points[i] || 0), 0);
          avgPoints.push(series.length ? sum / series.length : 0);
          ranks.push(1 + series.filter((s) => (s.points[i] || 0) > (mine.points[i] || 0)).length);
        }
        setProgress({
          points: mine.points,
          leaderPoints: leader.points,
          avgPoints,
          ranks,
          total: series.length,
          isLeader,
        });
      })
      .catch(() => { /* best-effort */ });
    return () => { active = false; };
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) return;
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      await api.updateProfile(name);
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const groupDone = (stats?.groupCount ?? 0) >= TOTAL_MATCHES;
  const playoffDone = (stats?.playoffCount ?? 0) >= TOTAL_PLAYOFF;

  // Derived figures for the progression card (Swedish decimal comma).
  const mp = progress?.points;
  const avgPerMatch = mp?.length ? (mp[mp.length - 1] / mp.length).toFixed(1).replace('.', ',') : null;
  const exactCount = stats?.achievements?.exact ?? null;

  // Desktop lays the cards out in two columns to cut scrolling; mobile stays single column.
  const pageStyle = { ...styles.page, maxWidth: isMobile ? '480px' : '880px' };
  const cardStyle = { ...styles.card, marginBottom: isMobile ? '16px' : 0 };
  const gridStyle = isMobile
    ? undefined
    : { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' };

  // A "–" for missing/non-positive values; signed categories only count moves in their
  // direction — Raketen (signed) shows climbs as +N, Ankaret (down) shows drops as -N.
  const fmtAch = (v, a) =>
    v == null ? '–'
      : a.signed ? (v > 0 ? `+${v}` : '–')
      : a.down ? (v > 0 ? `-${v}` : '–')
      : `${v}`;

  return (
    <div style={pageStyle}>
      <h1 style={styles.title}>Min profil</h1>
      <p style={styles.sub}>Ditt visningsnamn syns för alla i resultattabellen.</p>

      <div style={gridStyle}>
      <div style={cardStyle}>
        <div style={styles.cardTitle}>Visningsnamn</div>
        {nameLocked ? (
          <>
            <div style={styles.lockedName}>{user.displayName}</div>
            <p style={styles.lockedNote}>Namnet är låst sedan {nameLockLabel}.</p>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={styles.form}>
            {error && <p style={styles.error}>{error}</p>}
            {saved && <p style={styles.success}>Visningsnamnet har sparats.</p>}
            <input
              style={styles.input}
              type="text"
              maxLength={30}
              placeholder="Ditt namn"
              value={displayName}
              onChange={e => { setDisplayName(e.target.value); setSaved(false); }}
              required
            />
            <p style={styles.hint}>Max 30 tecken. Du kan ändra namnet fram till {nameLockLabel}.</p>
            <button
              type="submit"
              style={{ ...styles.btn, ...(submitting ? styles.btnDisabled : {}) }}
              disabled={submitting}
            >
              {submitting ? 'Sparar...' : 'Spara'}
            </button>
          </form>
        )}
      </div>

      <div style={cardStyle}>
        <div style={styles.cardTitle}>Tema</div>
        <div style={styles.themeRow}>
          <span style={styles.themeLabel}>
            <span aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
            Mörkt läge
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Mörkt läge"
            style={{ ...styles.switch, ...(isDark ? styles.switchOn : {}) }}
            onClick={toggle}
          >
            <span style={{ ...styles.switchKnob, ...(isDark ? styles.switchKnobOn : {}) }} />
          </button>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={styles.cardTitle}>Konto</div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>E-post</span>
          <span style={styles.infoValue}>{user.email}</span>
        </div>
        <div style={{ ...styles.infoRow, borderTop: '1px solid var(--border)' }}>
          <div style={styles.chips}>
            <span style={{ ...styles.chip, ...(groupDone ? styles.chipDone : styles.chipWarn) }}>
              {groupDone ? '✓' : '⚠'} Gruppspel {stats?.groupCount ?? 0}/{TOTAL_MATCHES}
            </span>
            <span style={{ ...styles.chip, ...(playoffDone ? styles.chipDone : styles.chipWarn) }}>
              {playoffDone ? '✓' : '⚠'} Slutspel {stats?.playoffCount ?? 0}/{TOTAL_PLAYOFF}
            </span>
            <span style={{ ...styles.chip, ...(stats?.paid ? styles.chipDone : styles.chipUnpaid) }}>
              {stats?.paid ? '✓ Betalat' : 'Ej betalat'}
            </span>
          </div>
        </div>
      </div>

      {locked && (
        <div style={cardStyle}>
          <div style={styles.cardTitle}>Min utveckling</div>
          <ProfileProgress
            points={progress?.points}
            leaderPoints={progress?.leaderPoints}
            avgPoints={progress?.avgPoints}
            ranks={progress?.ranks}
            total={progress?.total}
            isLeader={progress?.isLeader}
          />
          {avgPerMatch != null && (
            <p style={styles.breakdown}>
              Snitt {avgPerMatch} p/match{exactCount != null ? ` · ${exactCount} exakta resultat` : ''}
            </p>
          )}
        </div>
      )}

      {locked && stats?.achievements && (
        <div style={cardStyle}>
          <div style={styles.cardTitle}>Utmärkelser</div>
          {ACHIEVEMENTS.map((a, i) => {
            const mine = stats.achievements[a.field];
            const leader = stats.achievementLeaders?.[a.key];
            const leaderIsMe = !!leader && leader.userIds.includes(user.userId);
            const leaderText = leader
              ? `${leaderIsMe ? 'Du' : leader.names[0]}${leader.names.length > 1 ? ' m.fl.' : ''} · ${fmtAch(leader.value, a)}`
              : 'Ingen ännu';
            return (
              <div
                key={a.key}
                style={{ ...styles.achRow, ...(i === ACHIEVEMENTS.length - 1 ? { borderBottom: 'none' } : {}) }}
                title={a.desc}
              >
                <span style={styles.achLeft}>
                  <span style={styles.achEmoji} aria-hidden="true">{a.emoji}</span>
                  <span style={styles.achLabel}>{a.label}</span>
                </span>
                <div style={styles.achVals}>
                  <span style={{ ...styles.achMine, ...(leaderIsMe ? styles.achMineLead : {}) }}>
                    Du {fmtAch(mine, a)}
                  </span>
                  <span style={styles.achLeader}>🏆 {leaderText}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
        Logga ut
      </button>
    </div>
  );
}
