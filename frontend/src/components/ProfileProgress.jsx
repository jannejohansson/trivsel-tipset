// Compact personal points-progression chart for the Profile page. One vertex per played
// match (cumulative points). Plots three lines — you, the current leader, and the field
// average — so you can see where you stand, with a comparison summary below. Single SVG,
// no charting deps, sized for the narrow mobile-first profile column.
// Props: points (number[] = me), leaderPoints (number[]), avgPoints (number[]),
//        ranks (number[] same length, 1-based), total, isLeader (bool).

const COLORS = {
  me: 'var(--green)',
  leader: 'var(--yellow)',
  avg: 'var(--text-muted)',
};

const styles = {
  wrap: { marginTop: '4px' },
  svg: { display: 'block', width: '100%', height: 'auto' },
  legend: {
    display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center',
    marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)',
  },
  legendItem: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  swatch: { width: '12px', height: '3px', borderRadius: '2px', flexShrink: 0 },
  stats: {
    display: 'flex', gap: '8px', marginTop: '12px',
  },
  stat: {
    flex: 1, background: 'var(--surface-2)', borderRadius: 'var(--radius)',
    padding: '10px 6px', textAlign: 'center',
  },
  statMe: { background: 'var(--green-dim)' },
  statLabel: {
    fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.4px', marginBottom: '2px',
  },
  statNum: { fontSize: '20px', fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 },
  statNumMe: { color: 'var(--green)' },
  statSub: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  empty: {
    color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center',
    padding: '12px 0', lineHeight: 1.5,
  },
};

export default function ProfileProgress({ points, leaderPoints, avgPoints, ranks, total, isLeader }) {
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
  const lead = leaderPoints || [];
  const avg = avgPoints || [];
  // Y-axis spans every plotted series so no line clips.
  const all = [...points, ...lead, ...avg];
  const max = Math.max(1, ...all);
  const min = Math.min(...all);
  const span = max - min || 1;

  const x = (i) => (n === 1 ? pad.left + plotW / 2 : pad.left + (plotW * i) / (n - 1));
  const y = (v) => pad.top + plotH - ((v - min) / span) * plotH;
  const path = (arr) => arr.map((p, i) => `${x(i)},${y(p)}`).join(' ');

  const lastX = x(n - 1);
  const lastY = y(points[n - 1]);

  const current = points[n - 1] || 0;
  const currentRank = ranks?.[n - 1] ?? null;
  const leaderNow = lead.length ? lead[lead.length - 1] : null;
  const avgNow = avg.length ? Math.round(avg[avg.length - 1]) : null;
  const gap = leaderNow != null ? leaderNow - current : null;

  return (
    <div style={styles.wrap}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={styles.svg}
        role="img"
        aria-label="Din poängutveckling jämfört med ledaren och snittet"
      >
        {/* field average — dashed, muted */}
        {avg.length > 0 && (
          <polyline points={path(avg)} fill="none" stroke={COLORS.avg} strokeWidth="1.5"
            strokeDasharray="3 3" opacity="0.7" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {/* current leader — gold (skipped when that's me, to avoid drawing over my line) */}
        {!isLeader && lead.length > 0 && (
          <polyline points={path(lead)} fill="none" stroke={COLORS.leader} strokeWidth="1.5"
            opacity="0.85" strokeLinejoin="round" strokeLinecap="round" />
        )}
        {/* me — green, bold, with an end dot */}
        <polyline points={path(points)} fill="none" stroke={COLORS.me} strokeWidth="2.5"
          strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lastX} cy={lastY} r="3.5" fill={COLORS.me} />
      </svg>

      <div style={styles.legend}>
        <span style={styles.legendItem}><span style={{ ...styles.swatch, background: COLORS.me }} /> Du</span>
        {!isLeader && <span style={styles.legendItem}><span style={{ ...styles.swatch, background: COLORS.leader }} /> Ledare</span>}
        <span style={styles.legendItem}>
          <span style={{ ...styles.swatch, background: COLORS.avg }} /> Snitt
        </span>
      </div>

      <div style={styles.stats}>
        <div style={{ ...styles.stat, ...styles.statMe }}>
          <div style={styles.statLabel}>Du</div>
          <div style={{ ...styles.statNum, ...styles.statNumMe }}>{current}</div>
          {currentRank != null && <div style={styles.statSub}>#{currentRank}{total ? `/${total}` : ''}</div>}
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Ledare</div>
          <div style={styles.statNum}>{isLeader ? current : (leaderNow ?? '–')}</div>
          <div style={styles.statSub}>
            {isLeader ? 'det är du 🏆' : gap != null ? (gap > 0 ? `${gap} p efter` : 'i nivå') : ''}
          </div>
        </div>
        <div style={styles.stat}>
          <div style={styles.statLabel}>Snitt</div>
          <div style={styles.statNum}>{avgNow ?? '–'}</div>
          {avgNow != null && <div style={styles.statSub}>{current >= avgNow ? `+${current - avgNow} över` : `${avgNow - current} under`}</div>}
        </div>
      </div>
    </div>
  );
}
