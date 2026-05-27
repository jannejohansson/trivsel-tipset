const styles = {
  wrap: {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-card)',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  banner: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hint: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.75)',
    fontWeight: 500,
    letterSpacing: '0.3px',
    textTransform: 'none',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    tableLayout: 'fixed',
  },
  thead: {
    background: 'var(--surface-2)',
    color: 'var(--text-muted)',
  },
  th: {
    padding: '6px 4px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  thRank: { width: '32px', textAlign: 'center' },
  thTeam: { textAlign: 'left', paddingLeft: '10px' },
  thNarrow: { width: '30px' },
  thWide: { width: '52px' },
  td: {
    padding: '6px 4px',
    textAlign: 'center',
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
    borderTop: '1px solid var(--border)',
  },
  tdRank: {
    color: 'var(--text-muted)',
    fontWeight: 700,
  },
  tdTeam: {
    textAlign: 'left',
    paddingLeft: '10px',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  teamCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  teamName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  flag: {
    width: '20px',
    height: '14px',
    borderRadius: '2px',
    boxShadow: '0 1px 2px rgba(13,27,42,0.15)',
    flexShrink: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'inline-block',
  },
  pts: { fontWeight: 800, color: 'var(--text)' },
  qualifyRow: { background: 'rgba(21,163,74,0.08)' },
  thirdRow: { background: 'rgba(184,134,11,0.08)' },
};

function computeStandings(matches, predictions) {
  const teams = new Map();

  const seed = (name, flag) => {
    if (!teams.has(name)) {
      teams.set(name, { team: name, flag, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, GD: 0, Pts: 0 });
    }
  };

  for (const m of matches) {
    seed(m.homeTeam, m.homeFlag);
    seed(m.awayTeam, m.awayFlag);
  }

  for (const m of matches) {
    const pred = predictions.get(m.id);
    if (!pred) continue;
    const hs = Number(pred.homeScore);
    const as = Number(pred.awayScore);
    if (!Number.isFinite(hs) || !Number.isFinite(as)) continue;

    const home = teams.get(m.homeTeam);
    const away = teams.get(m.awayTeam);
    home.P++; away.P++;
    home.GF += hs; home.GA += as;
    away.GF += as; away.GA += hs;
    if (hs > as) { home.W++; home.Pts += 3; away.L++; }
    else if (hs < as) { away.W++; away.Pts += 3; home.L++; }
    else { home.D++; away.D++; home.Pts += 1; away.Pts += 1; }
  }

  for (const t of teams.values()) t.GD = t.GF - t.GA;

  return [...teams.values()].sort((a, b) => {
    if (b.Pts !== a.Pts) return b.Pts - a.Pts;
    if (b.GD !== a.GD) return b.GD - a.GD;
    if (b.GF !== a.GF) return b.GF - a.GF;
    return a.team.localeCompare(b.team);
  });
}

export default function GroupStandings({ group, matches, predictions }) {
  const rows = computeStandings(matches, predictions);
  const played = rows.reduce((s, r) => s + r.P, 0) / 2;

  return (
    <div style={styles.wrap}>
      <div style={styles.banner}>
        <span>Grupp {group} · Tabell</span>
        <span style={styles.hint}>{played} / {matches.length} tippade</span>
      </div>
      <table style={styles.table}>
        <colgroup>
          <col style={{ width: '32px' }} />
          <col />
          <col style={{ width: '32px' }} />
          <col style={{ width: '32px' }} />
          <col style={{ width: '32px' }} />
          <col style={{ width: '32px' }} />
          <col style={{ width: '56px' }} />
          <col style={{ width: '44px' }} />
          <col style={{ width: '40px' }} />
        </colgroup>
        <thead style={styles.thead}>
          <tr>
            <th style={{ ...styles.th, ...styles.thRank }}>#</th>
            <th style={{ ...styles.th, ...styles.thTeam }}>Lag</th>
            <th style={styles.th}>S</th>
            <th style={styles.th}>V</th>
            <th style={styles.th}>O</th>
            <th style={styles.th}>F</th>
            <th style={styles.th}>GM-IM</th>
            <th style={styles.th}>+/-</th>
            <th style={styles.th}>P</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const rowStyle = i < 2 ? styles.qualifyRow : i === 2 ? styles.thirdRow : null;
            return (
              <tr key={r.team} style={rowStyle || undefined}>
                <td style={{ ...styles.td, ...styles.tdRank }}>{i + 1}</td>
                <td style={{ ...styles.td, ...styles.tdTeam }}>
                  <div style={styles.teamCell}>
                    <span className={`fi fi-${r.flag}`} style={styles.flag} aria-hidden="true" />
                    <span style={styles.teamName}>{r.team}</span>
                  </div>
                </td>
                <td style={styles.td}>{r.P}</td>
                <td style={styles.td}>{r.W}</td>
                <td style={styles.td}>{r.D}</td>
                <td style={styles.td}>{r.L}</td>
                <td style={styles.td}>{r.GF}-{r.GA}</td>
                <td style={styles.td}>{r.GD > 0 ? `+${r.GD}` : r.GD}</td>
                <td style={{ ...styles.td, ...styles.pts }}>{r.Pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
