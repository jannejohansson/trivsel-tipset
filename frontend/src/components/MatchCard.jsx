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
  hiddenScore: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  result: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: 'var(--text-muted)',
  },
  points: {
    fontWeight: 800,
    color: 'var(--green)',
    fontVariantNumeric: 'tabular-nums',
  },
};

// `hidden` (read-only views) shows a lock placeholder instead of the score.
// `points`/`actual` (read-only views) show how the prediction scored once the
// match has an official result. The editable/autosave path is unchanged: it runs
// whenever `hidden` is false and an `onPredictionChange` handler is provided.
export default function MatchCard({ match, prediction, locked, onPredictionChange, hidden = false, points = null, actual = null }) {
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
        {hidden ? (
          <span style={styles.hiddenScore} title="Visas vid avspark">🔒 Dolt</span>
        ) : (
          <ScoreInput
            matchId={match.id}
            initial={prediction}
            locked={locked}
            onChange={onPredictionChange}
          />
        )}
        <div style={{ ...styles.team, ...styles.teamAway }}>
          <span className={`fi fi-${match.awayFlag}`} style={styles.flag} aria-hidden="true" />
          <span>{match.awayTeam}</span>
        </div>
      </div>
      {!hidden && actual && (
        <div style={styles.result}>
          <span>Facit {actual.homeScore}–{actual.awayScore}</span>
          {points != null && <span style={styles.points}>{points} p</span>}
        </div>
      )}
      {match.venue && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', opacity: 0.75 }}>
          {match.venue}
        </div>
      )}
    </div>
  );
}
