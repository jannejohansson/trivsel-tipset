import { useState, useMemo, useEffect } from 'react';
import MatchCard from './MatchCard.jsx';
import GroupStandings from './GroupStandings.jsx';

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '12px',
  },
};

// `predictions` + `onPredictionChange` make this a controlled component so a
// parent (e.g. the combined Tippa page) can share the prediction map with the
// playoff bracket. When omitted, GroupTabs keeps its own internal state.
export default function GroupTabs({ matches, locked, readOnly = false, predictions: controlledPreds, onPredictionChange: controlledOnChange }) {
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

      <GroupStandings
        group={activeGroup}
        matches={groupMatches}
        predictions={predictions}
      />

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
    </div>
  );
}
