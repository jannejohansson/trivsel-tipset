import { useState, useEffect } from 'react';

const styles = {
  box: {
    background: 'rgba(184,134,11,0.10)',
    border: '1px solid rgba(184,134,11,0.35)',
    color: 'var(--text)',
    borderRadius: 'var(--radius)',
    padding: '12px 16px',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  strong: { fontWeight: 800 },
};

function formatDeadline(date) {
  return date.toLocaleString('sv-SE', {
    day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}

// Builds "3 dygn 4 tim 12 min" from a millisecond span, dropping leading zero units.
function formatRemaining(ms) {
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} dygn`);
  if (days > 0 || hours > 0) parts.push(`${hours} tim`);
  parts.push(`${mins} min`);
  return parts.join(' ');
}

// Live countdown to the playoff lock deadline. Renders nothing once the deadline
// has passed (the parent then shows the locked banner instead).
export default function LockCountdown({ lockoutUtc }) {
  const target = new Date(lockoutUtc).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const remaining = target - now;
  if (!lockoutUtc || isNaN(target) || remaining <= 0) return null;

  return (
    <div style={styles.box}>
      🔒 Slutspelstipsen låses om <span style={styles.strong}>{formatRemaining(remaining)}</span>
      {' '}({formatDeadline(new Date(target))}). Därefter kan du inte ändra dina val.
    </div>
  );
}
