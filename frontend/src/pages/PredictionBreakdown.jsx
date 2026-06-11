import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useIsMobile } from '../lib/useIsMobile.js';

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    padding: '36px 20px 28px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 600,
  },
  title: { fontSize: '28px', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: '14px', marginTop: '8px' },
  page: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 60px' },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' },
  error: {
    color: 'var(--danger)', padding: '16px', background: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 'var(--radius)', textAlign: 'center',
  },
  legend: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px', textAlign: 'center' },
  dayHeader: {
    display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 2px 12px',
  },
  dayLabel: {
    fontSize: '13px', fontWeight: 800, letterSpacing: '0.4px',
    color: 'var(--text)', whiteSpace: 'nowrap', textTransform: 'capitalize',
  },
  dayRule: { flex: 1, height: '1px', background: 'var(--border)' },
  // ── Match card ───────────────────────────────────────────────
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)',
    padding: '16px', marginBottom: '16px',
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' },
  groupBadge: {
    fontSize: '11px', fontWeight: 800, lineHeight: 1, padding: '2px 7px',
    borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--border)',
    color: 'var(--text)', flexShrink: 0,
  },
  teams: {
    flex: '1 1 220px', minWidth: '150px', display: 'flex', alignItems: 'center', gap: '8px',
    fontWeight: 700, fontSize: '15px', color: 'var(--text)',
  },
  flag: {
    width: '24px', height: '17px', borderRadius: '2px', flexShrink: 0,
    backgroundSize: 'cover', backgroundPosition: 'center',
    boxShadow: '0 1px 2px rgba(13,27,42,0.15)',
  },
  teamName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  vs: { color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 },
  meta: { display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexShrink: 0 },
  kickoff: { fontSize: '12px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
  statusLive: {
    display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 800,
    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
    color: 'var(--yellow)', background: 'rgba(184,134,11,0.14)',
    border: '1px solid rgba(184,134,11,0.35)', borderRadius: '999px', padding: '2px 9px',
  },
  statusDone: {
    display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800,
    fontSize: '12px', color: '#0b6b32', background: 'var(--green-dim)',
    borderRadius: '999px', padding: '2px 10px', fontVariantNumeric: 'tabular-nums',
  },
  noPreds: { color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', padding: '4px 0' },
  // ── Bar chart ────────────────────────────────────────────────
  chart: { display: 'flex', flexDirection: 'column', gap: '14px' },
  barBlock: { display: 'flex', flexDirection: 'column', gap: '6px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  score: {
    fontSize: '15px', fontWeight: 800, color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums', width: '46px', flexShrink: 0,
  },
  scoreMobile: { width: '40px', fontSize: '14px' },
  scoreCorrect: { color: '#0b6b32' },
  track: {
    flex: 1, minWidth: 0, height: '24px', background: 'var(--surface-2)',
    borderRadius: '6px', overflow: 'hidden', position: 'relative',
  },
  fill: {
    height: '100%', borderRadius: '6px', minWidth: '3px',
    background: 'linear-gradient(90deg, #15a34a, #58c46f)',
    transition: 'width 0.4s ease',
  },
  fillExact: { background: 'linear-gradient(90deg, #0b8a3c, #15a34a)' },
  fillMuted: { background: 'var(--border)' },
  stat: {
    flexShrink: 0, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
    width: '64px', display: 'flex', flexDirection: 'column', gap: '0px', lineHeight: 1.15,
  },
  pct: { fontSize: '15px', fontWeight: 800, color: 'var(--text)' },
  cnt: { fontSize: '11px', color: 'var(--text-muted)' },
  names: {
    display: 'flex', flexWrap: 'wrap', gap: '5px',
    paddingLeft: '56px', // align under the bar, past the score label
  },
  namesMobile: { paddingLeft: '0' },
  nameChip: {
    fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)',
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: '999px', padding: '2px 8px',
  },
  nameChipExact: {
    color: '#0b6b32', background: 'var(--green-dim)', borderColor: 'rgba(21,163,74,0.3)',
  },
  exactTag: {
    fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
    color: '#0b6b32',
  },
};

