import { computeAllStandings, rankThirdPlace, GROUP_LETTERS, KO_MATCHES } from '../lib/bracket.js';
import THIRD_PLACE_MATRIX from '../lib/thirdPlaceMatrix.json';
import { useIsMobile } from '../lib/useIsMobile.js';

// Ranked table of the twelve group third-placed teams, derived live from the
// user's predicted group results. The eight highest-ranked qualify for the
// knockout stage; ranking follows FIFA's criteria as far as predictions allow:
// points -> goal difference -> goals scored (fair-play points can't be predicted,
// so a stable name tiebreak stands in — see rankThirdPlace).
const QUALIFY_COUNT = 8;

// Static lookup of the eight Round-of-32 slots that take a third-placed team:
// winnerKey ('1A'...) -> { num: R32 match number, opp: group whose winner plays there }.
// Built from KO_MATCHES so it stays correct if the draw layout ever changes.
const THIRD_SLOTS = {};
for (const ko of KO_MATCHES) {
  const ts = ko.a.t === '3' ? ko.a : ko.b.t === '3' ? ko.b : null;
  if (!ts) continue;
  const ws = ko.a.t === '1' ? ko.a : ko.b.t === '1' ? ko.b : null;
  THIRD_SLOTS[ts.w] = { num: ko.num, opp: ws ? ws.g : ts.w.slice(1) };
}

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
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' },
  thead: { background: 'var(--surface-2)', color: 'var(--text-muted)' },
  th: {
    padding: '6px 4px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  thTeam: { textAlign: 'left', paddingLeft: '10px' },
  thGoesTo: { textAlign: 'left', paddingLeft: '10px' },
  td: {
    padding: '7px 4px',
    textAlign: 'center',
    color: 'var(--text)',
    fontVariantNumeric: 'tabular-nums',
    borderTop: '1px solid var(--border)',
  },
  tdRank: { color: 'var(--text-muted)', fontWeight: 700 },
  tdGroup: { fontWeight: 700, color: 'var(--text-muted)' },
  tdTeam: {
    textAlign: 'left',
    paddingLeft: '10px',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  teamCell: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 },
  teamName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
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
  flagSm: {
    width: '16px',
    height: '11px',
    borderRadius: '2px',
    flexShrink: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'inline-block',
  },
  pts: { fontWeight: 800, color: 'var(--text)' },
  qualifyRow: { background: 'rgba(21,163,74,0.08)' },
  // Thicker line marking the cut between qualifying (top 8) and eliminated teams.
  cutRow: { borderTop: '2px solid var(--green)' },
  goesTo: { textAlign: 'left', paddingLeft: '10px' },
  goesToCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  goesToMatch: { color: 'var(--text-muted)', flexShrink: 0 },
  goesToOpp: { color: 'var(--text-muted)', flexShrink: 0 },
  goesToOut: { color: 'var(--text-muted)' },
};

// `thirdOrder` (optional) overrides the automatic ranking — used on the public
// results page so the table matches the admin's manually-curated order. `pendingHint`
// customises the banner text shown while the table is still provisional.
export default function ThirdPlaceTable({
  matches,
  predictions,
  thirdOrder,
  title = 'Grupptreor · Tabell',
  pendingHint = 'Preliminär – fyll i alla grupper',
}) {
  const isMobile = useIsMobile();
  const all = computeAllStandings(matches, predictions);
  const thirds = rankThirdPlace(all, thirdOrder);
  // Provisional until every group is fully resolved — third place can still move.
  const allComplete = GROUP_LETTERS.every((g) => all[g] && all[g].complete);

  // Annex C slotting for the eight qualifiers: group letter -> R32 slot.
  const best8 = thirds.slice(0, QUALIFY_COUNT).map((t) => t.group);
  const mapping = THIRD_PLACE_MATRIX[best8.slice().sort().join('')];
  const slotForGroup = (g) => {
    if (!mapping) return null;
    const wkey = Object.keys(mapping).find((k) => mapping[k] === g);
    return wkey ? THIRD_SLOTS[wkey] : null;
  };
  const winnerOf = (g) => (all[g] && all[g].rows[0] ? all[g].rows[0] : null);

  return (
    <div style={styles.wrap}>
      <div style={styles.banner}>
        <span>{title}</span>
        <span style={styles.hint}>{allComplete ? '8 bästa går vidare' : pendingHint}</span>
      </div>
      <table style={styles.table}>
        <colgroup>
          <col style={{ width: '32px' }} />
          <col style={{ width: '48px' }} />
          <col />
          {!isMobile && <col style={{ width: '56px' }} />}
          <col style={{ width: '44px' }} />
          <col style={{ width: '40px' }} />
          {!isMobile && <col style={{ width: '200px' }} />}
        </colgroup>
        <thead style={styles.thead}>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Grupp</th>
            <th style={{ ...styles.th, ...styles.thTeam }}>Lag</th>
            {!isMobile && <th style={styles.th}>GM-IM</th>}
            <th style={styles.th}>+/-</th>
            <th style={styles.th}>P</th>
            {!isMobile && <th style={{ ...styles.th, ...styles.thGoesTo }}>Går till</th>}
          </tr>
        </thead>
        <tbody>
          {thirds.map((r, i) => {
            const qualifies = i < QUALIFY_COUNT;
            const tdBase = { ...styles.td, ...(i === QUALIFY_COUNT ? styles.cutRow : {}) };
            const slot = qualifies ? slotForGroup(r.group) : null;
            const opp = slot ? winnerOf(slot.opp) : null;
            return (
              <tr key={r.group} style={qualifies ? styles.qualifyRow : undefined}>
                <td style={{ ...tdBase, ...styles.tdRank }}>{i + 1}</td>
                <td style={{ ...tdBase, ...styles.tdGroup }}>{r.group}</td>
                <td style={{ ...tdBase, ...styles.tdTeam }}>
                  <div style={styles.teamCell}>
                    <span className={`fi fi-${r.flag}`} style={styles.flag} aria-hidden="true" />
                    <span style={styles.teamName}>{r.team}</span>
                  </div>
                </td>
                {!isMobile && <td style={tdBase}>{r.GF}-{r.GA}</td>}
                <td style={tdBase}>{r.GD > 0 ? `+${r.GD}` : r.GD}</td>
                <td style={{ ...tdBase, ...styles.pts }}>{r.Pts}</td>
                {!isMobile && (
                  <td style={{ ...tdBase, ...styles.goesTo }}>
                    {slot ? (
                      <div style={styles.goesToCell}>
                        <span style={styles.goesToMatch}>Match {slot.num}</span>
                        <span style={styles.goesToOpp}>mot</span>
                        {opp ? (
                          <>
                            <span className={`fi fi-${opp.flag}`} style={styles.flagSm} aria-hidden="true" />
                            <span style={styles.teamName}>{opp.team}</span>
                          </>
                        ) : (
                          <span style={styles.teamName}>1{slot.opp}</span>
                        )}
                      </div>
                    ) : (
                      <span style={styles.goesToOut}>—</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
