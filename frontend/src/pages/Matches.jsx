import { useState, useEffect } from 'react';
import { api } from '../api.js';
import GroupTabs from '../components/GroupTabs.jsx';
import LockBanner from '../components/LockBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const styles = {
  page: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '4px',
  },
  sub: {
    color: 'var(--text-muted)',
    fontSize: '14px',
  },
  error: {
    color: 'var(--danger)',
    padding: '16px',
    background: 'rgba(248, 81, 73, 0.1)',
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
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gruppspel – VM 2026</h1>
        <p style={styles.sub}>
          {locked
            ? 'Tipsen är låsta.'
            : `Inloggad som ${user?.displayName} · Tips sparas automatiskt`}
        </p>
      </div>

      {locked && <LockBanner />}

      <GroupTabs matches={matches} locked={locked} />
    </div>
  );
}
