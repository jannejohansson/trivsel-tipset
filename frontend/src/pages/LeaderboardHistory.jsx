import { useState, useEffect } from 'react';
import { api } from '../api.js';
import LeaderboardChart from '../components/LeaderboardChart.jsx';
import { useIsMobile } from '../lib/useIsMobile.js';

// Once more than this many matches are played, add a zoomed chart of just the latest
// ones above the full-history chart, so recent movement isn't lost in a crowded x-axis.
const RECENT_COUNT = 24;

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
  // Wider than the standard pages so the line chart gets as much horizontal room
  // as the screen allows on laptops/desktops.
  page: { maxWidth: '1500px', margin: '0 auto', padding: '24px 20px 60px' },
  chartHeading: {
    fontSize: '15px', fontWeight: 700, color: 'var(--text)',
    margin: '0 0 10px', display: 'flex', alignItems: 'baseline', gap: '8px',
  },
  chartHeadingHint: { fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' },
  error: { color: 'var(--danger)', textAlign: 'center', padding: '16px' },
  mobileNote: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)',
    padding: '28px 20px', textAlign: 'center', color: 'var(--text-muted)',
    fontSize: '14px', lineHeight: 1.6,
  },
};

export default function LeaderboardHistory() {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);
  // The line chart packs a lot in; on phones we show a note instead of a cramped
  // version. Tablets/laptops (>680px) get the full chart.
  const isMobile = useIsMobile();

  useEffect(() => {
    // No point fetching the series on phones, where we don't render the chart.
    if (isMobile) return;
    api.getLeaderboardHistory()
      .then(setHistory)
      .catch(() => setError('Kunde inte ladda poängutvecklingen.'));
  }, [isMobile]);

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Trivseltipset · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Historik</h1>
        <p style={styles.sub}>Hur deltagarnas poäng vuxit match för match genom turneringen.</p>
      </section>

      <div style={styles.page}>
        {isMobile ? (
          <div style={styles.mobileNote}>
            Historikdiagrammet visas bäst på en större skärm.
            <br />
            Öppna sidan på dator eller surfplatta för att se poängutvecklingen.
          </div>
        ) : (
          <>
            {error && <p style={styles.error}>{error}</p>}
            {!error && !history && <p style={styles.empty}>Laddar poängutveckling…</p>}
            {!error && history && (() => {
              // Number checkpoints in play order (1, 2, 3 …) so both charts share a
              // simple counter on the x-axis instead of the non-sequential match numbers.
              const checkpoints = history.checkpoints.map((c, i) => ({ ...c, seq: i + 1 }));
              const showRecent = checkpoints.length > RECENT_COUNT;
              const recentCps = checkpoints.slice(-RECENT_COUNT);
              const recentSeries = history.series.map((s) => ({
                ...s,
                points: s.points.slice(-RECENT_COUNT),
              }));
              return (
                <>
                  {showRecent && (
                    <>
                      <h2 style={styles.chartHeading}>
                        Senaste matcherna
                        <span style={styles.chartHeadingHint}>
                          match {recentCps[0].seq}–{recentCps[recentCps.length - 1].seq}
                        </span>
                      </h2>
                      <LeaderboardChart checkpoints={recentCps} series={recentSeries} zoom />
                      <h2 style={styles.chartHeading}>Hela turneringen</h2>
                    </>
                  )}
                  <LeaderboardChart checkpoints={checkpoints} series={history.series} />
                </>
              );
            })()}
          </>
        )}
      </div>
    </>
  );
}
