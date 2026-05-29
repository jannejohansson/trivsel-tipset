import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const TOTAL_MATCHES = 72;
const TOTAL_PLAYOFF = 31; // 31 knockout matches predicted (R32→final); the bronze match isn't tipped

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
    maxWidth: '720px',
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
    alignItems: 'center',
    gap: '14px',
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
  chevron: {
    color: 'var(--text-muted)',
    fontSize: '18px',
    flexShrink: 0,
    marginLeft: '-4px',
  },
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
  name: {
    fontWeight: 700,
    fontSize: '15px',
    color: 'var(--text)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chips: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
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
    fontSize: '13px',
    fontWeight: 700,
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
};

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getLeaderboard()
      .then(setData)
      .catch(() => setError('Kunde inte ladda deltagarlistan.'));
  }, []);

  const sortedUsers = data?.users
    ? [...data.users].sort((a, b) =>
        (b.points || 0) - (a.points || 0)
        || (b.predictionCount || 0) - (a.predictionCount || 0)
        || (a.displayName || '').localeCompare(b.displayName || '')
      )
    : [];

  // The progress bar now visualises scored points relative to the current
  // leader, rather than how many matches a user has filled in.
  const maxPoints = sortedUsers.reduce((m, u) => Math.max(m, u.points || 0), 0);

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Trivseltipset · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Aktuell ställning</h1>
        {data && (
          <p style={styles.sub}>{data.count} deltagare registrerade</p>
        )}
      </section>

      <div style={styles.page}>
        {error && (
          <p style={{ color: 'var(--danger)', textAlign: 'center', padding: '16px' }}>{error}</p>
        )}

        {data && sortedUsers.length === 0 && (
          <p style={styles.empty}>Inga deltagare registrerade ännu.</p>
        )}

        {sortedUsers.length > 0 && (
          <div style={styles.list}>
            {sortedUsers.map((u, i) => {
              const groupCount = u.groupPredictionCount ?? u.predictionCount ?? 0;
              const playoffCount = u.playoffPredictionCount || 0;
              const groupDone = groupCount >= TOTAL_MATCHES;
              const playoffDone = playoffCount >= TOTAL_PLAYOFF;
              const points = u.points || 0;
              const pct = maxPoints > 0 ? Math.min(100, (points / maxPoints) * 100) : 0;
              return (
                <Link key={u.userId || u.displayName + i} to={`/predictions/${u.userId}`} style={styles.row}>
                  <div style={{ ...styles.rank, ...(i < 3 ? styles.rankTop : {}) }}>{i + 1}</div>
                  <div style={styles.middle}>
                    <span style={styles.name}>{u.displayName}</span>
                    <div style={styles.progressTrack} title={`${points} poäng`}>
                      <div style={{ ...styles.progressFill, width: `${pct}%` }} />
                    </div>
                    <div style={styles.chips}>
                      <span style={{ ...styles.chip, ...(groupDone ? styles.chipDone : styles.chipWarn) }}>
                        {groupDone ? '✓' : '⚠'} Gruppspel {groupCount}/{TOTAL_MATCHES}
                      </span>
                      <span style={{ ...styles.chip, ...(playoffDone ? styles.chipDone : styles.chipWarn) }}>
                        {playoffDone ? '✓' : '⚠'} Slutspel {playoffCount}/{TOTAL_PLAYOFF}
                      </span>
                    </div>
                  </div>
                  <div style={styles.right}>
                    <span style={{ ...styles.count, ...styles.countDone }}>{points} p</span>
                    <span style={styles.date}>
                      Grupp {u.groupPoints || 0} · Slutspel {u.playoffPoints || 0}
                    </span>
                  </div>
                  <span style={styles.chevron} aria-hidden="true">›</span>
                </Link>
              );
            })}
          </div>
        )}

        <div style={styles.footer}>
          Poängställningen uppdateras löpande under VM-gruppspelet från 11 juni 2026.
        </div>
      </div>
    </>
  );
}
