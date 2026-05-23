import { useState } from 'react';
import ScoreInput from './ScoreInput.jsx';

function flagEmoji(code) {
  if (!code) return '';
  // Handle special codes like 'gb-eng'
  const c = code.split('-')[0].toUpperCase();
  return [...c].map(ch => String.fromCodePoint(0x1F1E6 + ch.charCodeAt(0) - 65)).join('');
}

function formatKickoff(utc) {
  return new Date(utc).toLocaleString('sv-SE', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZoneName: 'short',
  });
}

const styles = {
  card: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  teams: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'space-between',
  },
  team: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: 600,
    flex: 1,
  },
  teamAway: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  flag: { fontSize: '20px' },
};

export default function MatchCard({ match, locked }) {
  const [prediction, setPrediction] = useState(match.prediction || null);

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span>{formatKickoff(match.kickoffUtc)}</span>
        <span style={{ opacity: 0.6, fontSize: '11px' }}>{match.venue}</span>
      </div>
      <div style={styles.teams}>
        <div style={styles.team}>
          <span style={styles.flag}>{flagEmoji(match.homeFlag)}</span>
          <span>{match.homeTeam}</span>
        </div>
        <ScoreInput
          matchId={match.id}
          initial={prediction}
          locked={locked}
          onChange={(pred) => setPrediction(pred)}
        />
        <div style={{ ...styles.team, ...styles.teamAway }}>
          <span style={styles.flag}>{flagEmoji(match.awayFlag)}</span>
          <span>{match.awayTeam}</span>
        </div>
      </div>
    </div>
  );
}
