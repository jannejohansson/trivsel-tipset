import { useState, useEffect, useRef } from 'react';
import { api } from '../api.js';

const styles = {
  wrap: { display: 'flex', alignItems: 'center', gap: '8px' },
  input: {
    width: '48px',
    height: '40px',
    textAlign: 'center',
    fontSize: '18px',
    fontWeight: 700,
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    outline: 'none',
  },
  dash: {
    color: 'var(--text-muted)',
    fontSize: '20px',
    fontWeight: 300,
  },
  indicator: {
    fontSize: '14px',
    minWidth: '16px',
  },
};

export default function ScoreInput({ matchId, initial, locked, onChange }) {
  const [home, setHome] = useState(initial?.homeScore ?? '');
  const [away, setAway] = useState(initial?.awayScore ?? '');
  const [status, setStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const timerRef = useRef(null);

  useEffect(() => {
    setHome(initial?.homeScore ?? '');
    setAway(initial?.awayScore ?? '');
  }, [initial]);

  const save = (h, a) => {
    if (h === '' || a === '') return;
    const hn = parseInt(h, 10);
    const an = parseInt(a, 10);
    if (isNaN(hn) || isNaN(an)) return;
    clearTimeout(timerRef.current);
    setStatus('saving');
    timerRef.current = setTimeout(async () => {
      try {
        await api.savePrediction(matchId, hn, an);
        setStatus('saved');
        onChange?.({ homeScore: hn, awayScore: an });
        setTimeout(() => setStatus(null), 2000);
      } catch {
        setStatus('error');
        setTimeout(() => setStatus(null), 3000);
      }
    }, 600);
  };

  const handleChange = (setter, other, isHome) => (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setter(val);
    const newH = isHome ? val : home;
    const newA = isHome ? away : val;
    save(newH, newA);
  };

  if (locked) {
    return (
      <div style={styles.wrap}>
        <span style={{ ...styles.input, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}>
          {home !== '' ? home : '–'}
        </span>
        <span style={styles.dash}>–</span>
        <span style={{ ...styles.input, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'var(--text-muted)' }}>
          {away !== '' ? away : '–'}
        </span>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <input
        style={styles.input}
        type="number"
        min="0"
        max="20"
        value={home}
        onChange={handleChange(setHome, away, true)}
        placeholder="–"
      />
      <span style={styles.dash}>–</span>
      <input
        style={styles.input}
        type="number"
        min="0"
        max="20"
        value={away}
        onChange={handleChange(setAway, home, false)}
        placeholder="–"
      />
      <span style={styles.indicator} title={status}>
        {status === 'saving' && '⏳'}
        {status === 'saved' && '✅'}
        {status === 'error' && '❌'}
      </span>
    </div>
  );
}
