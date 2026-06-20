import { useState, useEffect, useMemo } from 'react';
import { api } from '../api.js';
import GroupStandings from '../components/GroupStandings.jsx';
import { useIsMobile } from '../lib/useIsMobile.js';

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    padding: '36px 20px 28px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '8px',
    fontWeight: 600,
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    margin: 0,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '14px',
    marginTop: '8px',
  },
  page: {
    margin: '0 auto',
    maxWidth: '1080px',
    padding: '24px 20px 60px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '28px',
    alignItems: 'start',
  },
  gridMobile: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '28px',
  },
  groupBlock: { minWidth: 0 },
  notice: {
    background: 'rgba(184,134,11,0.10)', border: '1px solid rgba(184,134,11,0.35)',
    color: 'var(--text)', borderRadius: 'var(--radius)', padding: '12px 16px',
    fontSize: '14px', marginBottom: '20px',
  },
  error: {
    color: 'var(--danger)',
    padding: '16px',
    background: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 'var(--radius)',
    textAlign: 'center',
  },
  resultsWrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
  },
  resultsBanner: {
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
    padding: '8px 14px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    borderTop: '1px solid var(--border)',
    fontSize: '14px',
  },
  homeCell: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', minWidth: 0 },
  awayCell: { display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-start', minWidth: 0 },
  teamName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  flag: {
    width: '20px', height: '14px', borderRadius: '2px',
    boxShadow: '0 1px 2px rgba(13,27,42,0.15)', flexShrink: 0,
    backgroundSize: 'cover', backgroundPosition: 'center', display: 'inline-block',
  },
  score: {
    fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--text)',
    minWidth: '52px', textAlign: 'center',
  },
  notPlayed: {
    fontWeight: 500, fontSize: '12px', color: 'var(--text-muted)',
    minWidth: '52px', textAlign: 'center',
  },
};

// Public view of the real, admin-entered group standings + match results.
export default function GroupTables() {
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    Promise.all([api.getMatches(), api.getResults()])
      .then(([m, r]) => {
        setMatches(m.matches);
        setResults(new Map(Object.entries(r.groupResults || {})));
      })
      .catch(() => setError('Kunde inte ladda tabellerna. Försök igen.'))
      .finally(() => setLoading(false));
  }, []);

  const groups = useMemo(() => {
    const map = new Map();
    for (const m of matches) {
      if (!map.has(m.group)) map.set(m.group, []);
      map.get(m.group).push(m);
    }
    return map;
  }, [matches]);

  const groupKeys = [...groups.keys()].sort();

  const sortMatches = (list) => list.slice().sort(
    (a, b) => a.matchday - b.matchday || a.matchNumber - b.matchNumber
  );

  if (loading) {
    return (
      <div style={{ ...styles.page, textAlign: 'center', paddingTop: '80px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Laddar tabeller...</span>
      </div>
    );
  }

  if (error) {
    return <div style={styles.page}><p style={styles.error}>{error}</p></div>;
  }

  const hasResults = results.size > 0;

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Gruppspel · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Tabeller</h1>
        <p style={styles.sub}>Verkliga tabeller och resultat</p>
      </section>

      <div style={styles.page}>
        {!hasResults && (
          <div style={styles.notice}>Inga resultat inlagda ännu.</div>
        )}

        <div style={isMobile ? styles.gridMobile : styles.grid}>
          {groupKeys.map((g) => {
            const groupMatches = sortMatches(groups.get(g) || []);
            return (
              <div key={g} style={styles.groupBlock}>
                <GroupStandings
                  group={g}
                  matches={groupMatches}
                  predictions={results}
                  countNoun="spelade"
                />

                <div style={styles.resultsWrap}>
                  <div style={styles.resultsBanner}>Resultat</div>
                  {groupMatches.map((m) => {
                    const res = results.get(m.id);
                    return (
                      <div key={m.id} style={styles.row}>
                        <div style={styles.homeCell}>
                          <span style={styles.teamName}>{m.homeTeam}</span>
                          <span className={`fi fi-${m.homeFlag}`} style={styles.flag} aria-hidden="true" />
                        </div>
                        {res ? (
                          <span style={styles.score}>{res.homeScore} – {res.awayScore}</span>
                        ) : (
                          <span style={styles.notPlayed}>Ej spelad</span>
                        )}
                        <div style={styles.awayCell}>
                          <span className={`fi fi-${m.awayFlag}`} style={styles.flag} aria-hidden="true" />
                          <span style={styles.teamName}>{m.awayTeam}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