function formatKickoff(utc) {
  return new Date(utc).toLocaleString('sv-SE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// Local calendar-day key (sv-SE renders as sortable "YYYY-MM-DD").
const dayKey = (utc) => new Date(utc).toLocaleDateString('sv-SE');

// Friendly Swedish day label: "Idag" / "Igår" / e.g. "onsdag 11 juni".
function dayLabel(utc) {
  const key = dayKey(utc);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (key === dayKey(today)) return 'Idag';
  if (key === dayKey(yesterday)) return 'Igår';
  return new Date(utc).toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Group matches by calendar day. Days most-recent first; within a day, live
// matches first, then most-recent kickoff first.
function groupByDay(matches) {
  const groups = new Map();
  for (const m of matches) {
    const key = dayKey(m.kickoffUtc);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }
  for (const items of groups.values()) {
    items.sort((a, b) => {
      if ((a.status === 'inProgress') !== (b.status === 'inProgress')) {
        return a.status === 'inProgress' ? -1 : 1;
      }
      return new Date(b.kickoffUtc) - new Date(a.kickoffUtc);
    });
  }
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([key, items]) => ({ key, label: dayLabel(items[0].kickoffUtc), items }));
}

const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);

// One match card: header, status, and a horizontal bar chart of predicted scorelines
// with every predictor's name shown inline (no expand needed).
function MatchCard({ match, isMobile }) {
  const { actual, total, scorelines, status } = match;
  const actualOutcome = actual ? sign(actual.homeScore - actual.awayScore) : null;
  const maxCount = scorelines.reduce((m, s) => Math.max(m, s.count), 0);

  return (
    <div style={styles.card}>
      <div style={styles.cardHead}>
        <span style={styles.groupBadge}>{isMobile ? match.group : `Grupp ${match.group}`}</span>
        <div style={styles.teams}>
          <span className={`fi fi-${match.homeFlag}`} style={styles.flag} aria-hidden="true" />
          <span style={styles.teamName}>{match.homeTeam}</span>
          <span style={styles.vs}>–</span>
          <span style={styles.teamName}>{match.awayTeam}</span>
          <span className={`fi fi-${match.awayFlag}`} style={styles.flag} aria-hidden="true" />
        </div>
        <div style={styles.meta}>
          <span style={styles.kickoff}>{formatKickoff(match.kickoffUtc)}</span>
          {status === 'completed' && actual
            ? <span style={styles.statusDone}>Slutresultat {actual.homeScore}–{actual.awayScore}</span>
            : <span style={styles.statusLive}>● Pågår</span>}
        </div>
      </div>

      {total === 0 ? (
        <div style={styles.noPreds}>Ingen har tippat den här matchen.</div>
      ) : (
        <div style={styles.chart}>
          {scorelines.map((s) => {
            const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
            const barPct = maxCount > 0 ? (s.count / maxCount) * 100 : 0;
            const isExact = actual && s.homeScore === actual.homeScore && s.awayScore === actual.awayScore;
            const isOutcome = actualOutcome !== null && sign(s.homeScore - s.awayScore) === actualOutcome;
            const fillStyle = isExact ? styles.fillExact : (isOutcome || actualOutcome === null ? {} : styles.fillMuted);
            return (
              <div key={`${s.homeScore}-${s.awayScore}`} style={styles.barBlock}>
                <div style={styles.barRow}>
                  <span style={{ ...styles.score, ...(isMobile ? styles.scoreMobile : {}), ...(isExact ? styles.scoreCorrect : {}) }}>
                    {s.homeScore}–{s.awayScore}
                  </span>
                  <div style={styles.track}>
                    <div style={{ ...styles.fill, ...fillStyle, width: `${barPct}%` }} />
                  </div>
                  <div style={styles.stat}>
                    <span style={styles.pct}>{pct}%</span>
                    <span style={styles.cnt}>{s.count} st</span>
                  </div>
                </div>
                <div style={{ ...styles.names, ...(isMobile ? styles.namesMobile : {}) }}>
                  {isExact && <span style={styles.exactTag}>✓ Rätt</span>}
                  {s.users.map((name, i) => (
                    <span key={i} style={{ ...styles.nameChip, ...(isExact ? styles.nameChipExact : {}) }}>{name}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PredictionBreakdown() {
  const [matches, setMatches] = useState(null);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    api.getPredictionBreakdown()
      .then((data) => setMatches(data.matches || []))
      .catch(() => setError('Kunde inte ladda tippstatistiken.'));
  }, []);

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Trivseltipset · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Vad tippar andra?</h1>
        <p style={styles.sub}>Så har deltagarna tippat de senaste och pågående matcherna.</p>
      </section>

      <div style={styles.page}>
        {error && <p style={styles.error}>{error}</p>}

        {!error && matches && matches.length === 0 && (
          <p style={styles.empty}>Inga matcher har startat än. Kom tillbaka när första avsparken gått!</p>
        )}

        {!error && matches && matches.length > 0 && (
          <>
            <p style={styles.legend}>
              Tipsen visas först när matchen sparkats igång. Varje stapel visar ett tippat resultat och vilka som tippat det.
            </p>
            {groupByDay(matches).map((day) => (
              <div key={day.key}>
                <div style={styles.dayHeader}>
                  <span style={styles.dayLabel}>{day.label}</span>
                  <span style={styles.dayRule} aria-hidden="true" />
                </div>
                {day.items.map((m) => (
                  <MatchCard key={m.id} match={m} isMobile={isMobile} />
                ))}
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}
