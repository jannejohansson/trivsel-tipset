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

export default function GroupTabs({ matches, locked }) {
  const groups = useMemo(() => {
    const map = new Map();
    for (const m of matches) {
      if (!map.has(m.group)) map.set(m.group, []);
      map.get(m.group).push(m);
    }
    return map;
  }, [matches]);

  const [predictions, setPredictions] = useState(() => {
    const map = new Map();
    for (const m of matches) {
      if (m.prediction) map.set(m.id, m.prediction);
    }
    return map;
  });

  useEffect(() => {
    setPredictions(prev => {
      const next = new Map(prev);
      for (const m of matches) {
        if (m.prediction && !next.has(m.id)) next.set(m.id, m.prediction);
      }
      return next;
    });
  }, [matches]);

  const handlePredictionChange = (matchId, pred) => {
    setPredictions(prev => {
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
            locked={locked}
            onPredictionChange={(pred) => handlePredictionChange(match.id, pred)}
          />
        ))}
      </div>
    </div>
  );
}
