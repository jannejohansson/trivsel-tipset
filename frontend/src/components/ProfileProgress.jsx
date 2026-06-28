// Compact personal points-progression sparkline for the Profile page. One vertex per
// played match (cumulative points). Unlike LeaderboardChart this is single-series and
// sized for the narrow, mobile-first profile column, so no charting deps / no scroll.
// Props: points (number[] cumulative), ranks (number[] same length, 1-based), total.

const styles = {
  wrap: { marginTop: '4px' },
  svg: { display: 'block', width: '100%', height: 'auto' },
  caption: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginTop: '10px',
    fontSize: '13px',
    color: 'var(--text-muted)',
  },
  capNum: { color: 'var(--text)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  empty: {
    color: 'var(--text-muted)',
    fontSize: '13px',
    textAlign: 'center',
    padding: '12px 0',
    lineHeight: 1.5,
  },
};

export default function ProfileProgress({ points, ranks, total }) {
  if (!points || points.length === 0) {
    return (
      <p style={styles.empty}>
        Din utveckling visas här när de första resultaten är inlagda.
      </p>
    );
  }

  const W = 320;
  const H = 96;
  const pad = { top: 8, right: 8, bottom: 8, left: 8 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const n = points.length;
  const max = Math.max(1, ...points);
  const min = Math.min(...points);
  const span = max - min || 1;

  const x = (i) => (n === 1 ? pad.left + plotW / 2 : pad.left + (plotW * i) / (n - 1));
  const y = (v) => pad.top + plotH - ((v - min) / span) * plotH;

  const line = points.map((p, i) => `${x(i)},${y(p)}`).join(' ');
  const lastX = x(n - 1);
  const lastY = y(points[n - 1]);

  const current = points[n - 1] || 0;
  const currentRank = ranks?.[n - 1] ?? null;
  const bestRank = ranks?.length ? Math.min(...ranks) : null;

  return (
    <div style={styles.wrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={styles.svg}
        role="img"
        aria-label="Din poängutveckling match för match"
      >
        {/* soft fill under the line */}
        <polygon
          points={`${pad.left},${pad.top + plotH} ${line} ${lastX},${pad.top + plotH}`}
          fill="var(--green-dim)"
          opacity="0.6"
        />
        <polyline
          points={line}
          fill="none"
          stroke="var(--green)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lastX} cy={lastY} r="3.5" fill="var(--green)" />
      </svg>
      <div style={styles.caption}>
        <span>Poäng nu: <span style={styles.capNum}>{current}</span></span>
        {currentRank != null && (
          <span>
            Placering: <span style={styles.capNum}>#{currentRank}{total ? `/${total}` : ''}</span>
            {bestRank != null && bestRank < currentRank && (
              <span> · bästa #{bestRank}</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
