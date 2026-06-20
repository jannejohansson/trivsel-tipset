import { useState, useMemo, useEffect } from 'react';
import MatchCard from './MatchCard.jsx';
import GroupStandings from './GroupStandings.jsx';
import { useIsMobile } from '../lib/useIsMobile.js';

const styles = {
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  resetRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
    marginTop: '12px',
  },
  resetLink: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  resetError: { color: 'var(--danger)', fontSize: '13px' },
  tableToggle: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    justifyContent: 'center',
  },
  toggleBtn: {
    flex: 1,
    maxWidth: '200px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    padding: '8px 14px',
    borderRadius: 'var(--radius)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  toggleBtnActive: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    borderColor: 'transparent',
    color: '#ffffff',
    boxShadow: '0 4px 10px rgba(21,163,74,0.25)',
  },
  sideBySide: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
};

// `predictions` + `onPredictionChange` make this a controlled component so a
// parent (e.g. the combined Tippa page) can share the prediction map with the
// playoff bracket. When omitted, GroupTabs keeps its own internal state.
export default function GroupTabs({ matches, locked, readOnly = false, predictions: controlledPreds, onPredictionChange: controlledOnChange, onResetGroup, results }) {
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [tableMode, setTableMode] = useState('pred');
  const isControlled = !!controlledPreds;
  const groups = useMemo(() => {
    const map = new Map();
    for (const m of matches) {
      if (!map.has(m.group)) map.set(m.group, []);
      map.get(m.group).push(m);
    }
    return map;
  }, [matches]);

  const [internalPreds, setInternalPreds] = useState(() => {
    const map = new Map();
    for (const m of matches) {
      if (m.prediction) map.set(m.id, m.prediction);
    }
    return map;
  });

  useEffect(() => {
    if (isControlled) return;
    setInternalPreds(prev => {
      const next = new Map(prev);
      for (const m of matches) {
        if (m.prediction && !next.has(m.id)) next.set(m.id, m.prediction);
      }
      return next;
    });
  }, [matches, isControlled]);

  const predictions = controlledPreds ?? internalPreds;
  const showActual = results instanceof Map && results.size > 0;
  // Below this width two tables won't fit comfortably, so fall back to a toggle.
  const narrowForSplit = useIsMobile(900);

  const handlePredictionChange = (matchId, pred) => {
    if (controlledOnChange) {
      controlledOnChange(matchId, pred);
      return;
    }
    setInternalPreds(prev => {
      const next = new Map(prev);
      next.set(matchId, pred);
      return next;
    });
  };

  const groupKeys = [...groups.keys()].sort();
  const [activeGroup, setActiveGroup] = useState(groupKeys[0] || 'A');

  const groupMatches = (groups.get(activeGroup) || []).slice().sort(
    (a, b) => a.matchday - b.matchday || a.matchNumber - b.matchNumber
  );

  const canReset = !!onResetGroup && !readOnly
    && groupMatches.some((m) => !m.locked && predictions.has(m.id));

  const doReset = () => {
    setResetting(true);
    setResetError(false);
    Promise.resolve(onResetGroup(activeGroup))
      .catch(() => setResetError(true))
      .finally(() => setResetting(false));
  };

  return (
    <div>
      <div className="group-tabs">
        {groupKeys.map(g => (
          <button
            key={g}
            className={`group-tab${g === activeGroup ? ' active' : ''}`}
            onClick={() => setActiveGroup(g)}
            aria-label={`Grupp ${g}`}
          >
            {g}
          </button>
        ))}
      </div>

      {showActual && !narrowForSplit ? (
        // Wide screens: predicted and actual tables side by side.
        <div style={styles.sideBySide}>
          <div style={styles.col}>
            <GroupStandings
              group={activeGroup}
              matches={groupMatches}
              predictions={predictions}
              title="Min tabell"
              countNoun="tippade"
            />
          </div>
          <div style={styles.col}>
            <GroupStandings
              group={activeGroup}
              matches={groupMatches}
              predictions={results}
              title="Verklig"
              countNoun="spelade"
            />
          </div>
        </div>
      ) : (
        <>
          {showActual && (
            // Narrow screens: a toggle swaps the single table between the two.
            <div style={styles.tableToggle}>
              <button
                type="button"
                style={{ ...styles.toggleBtn, ...(tableMode === 'pred' ? styles.toggleBtnActive : {}) }}
                onClick={() => setTableMode('pred')}
                aria-pressed={tableMode === 'pred'}
              >
                Min tabell
              </button>
              <button
                type="button"
                style={{ ...styles.toggleBtn, ...(tableMode === 'actual' ? styles.toggleBtnActive : {}) }}
                onClick={() => setTableMode('actual')}
                aria-pressed={tableMode === 'actual'}
              >
                Verklig
              </button>
            </div>
          )}

          <GroupStandings
            group={activeGroup}
            matches={groupMatches}
            predictions={showActual && tableMode === 'actual' ? results : predictions}
            title={showActual ? (tableMode === 'actual' ? 'Verklig' : 'Min tabell') : 'Tabell'}
            countNoun={showActual && tableMode === 'actual' ? 'spelade' : 'tippade'}
          />
        </>
      )}

      <div style={styles.grid}>
        {groupMatches.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predictions.get(match.id) || null}
            locked={readOnly ? true : (match.locked ?? locked)}
            onPredictionChange={readOnly ? undefined : (pred) => handlePredictionChange(match.id, pred)}
            hidden={readOnly ? !!match.hidden : false}
            points={readOnly ? (match.points ?? null) : null}
            actual={readOnly ? (match.actual ?? null) : null}
          />
        ))}
      </div>

      {canReset && (
        <div style={styles.resetRow}>
          {resetError && <span style={styles.resetError}>Kunde inte rensa. Försök igen.</span>}
          <button style={styles.resetLink} onClick={doReset} disabled={resetting}>
            {resetting ? 'Rensar…' : 'Rensa gruppens tips'}
          </button>
        </div>
      )}
    </div>
  );
}
