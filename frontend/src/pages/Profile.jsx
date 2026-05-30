import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';
import { KICKOFF_TS, TOTAL_MATCHES, TOTAL_PLAYOFF } from '../lib/constants.js';

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
    color: '#0b6b32',
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
    color: '#0b6b32',
  },
  chipWarn: {
    background: 'rgba(184,134,11,0.14)',
    color: 'var(--yellow)',
    border: '1px solid rgba(184,134,11,0.35)',
  },
  standRow: {
    display: 'flex',
    gap: '12px',
  },
  standBox: {
    flex: 1,
    background: 'var(--surface-2)',
    borderRadius: 'var(--radius)',
    padding: '14px',
    textAlign: 'center',
  },
  standNum: {
    fontSize: '26px',
    fontWeight: 800,
    color: 'var(--green)',
    lineHeight: 1.1,
    fontVariantNumeric: 'tabular-nums',
  },
  standLabel: {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px',
  },
  breakdown: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    textAlign: 'center',
    marginTop: '12px',
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
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState(null);

  // Lock state is fixed for the session, so capture it once on mount.
  const [locked] = useState(() => Date.now() >= KICKOFF_TS);

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
        });
      })
      .catch(() => { /* stats are best-effort */ });
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

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Min profil</h1>
      <p style={styles.sub}>Ditt visningsnamn syns för alla i resultattabellen.</p>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Visningsnamn</div>
        {locked ? (
          <>
            <div style={styles.lockedName}>{user.displayName}</div>
            <p style={styles.lockedNote}>Namnet är låst eftersom VM har startat.</p>
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
            <p style={styles.hint}>Max 30 tecken. Kan ändras fram till första avsparken.</p>
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

      <div style={styles.card}>
        <div style={styles.cardTitle}>Konto</div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>E-post</span>
          <span style={styles.infoValue}>{user.email}</span>
        </div>
        <div style={{ ...styles.infoRow, borderTop: '1px solid var(--border)' }}>
          <span style={styles.infoLabel}>Tips ifyllda</span>
          <div style={styles.chips}>
            <span style={{ ...styles.chip, ...(groupDone ? styles.chipDone : styles.chipWarn) }}>
              {groupDone ? '✓' : '⚠'} Gruppspel {stats?.groupCount ?? 0}/{TOTAL_MATCHES}
            </span>
            <span style={{ ...styles.chip, ...(playoffDone ? styles.chipDone : styles.chipWarn) }}>
              {playoffDone ? '✓' : '⚠'} Slutspel {stats?.playoffCount ?? 0}/{TOTAL_PLAYOFF}
            </span>
          </div>
        </div>
      </div>

      {locked && stats && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Min ställning</div>
          <div style={styles.standRow}>
            <div style={styles.standBox}>
              <div style={styles.standNum}>
                {stats.position ? `${stats.position}` : '–'}
                <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {stats.position ? ` / ${stats.total}` : ''}
                </span>
              </div>
              <div style={styles.standLabel}>Placering</div>
            </div>
            <div style={styles.standBox}>
              <div style={styles.standNum}>{stats.points}</div>
              <div style={styles.standLabel}>Poäng</div>
            </div>
          </div>
          <p style={styles.breakdown}>
            Grupp {stats.groupPoints} · Slutspel {stats.playoffPoints}
          </p>
        </div>
      )}

      <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
        Logga ut
      </button>
    </div>
  );
}
