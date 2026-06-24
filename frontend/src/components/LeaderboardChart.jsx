import { useMemo, useState } from 'react';
import { useIsMobile } from '../lib/useIsMobile.js';

// Custom SVG line chart of cumulative points per participant, one vertex per played
// match so the climb shows match by match. Dashed stage separators split the x-axis,
// with a discreet sequential counter (1, 2, 3 … the order matches were played, not the
// official match numbers, which don't run in play order) beneath it. All participants
// are drawn equally; hovering/tapping a line or a legend chip highlights one and dims
// the rest. With `zoom`, the y-axis spans the visible window instead of starting at 0,
// so a "last N matches" view shows the movement rather than a flat band near the top.
// No charting library — matches the app's zero-UI-deps approach.

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

const hueColor = (i, n) => `hsl(${Math.round((i * 360) / Math.max(n, 1))}, 65%, 50%)`;

// A user's colour is keyed by identity, not by their current rank, so it stays
// the same as they move up and down the field between visits. We spread hues over
// a stable userId ordering; the legend/series can be re-sorted freely on top.
function useColorMap(series) {
  return useMemo(() => {
    const ids = series.map((s) => s.userId).sort((a, b) => String(a).localeCompare(String(b)));
    const map = {};
    ids.forEach((id, i) => { map[id] = hueColor(i, ids.length); });
    return map;
  }, [series]);
}

// Pick checkpoint indices to label on the x-axis: roughly `target` evenly-spaced
// ticks, always including the first and last.
function xTickIndices(n, target) {
  if (n <= 1) return [0];
  const step = Math.max(1, Math.round((n - 1) / target));
  const idx = [];
  for (let i = 0; i < n; i += step) idx.push(i);
  if (idx[idx.length - 1] !== n - 1) idx.push(n - 1);
  return idx;
}

// Build a rounded y-axis spanning [min, max] with ~4 gridlines. The full chart passes
// min 0; the zoomed "recent" chart passes a non-zero min so the window fills the height.
function yScale(min, max) {
  if (max <= min) max = min + 1;
  const steps = 4;
  const raw = (max - min) / steps;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = Math.max(1, Math.ceil(raw / mag) * mag);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + 0.001; v += step) ticks.push(v);
  return { lo, hi, ticks };
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

export default function LeaderboardChart({ checkpoints, series, zoom = false }) {
  const isMobile = useIsMobile();
  const [active, setActive] = useState(null); // highlighted userId or null
  const colorMap = useColorMap(series);
  const colorOf = (s) => colorMap[s.userId] || '#888';

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
  // Just enough bottom room for a discreet row of match-number ticks.
  const m = { top: 20, right: 16, bottom: 28, left: 40 };
  const plotW = W - m.left - m.right;
  const plotH = H - m.top - m.bottom;

  const allVals = series.flatMap((s) => s.points.map((p) => Number(p) || 0));
  const dataMax = Math.max(1, ...allVals);
  const dataMin = zoom && allVals.length ? Math.min(...allVals) : 0;
  const yAxis = yScale(dataMin, dataMax);
  const ticks = yAxis.ticks;
  const ySpan = yAxis.hi - yAxis.lo || 1;
  const spans = stageSpans(checkpoints);
  const showDots = n <= 24; // only annotate individual matches when the field is sparse
  const xTicks = xTickIndices(n, isMobile ? 6 : 12);

  const x = (i) => (n === 1 ? m.left + plotW / 2 : m.left + (plotW * i) / (n - 1));
  const y = (v) => m.top + plotH - (((Number(v) || 0) - yAxis.lo) / ySpan) * plotH;

  const activeSeries = active != null ? series.find((s) => s.userId === active) : null;

  return (
    <div style={styles.wrap}>
      <div style={styles.caption}>
        {activeSeries ? (
          <>
            <span style={{ ...styles.swatch, background: colorOf(activeSeries) }} />
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

          {/* dashed separators between stages (no labels) */}
          {spans.map((sp, si) => (
            si > 0 ? (
              <line
                key={`${sp.stage}-${si}`}
                x1={(x(sp.start) + x(sp.start - 1)) / 2}
                y1={m.top}
                x2={(x(sp.start) + x(sp.start - 1)) / 2}
                y2={m.top + plotH}
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            ) : null
          ))}

          {/* discreet adaptive match-number ticks along the x-axis */}
          {xTicks.map((i) => {
            const cp = checkpoints[i];
            return (
              <text
                key={`x${cp.key || i}`}
                x={x(i)}
                y={H - m.bottom + 16}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-muted)"
                opacity="0.6"
              >
                {cp.seq ?? cp.num}
              </text>
            );
          })}

          {/* one line per participant */}
          {series.map((s, idx) => {
            const color = colorOf(s);
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
        {/* Legend lists participants alphabetically by name (the series itself is in
            points order); colours are keyed by userId so this re-sort is cosmetic. */}
        {[...series]
          .sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'sv'))
          .map((s, idx) => {
          const color = colorOf(s);
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
