import { useIsMobile } from '../lib/useIsMobile.js';
import { ROUND_LABELS } from '../lib/bracket.js';

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
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderLeft: '3px solid var(--green)',
  },
  cardMobile: { padding: '8px 10px' },
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '8px',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  round: { fontWeight: 700, color: 'var(--text)', fontSize: '12px' },
  meta: { textAlign: 'right', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  livePill: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    color: 'var(--danger)', fontWeight: 800, fontSize: '10px',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  teamRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '5px 8px',
    borderRadius: '8px',
  },
  teamRowWon: { background: 'var(--green-dim)' },
  teamRowLost: { opacity: 0.55 },
  flag: {
    width: '28px', height: '21px', borderRadius: '3px',
    boxShadow: '0 1px 2px rgba(13,27,42,0.18)', flexShrink: 0,
  },
  flagMobile: { width: '22px', height: '16px' },
  teamName: {
    flex: 1, minWidth: 0, fontSize: '15px', fontWeight: 600, color: 'var(--text)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  teamNameWon: { fontWeight: 800 },
  guessChip: {
    flexShrink: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
    textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px',
    background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)',
  },
  advancedBadge: {
    flexShrink: 0, fontSize: '10px', fontWeight: 800, letterSpacing: '0.5px',
    textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px',
    background: 'var(--green-dim)', color: 'var(--green-text)', border: '1px solid var(--green)',
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
    fontSize: '12px', color: 'var(--text-muted)', paddingTop: '2px',
  },
  points: {
    fontWeight: 800, fontSize: '12px', color: 'var(--green)',
    background: 'var(--green-dim)', border: '1px solid var(--green)',
    borderRadius: '999px', padding: '2px 9px', fontVariantNumeric: 'tabular-nums',
  },
  pointsZero: {
    fontWeight: 700, fontSize: '12px', color: 'var(--text-muted)',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '999px', padding: '2px 9px',
  },
};

// One knockout fixture as seen on the home dashboard during playoff mode. Shows the
// real teams, highlights the team that actually advanced (completed matches), marks
// which side the viewer predicted to go through, and the points it earned.
// `fixture`: { round, kickoffUtc, venue, home:{team,flag}, away:{team,flag}, status,
//   actualWinner, predictedHome, predictedAway, points }.
export default function PlayoffFixtureCard({ fixture }) {
  const isMobile = useIsMobile();
  const flagStyle = isMobile ? { ...styles.flag, ...styles.flagMobile } : styles.flag;
  const { home, away, status, actualWinner, predictedHome, predictedAway } = fixture;
  const done = status === 'completed';

  const teamRow = (team, predicted) => {
    const won = done && actualWinner === team.team;
    const lost = done && actualWinner && actualWinner !== team.team;
    return (
      <div style={{ ...styles.teamRow, ...(won ? styles.teamRowWon : {}), ...(lost ? styles.teamRowLost : {}) }}>
        <span className={`fi fi-${team.flag}`} style={flagStyle} aria-hidden="true" />
        <span style={{ ...styles.teamName, ...(won ? styles.teamNameWon : {}) }}>{team.team}</span>
        {won && <span style={styles.advancedBadge}>Vidare ✓</span>}
        {!won && predicted && <span style={styles.guessChip}>Din gissning</span>}
      </div>
    );
  };

  // Footer wording about the viewer's pick + earned points.
  let pickText;
  if (predictedHome || predictedAway) {
    const pickedTeam = predictedHome ? home.team : away.team;
    pickText = done
      ? (fixture.points > 0 ? `Du tippade ${pickedTeam} vidare` : `Du tippade ${pickedTeam} – föll`)
      : `Du tippade ${pickedTeam} vidare`;
  } else {
    pickText = 'Du tippade ingen av dessa vidare';
  }

  return (
    <div style={{ ...styles.card, ...(isMobile ? styles.cardMobile : {}), ...(done ? {} : { borderLeftColor: 'var(--border)' }) }}>
      <div style={styles.header}>
        <span style={styles.round}>{ROUND_LABELS[fixture.round] || fixture.round}</span>
        <span style={styles.meta}>
          {status === 'inProgress' && <span style={styles.livePill}>● Pågår</span>}
          {status !== 'inProgress' && `${formatKickoff(fixture.kickoffUtc)}${fixture.venue ? ` · ${fixture.venue}` : ''}`}
        </span>
      </div>
      {teamRow(home, predictedHome)}
      {teamRow(away, predictedAway)}
      <div style={styles.footer}>
        <span>{pickText}</span>
        {done && (predictedHome || predictedAway) && (
          <span style={fixture.points > 0 ? styles.points : styles.pointsZero}>
            {fixture.points > 0 ? `+${fixture.points} p` : '0 p'}
          </span>
        )}
      </div>
    </div>
  );
}
