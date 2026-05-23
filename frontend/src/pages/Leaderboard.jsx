import { useState, useEffect } from 'react';
import { api } from '../api.js';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('sv-SE', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const styles = {
  page: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  icon: { fontSize: '48px', marginBottom: '12px' },
  title: { fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' },
  count: { color: 'var(--text-muted)', fontSize: '14px' },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '32px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  name: { fontWeight: 600, fontSize: '15px' },
  date: { color: 'var(--text-muted)', fontSize: '12px' },
  divider: {
    borderTop: '1px solid var(--border)',
    paddingTop: '24px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
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

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.icon}>🏆</div>
        <h1 style={styles.title}>Resultattabell</h1>
        {data && (
          <p style={styles.count}>{data.count} {data.count === 1 ? 'deltagare' : 'deltagare'} registrerade</p>
        )}
      </div>

      {error && <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}

      {data && data.users.length > 0 && (
        <div style={styles.list}>
          {data.users.map((u, i) => (
            <div key={i} style={styles.row}>
              <span style={styles.name}>{u.displayName}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: u.predictionCount === 72 ? 'var(--green)' : 'var(--text)' }}>
                  {u.predictionCount} / 72 matcher
                </div>
                <div style={styles.date}>Senast inloggad {formatDate(u.lastLoginAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.divider}>
        Poängtabellen öppnar efter att VM-gruppspelet startar den 11 juni 2026.
      </div>
    </div>
  );
}
