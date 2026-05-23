import { useState, useMemo } from 'react';
import MatchCard from './MatchCard.jsx';

const styles = {
  tabs: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginBottom: '20px',
  },
  tab: {
    padding: '6px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    background: 'none',
    color: 'var(--text-muted)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  tabActive: {
    background: 'var(--surface-2)',
    color: 'var(--text)',
    borderColor: 'var(--accent)',
  },
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

  const groupKeys = [...groups.keys()].sort();
  const [activeGroup, setActiveGroup] = useState(groupKeys[0] || 'A');

  const groupMatches = groups.get(activeGroup) || [];

  return (
    <div>
      <div style={styles.tabs}>
        {groupKeys.map(g => (
          <button
            key={g}
            style={{ ...styles.tab, ...(g === activeGroup ? styles.tabActive : {}) }}
            onClick={() => setActiveGroup(g)}
          >
            Grupp {g}
          </button>
        ))}
      </div>
      <div style={styles.grid}>
        {groupMatches.map(match => (
          <MatchCard key={match.id} match={match} locked={locked} />
        ))}
      </div>
    </div>
  );
}
