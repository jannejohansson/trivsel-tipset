import ScoreInput from './ScoreInput.jsx';

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
    boxShadow: 'var(--shadow-card)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderLeft: '3px solid var(--green)',
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
    gap: '10px',
    fontSize: '14px',
    fontWeight: 600,
    flex: 1,
    color: 'var(--text)',
  },
  teamAway: {
    justifyContent: 'flex-end',
    flexDirection: 'row-reverse',
  },
  flag: {
    width: '28px',
    height: '21px',
    borderRadius: '3px',
    boxShadow: '0 1px 2px rgba(13,27,42,0.18)',
    flexShrink: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  matchday: {
    background: 'var(--green-dim)',
    color: '#0b6b32',
    fontWeight: 700,
    fontSize: '10px',
    letterSpacing: '0.5px',
    padding: '2px 8px',
    borderRadius: '999px',
    textTransform: 'uppercase',
  },
};

export default function MatchCard({ match, prediction, locked, onPredictionChange }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.matchday}>MD{match.matchday}</span>
        <span>{formatKickoff(match.kickoffUtc)}</span>
      </div>
      <div style={styles.teams}>
        <div style={styles.team}>
          <span className={`fi fi-${match.homeFlag}`} style={styles.flag} aria-hidden="true" />
          <span>{match.homeTeam}</span>
        </div>
        <ScoreInput
          matchId={match.id}
          initial={prediction}
          locked={locked}
          onChange={onPredictionChange}
        />
        <div style={{ ...styles.team, ...styles.teamAway }}>
          <span className={`fi fi-${match.awayFlag}`} style={styles.flag} aria-hidden="true" />
          <span>{match.awayTeam}</span>
        </div>
      </div>
      {match.venue && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.75 }}>
          {match.venue}
        </div>
      )}
    </div>
  );
}
