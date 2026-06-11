import { useState } from 'react';
import { useIsMobile } from '../lib/useIsMobile.js';

// Custom SVG line chart of cumulative points per participant, one vertex per played
// match so the climb shows match by match. The x-axis is labelled by stage (Omg 1-3,
// 16-del .. Final), not per match, to stay readable. All participants are drawn equally;
// hovering/tapping a line or a legend chip highlights one and dims the rest. No charting
// library — matches the app's zero-UI-deps approach.

const styles = {
  wrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-card)',
    padding: '16px',
    marginBottom: '24px',
  },
  caption: {
    minHeight: '22px',
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--text)',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  captionHint: { fontWeight: 500, color: 'var(--text-muted)', fontSize: '13px' },
  swatch: { width: '12px', height: '12px', borderRadius: '3px', flexShrink: 0 },
  scroll: { overflowX: 'auto' },
  svg: { display: 'block', height: 'auto' },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '14px',
    paddingTop: '14px',
    borderTop: '1px solid var(--border)',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 8px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '999px',
    fontSize: '12px',
    color: 'var(--text)',
    cursor: 'pointer',
    lineHeight: 1.2,
  },
  empty: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '14px',
    padding: '48px 16px',
    lineHeight: 1.6,
  },
};

const colorFor = (i, n) => `hsl(${Math.round((i * 360) / Math.max(n, 1))}, 65%, 50%)`;

// Pick ~4 rounded gridline values between 0 and max.
function yTicks(max) {
  if (max <= 0) return [0];
  const steps = 4;
  const raw = max / steps;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.max(1, Math.ceil(raw / mag) * mag);
  const ticks = [];
  for (let v = 0; v <= max + 0.001; v += step) ticks.push(v);
  return ticks;
}

// Contiguous runs of the same stage, for x-axis labels + separators.
function stageSpans(checkpoints) {
  const spans = [];
  checkpoints.forEach((c, i) => {
    const last = spans[spans.length - 1];
    if (last && last.stage === c.stage) last.end = i;
    else spans.push({ stage: c.stage, start: i, end: i });
  });
  return spans;
}

export default function LeaderboardChart({ checkpoints, series }) {
  const isMobile = useIsMobile();
  const [active, setActive] = useState(null); // highlighted userId or null

  if (!checkpoints || checkpoints.length === 0) {
    return (
      <div style={styles.wrap}>
        <p style={styles.empty}>
          Utvecklingen visas här när VM har börjat och de första resultaten är inlagda.
          <br />
          Då ser du hur deltagarnas poäng växer match för match.
        </p>
      </div>
    );
  }

  const n = checkpoints.length;
  // Widen the canvas as matches accumulate so vertices don't bunch up; scroll if needed.
  const W = Math.max(900, n * (isMobile ? 14 : 10));
  const H = isMobile ? 360 : 460;
  const m = { top: 20, right: 16, bottom: 44, left: 40 };
  const plotW = W - m.left - m.right;
  const plotH = H - m.top - m.bottom;

  const maxPoints = Math.max(1, ...series.flatMap((s) => s.points.map((p) => Number(p) || 0)));
  const ticks = yTicks(maxPoints);
  const spans = stageSpans(checkpoints);
  const showDots = n <= 24; // only annotate individual matches when the field is sparse

  const x = (i) => (n === 1 ? m.left + plotW / 2 : m.left + (plotW * i) / (n - 1));
  const y = (v) => m.top + plotH - ((Number(v) || 0) / maxPoints) * plotH;

  const activeSeries = active != null ? series.find((s) => s.userId === active) : null;

  return (
    <div style={styles.wrap}>
      <div style={styles.caption}>
        {activeSeries ? (
          <>
            <span style={{ ...styles.swatch, background: colorFor(series.indexOf(activeSeries), series.length) }} />
            {activeSeries.displayName}
            <span style={styles.captionHint}>
              · {activeSeries.points[activeSeries.points.length - 1] || 0} p
            </span>
          </>
        ) : (
          <span style={styles.captionHint}>
            Poängutveckling match för match — peka på en linje eller ett namn för att markera.
          </span>
        )}
      </div>

      <div style={styles.scroll}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ ...styles.svg, width: '100%', minWidth: W > 900 ? W * 0.6 : undefined }}
          role="img"
          aria-label="Diagram över deltagarnas poängutveckling"
        >
          {/* y gridlines + value labels */}
          {ticks.map((t) => (
            <g key={`t${t}`}>
              <line x1={m.left} y1={y(t)} x2={W - m.right} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
              <text x={m.left - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
                {t}
              </text>
            </g>
          ))}

          {/* stage separators + centred stage labels */}
          {spans.map((sp, si) => (
            <g key={`${sp.stage}-${si}`}>
              {si > 0 && (
                <line
                  x1={(x(sp.start) + x(sp.start - 1)) / 2}
                  y1={m.top}
                  x2={(x(sp.start) + x(sp.start - 1)) / 2}
                  y2={m.top + plotH}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              )}
              <text
                x={(x(sp.start) + x(sp.end)) / 2}
                y={H - m.bottom + 22}
                textAnchor="middle"
                fontSize="12"
                fill="var(--text-muted)"
              >
                {sp.stage}
              </text>
            </g>
          ))}

          {/* one line per participant */}
          {series.map((s, idx) => {
            const color = colorFor(idx, series.length);
            const isActive = active === s.userId;
            const dim = active != null && !isActive;
            const pts = s.points.map((p, i) => `${x(i)},${y(p)}`).join(' ');
            const onEnter = () => setActive(s.userId);
            const onLeave = () => setActive((cur) => (cur === s.userId ? null : cur));
            return (
              <g
                key={s.userId || idx}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
                onClick={() => setActive((cur) => (cur === s.userId ? null : s.userId))}
                onFocus={onEnter}
                tabIndex={0}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                {/* wide transparent hit target for easy hover/tap */}
                <polyline points={pts} fill="none" stroke="transparent" strokeWidth="14" />
                <polyline
                  points={pts}
                  fill="none"
                  stroke={color}
                  strokeWidth={isActive ? 3 : 1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={dim ? 0.12 : isActive ? 1 : 0.55}
                />
                {/* dots only when sparse, or on the active line, or with a single match */}
                {(showDots || isActive || n === 1) &&
                  s.points.map((p, i) => <circle key={i} cx={x(i)} cy={y(p)} r={isActive ? 3.5 : 2.5} fill={color} />)}
              </g>
            );
          })}
        </svg>
      </div>

      <div style={styles.legend}>
        {series.map((s, idx) => {
          const color = colorFor(idx, series.length);
          const isActive = active === s.userId;
          return (
            <button
              key={s.userId || idx}
              type="button"
              style={{
                ...styles.chip,
                borderColor: isActive ? color : 'var(--border)',
                fontWeight: isActive ? 700 : 400,
              }}
              onMouseEnter={() => setActive(s.userId)}
              onMouseLeave={() => setActive((cur) => (cur === s.userId ? null : cur))}
              onClick={() => setActive((cur) => (cur === s.userId ? null : s.userId))}
            >
              <span style={{ ...styles.swatch, background: color }} />
              {s.displayName}
            </button>
          );
        })}
      </div>
    </div>
  );
}
