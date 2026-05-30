import { useState, useEffect } from 'react';
import { KICKOFF_TS } from '../lib/constants.js';

function pad(n) { return String(n).padStart(2, '0'); }

function getRemaining() {
  const diff = KICKOFF_TS - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs };
}

const styles = {
  wrap: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    margin: '32px 0',
    flexWrap: 'wrap',
  },
  unit: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '70px',
  },
  num: {
    fontSize: '48px',
    fontWeight: 700,
    lineHeight: 1,
    color: 'var(--green)',
    fontVariantNumeric: 'tabular-nums',
  },
  label: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
};

export default function Countdown() {
  const [rem, setRem] = useState(getRemaining);

  useEffect(() => {
    const id = setInterval(() => setRem(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!rem) return <p style={{ color: 'var(--yellow)', textAlign: 'center' }}>VM 2026 har startat! 🎉</p>;

  return (
    <div style={styles.wrap}>
      {[['dagar', rem.days], ['timmar', pad(rem.hours)], ['minuter', pad(rem.mins)], ['sekunder', pad(rem.secs)]].map(([label, val]) => (
        <div key={label} style={styles.unit}>
          <span style={styles.num}>{val}</span>
          <span style={styles.label}>{label}</span>
        </div>
      ))}
    </div>
  );
}
