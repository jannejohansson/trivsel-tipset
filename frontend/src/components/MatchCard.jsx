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
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderLeft: '3px solid var(--green)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    color: 'var(--text-muted)',
  },
  // Symmetric layout: equal flexible halves around a fixed centre keep the score
  // boxes pinned to the card's centre in EVERY row (locked, open, with/without a
  // result), so they line up vertically. The result lives in the right reserved
  // column; an equal-width empty column on the left preserves the symmetry.
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
  },
  side: { width: '220px', flexShrink: 0 },
  sideResult: {
    width: '220px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
  },
  half: { flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '10px' },
  teamName: {
    flex: 1,
    minWidth: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  center: { flexShrink: 0 },
  openCue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: 'var(--green)',
    fontWeight: 700,
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
  lockedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
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
  resultLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  // Actual result in grey boxes the same height as the prediction boxes.
  resultBox: {
    width: '36px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 700,
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
  },
  resultDash: { color: 'var(--text-muted)', fontSize: '16px', fontWeight: 300 },
  points: {
    fontWeight: 800,
    fontSize: '13px',
    color: 'var(--green)',
    background: 'var(--green-dim)',
    border: '1px solid var(--green)',
    borderRadius: '999px',
    padding: '3px 10px',
    fontVariantNumeric: 'tabular-nums',
  },
};

// `hidden` (read-only views) shows a lock placeholder instead of the score.
// `points`/`actual` (read-only views) show how the prediction scored once the
// match has an official result. The editable/autosave path is unchanged: it runs
// whenever `hidden` is false and an `onPredictionChange` handler is provided.
export default function MatchCard({ match, prediction, locked, onPredictionChange, hidden = false, points = null, actual = null }) {
  // `editable` is the live /matches tipping view (a change handler is wired up);
  // read-only views (e.g. UserPredictions) pass none and show results plainly.
  const editable = !!onPredictionChange;
  const dimmed = editable && locked;
  const hasResult = !hidden && !!actual;

  return (
    <div style={dimmed ? { ...styles.card, opacity: 0.6, borderLeftColor: 'var(--border)' } : styles.card}>
      <div style={styles.header}>
        {editable && !locked ? (
          <span style={styles.openCue}>🔓 Kan ändras till avspark</span>
        ) : locked ? (
          <span style={styles.lockedPill}>🔒 Låst</span>
        ) : (
          <span />
        )}
        <span>{formatKickoff(match.kickoffUtc)}</span>
      </div>
      <div style={styles.row}>
        <div style={styles.side} />
        <div style={{ ...styles.half, justifyContent: 'flex-end' }}>
          <span style={{ ...styles.teamName, textAlign: 'right' }}>{match.homeTeam}</span>
          <span className={`fi fi-${match.homeFlag}`} style={styles.flag} aria-hidden="true" />
        </div>
        <div style={styles.center}>
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
        </div>
        <div style={{ ...styles.half, justifyContent: 'flex-start' }}>
          <span className={`fi fi-${match.awayFlag}`} style={styles.flag} aria-hidden="true" />
          <span style={{ ...styles.teamName, textAlign: 'left' }}>{match.awayTeam}</span>
        </div>
        <div style={styles.sideResult}>
          {hasResult && (
            <>
              <span style={styles.resultLabel}>Resultat</span>
              <span style={styles.resultBox}>{actual.homeScore}</span>
              <span style={styles.resultDash}>–</span>
              <span style={styles.resultBox}>{actual.awayScore}</span>
              {points != null && <span style={styles.points}>{points} p</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
