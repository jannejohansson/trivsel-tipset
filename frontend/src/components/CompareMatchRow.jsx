// One match in a head-to-head comparison: the fixture + actual result on top, then the
// two participants' predictions side by side with the points each earned. The higher-
// scoring side is highlighted. Purely presentational; the Compare page joins the data.

const styles = {
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)',
    padding: '12px 14px', marginBottom: '10px',
  },
  head: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  badge: {
    fontSize: '11px', fontWeight: 800, lineHeight: 1, padding: '2px 7px', borderRadius: '999px',
    background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', flexShrink: 0,
  },
  teams: {
    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '7px',
    fontWeight: 700, fontSize: '14px', color: 'var(--text)',
  },
  flag: {
    width: '20px', height: '15px', borderRadius: '2px', flexShrink: 0,
    boxShadow: '0 1px 2px rgba(13,27,42,0.15)',
  },
  teamName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 },
  actual: {
    fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text)',
    background: 'var(--surface-2)', borderRadius: '999px', padding: '2px 10px',
    fontSize: '13px', flexShrink: 0,
  },
  cells: { display: 'flex', gap: '8px' },
  cell: {
    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '8px', background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '8px 10px',
  },
  cellWin: { background: 'var(--green-dim)', borderColor: 'var(--green)' },
  pred: { fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text)', fontSize: '14px' },
  predNone: { color: 'var(--text-muted)', fontWeight: 500, fontStyle: 'italic', fontSize: '13px' },
  pts: {
    fontSize: '12px', fontWeight: 800, padding: '1px 8px', borderRadius: '999px',
    fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', flexShrink: 0,
  },
  ptsPos: { background: 'var(--green)', color: '#fff' },
  ptsZero: { background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' },
};

function predText(p) {
  return p ? `${p.homeScore}–${p.awayScore}` : null;
}

function Cell({ side, win }) {
  const text = predText(side.prediction);
  return (
    <div style={{ ...styles.cell, ...(win ? styles.cellWin : {}) }}>
      {text
        ? <span style={styles.pred}>{text}</span>
        : <span style={styles.predNone}>Inget tips</span>}
      <span style={{ ...styles.pts, ...(side.points > 0 ? styles.ptsPos : styles.ptsZero) }}>
        {side.points > 0 ? `+${side.points}` : '0'} p
      </span>
    </div>
  );
}

export default function CompareMatchRow({ label, home, away, actual, mine, theirs }) {
  // Highlight the side that earned more points on this match (no highlight on a tie).
  const meWin = mine.points > theirs.points;
  const themWin = theirs.points > mine.points;
  return (
    <div style={styles.card}>
      <div style={styles.head}>
        {label && <span style={styles.badge}>{label}</span>}
        <span style={styles.teams}>
          <span className={`fi fi-${home.flag}`} style={styles.flag} aria-hidden="true" />
          <span style={styles.teamName}>{home.team}</span>
          <span style={{ color: 'var(--text-muted)' }}>–</span>
          <span style={styles.teamName}>{away.team}</span>
          <span className={`fi fi-${away.flag}`} style={styles.flag} aria-hidden="true" />
        </span>
        {actual && <span style={styles.actual}>{actual.homeScore}–{actual.awayScore}</span>}
      </div>
      <div style={styles.cells}>
        <Cell side={mine} win={meWin} />
        <Cell side={theirs} win={themWin} />
      </div>
    </div>
  );
}
