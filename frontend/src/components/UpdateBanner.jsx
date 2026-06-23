import { useState } from 'react';
import useVersionCheck from '../hooks/useVersionCheck.js';

const styles = {
  bar: {
    position: 'fixed',
    left: '16px',
    right: '16px',
    bottom: '16px',
    zIndex: 1000,
    margin: '0 auto',
    maxWidth: '520px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'var(--surface)',
    color: 'var(--text)',
    border: '1px solid var(--accent)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-card)',
    padding: '12px 14px',
    fontSize: '14px',
  },
  text: { flex: 1, lineHeight: 1.35 },
  reload: {
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '8px 14px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dismiss: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
    fontSize: '20px',
    lineHeight: 1,
    cursor: 'pointer',
    padding: '0 4px',
  },
};

// Shows a dismissible banner when a newer frontend build has been deployed while
// this tab stayed open, so users on a long-lived tab don't keep running stale code.
// We never auto-reload — a reload could discard input the user is in the middle of.
export default function UpdateBanner() {
  const updateAvailable = useVersionCheck();
  const [dismissed, setDismissed] = useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div style={styles.bar} role="status">
      <span style={styles.text}>
        En ny version av Trivseltipset finns. Ladda om för att uppdatera.
      </span>
      <button style={styles.reload} onClick={() => window.location.reload()}>
        Ladda om
      </button>
      <button
        style={styles.dismiss}
        onClick={() => setDismissed(true)}
        aria-label="Stäng"
      >
        ×
      </button>
    </div>
  );
}
