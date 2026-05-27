import { useState, useEffect } from 'react';
import { api } from '../api.js';
import GroupTabs from '../components/GroupTabs.jsx';
import LockBanner from '../components/LockBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

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
  error: {
    color: 'var(--danger)',
    padding: '16px',
    background: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 'var(--radius)',
    textAlign: 'center',
  },
};

export default function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getMatches()
      .then(data => {
        setMatches(data.matches);
        setLocked(data.locked);
      })
      .catch(() => setError('Kunde inte ladda matcher. Försök igen.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ ...styles.page, textAlign: 'center', paddingTop: '80px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Laddar matcher...</span>
      </div>
    );
  }

  if (error) {
    return <div style={styles.page}><p style={styles.error}>{error}</p></div>;
  }

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Gruppspel · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Dina tips</h1>
        <p style={styles.sub}>
          {locked
            ? 'Tipsen är låsta.'
            : `${user?.displayName || user?.email} · sparas automatiskt`}
        </p>
      </section>

      <div style={styles.page}>
        {locked && <LockBanner />}
        <GroupTabs matches={matches} locked={locked} />
      </div>
    </>
  );
}
