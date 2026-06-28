import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useIsMobile } from '../lib/useIsMobile.js';
import CompareMatchRow from '../components/CompareMatchRow.jsx';

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff', padding: '36px 20px 28px', textAlign: 'center',
  },
  eyebrow: {
    fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 600,
  },
  title: { fontSize: '28px', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: '14px', marginTop: '8px' },
  page: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 60px' },
  // ── Player pickers ───────────────────────────────────────────
  pickerRow: { display: 'flex', alignItems: 'flex-end', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  pickerField: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '160px' },
  pickerLabel: { fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' },
  pickerVs: { fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', padding: '0 2px 10px' },
  select: {
    width: '100%', padding: '10px 12px', fontSize: '15px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--text)', fontFamily: 'inherit',
  },
  vsCard: {
    display: 'flex', alignItems: 'stretch', gap: '0',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)',
    overflow: 'hidden', marginBottom: '20px',
  },
  vsCol: { flex: 1, minWidth: 0, padding: '16px 14px', textAlign: 'center' },
  vsColMe: { background: 'var(--green-dim)' },
  vsName: {
    fontSize: '16px', fontWeight: 800, color: 'var(--text)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  vsRank: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' },
  vsPoints: { fontSize: '30px', fontWeight: 800, color: 'var(--green)', lineHeight: 1.1, marginTop: '8px', fontVariantNumeric: 'tabular-nums' },
  vsSplit: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  vsMid: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 8px', fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)',
    borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
  },
  champRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    marginTop: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--text)',
  },
  champFlag: { width: '20px', height: '15px', borderRadius: '2px', flexShrink: 0, boxShadow: '0 1px 2px rgba(13,27,42,0.15)' },
  champMuted: { color: 'var(--text-muted)', fontWeight: 500, fontStyle: 'italic' },
  summary: {
    textAlign: 'center', fontSize: '15px', fontWeight: 700, color: 'var(--text)',
    background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: '20px',
  },
  sectionHeadRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '12px', margin: '0 0 12px', flexWrap: 'wrap',
  },
  sectionTitle: { fontSize: '15px', fontWeight: 800, color: 'var(--text)', margin: 0 },
  expandAllBtn: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '999px',
    padding: '6px 14px', color: 'var(--text)', fontSize: '13px', fontWeight: 600,
    fontFamily: 'inherit', cursor: 'pointer',
  },
  playoffNote: {
    background: 'rgba(184,134,11,0.10)', border: '1px solid rgba(184,134,11,0.35)',
    color: 'var(--text)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: '14px', marginBottom: '20px',
  },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: '32px 20px' },
  error: { color: 'var(--danger)', padding: '16px', background: 'rgba(220,38,38,0.08)', borderRadius: 'var(--radius)', textAlign: 'center' },
  back: { display: 'inline-block', marginTop: '14px', color: '#ffffff', fontSize: '13px', textDecoration: 'none', opacity: 0.9 },
  // ── Collapsible group sections (two-up on desktop) ──────────
  section: {
    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
    background: 'var(--surface)', boxShadow: 'var(--shadow-card)', overflow: 'hidden',
  },
  sectionHead: {
    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface-2)', border: 'none', padding: '12px 14px',
    cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit',
  },
  sectionName: { fontSize: '14px', fontWeight: 800, color: 'var(--text)' },
  sectionScore: {
    fontSize: '12px', fontWeight: 800, fontVariantNumeric: 'tabular-nums',
    padding: '1px 8px', borderRadius: '999px', background: 'var(--surface)',
    border: '1px solid var(--border)', color: 'var(--text-muted)',
  },
  chevron: { marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '13px', flexShrink: 0 },
  sectionBody: { padding: '12px 12px 2px' },
};

// Count knockout ties where both have made a (different) winner pick.
function bracketDivergence(aPlayoff, bPlayoff) {
  if (!aPlayoff || !bPlayoff) return null;
  const bById = new Map(bPlayoff.matches.map((m) => [m.id, m.pick]));
  let differ = 0;
  let shared = 0;
  for (const m of aPlayoff.matches) {
    const bp = bById.get(m.id);
    if (m.pick && bp) { shared += 1; if (m.pick !== bp) differ += 1; }
  }
  return { differ, shared };
}

function PlayerColumn({ row, highlight }) {
  return (
    <div style={{ ...styles.vsCol, ...(highlight ? styles.vsColMe : {}) }}>
      <div style={styles.vsName}>{row.displayName}</div>
      <div style={styles.vsRank}>#{row.rank} av {row.total}</div>
      <div style={styles.vsPoints}>{row.points}</div>
      <div style={styles.vsSplit}>Grupp {row.groupPoints} · Slutspel {row.playoffPoints}</div>
      <div style={styles.champRow}>
        {row.champion?.team ? (
          <>
            {row.champion.flag && <span className={`fi fi-${row.champion.flag}`} style={styles.champFlag} aria-hidden="true" />}
            {row.champion.team}
          </>
        ) : (
          <span style={styles.champMuted}>Mästare dold</span>
        )}
      </div>
    </div>
  );
}

// One collapsible group of compared matches. Controlled open state so a parent
// "expand/collapse all" can drive every section at once.
function GroupSection({ group, open, onToggle }) {
  return (
    <div style={styles.section}>
      <button type="button" style={styles.sectionHead} onClick={onToggle} aria-expanded={open}>
        <span style={styles.sectionName}>Grupp {group.letter}</span>
        <span style={styles.sectionScore} title="Spelare 1:s vinster – spelare 2:s vinster i gruppen">
          {group.a}–{group.b}
        </span>
        <span style={styles.chevron} aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={styles.sectionBody}>
          {group.rows.map((r) => (
            <CompareMatchRow key={r.id} home={r.home} away={r.away} actual={r.actual} mine={r.a} theirs={r.b} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const { userId: paramId } = useParams();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [board, setBoard] = useState(null);   // leaderboard users + count
  const [dataA, setDataA] = useState(null);   // getUserPredictions(aId)
  const [dataB, setDataB] = useState(null);   // getUserPredictions(bId)
  const [error, setError] = useState(null);
  // Selected players. null ⇒ fall back to the default (A = logged-in user, B = URL param).
  const [aSel, setASel] = useState(null);
  const [bSel, setBSel] = useState(null);
  // Group open-state: null ⇒ use the default (open, unless playoff has started). A concrete
  // Set means the user has toggled groups (or used expand/collapse all).
  const [openGroups, setOpenGroups] = useState(null);

  // Leaderboard once: drives the picker list + authoritative totals/rank/champion.
  useEffect(() => {
    api.getLeaderboard()
      .then(setBoard)
      .catch(() => setError('Kunde inte ladda ställningen.'));
  }, []);

  if (!user) return null;

  const aId = aSel ?? user.userId;
  const bId = bSel ?? paramId ?? '';

  return <CompareInner
    user={user}
    isMobile={isMobile}
    board={board}
    aId={aId}
    bId={bId}
    setASel={setASel}
    setBSel={setBSel}
    dataA={dataA}
    dataB={dataB}
    setDataA={setDataA}
    setDataB={setDataB}
    error={error}
    setError={setError}
    openGroups={openGroups}
    setOpenGroups={setOpenGroups}
  />;
}

// Inner component so the data-fetch effect can depend on the resolved aId/bId without
// violating rules-of-hooks (the early `if (!user) return` lives in the wrapper).
function CompareInner({
  user, isMobile, board, aId, bId, setASel, setBSel,
  dataA, dataB, setDataA, setDataB, error, setError, openGroups, setOpenGroups,
}) {
  const valid = !!(aId && bId && aId !== bId);

  // Fetch both players' predictions whenever the (valid) pair changes. State is only set in
  // async callbacks; the `ready` check below ties loaded data to the current pair.
  useEffect(() => {
    if (!valid) return undefined;
    let active = true;
    Promise.all([api.getUserPredictions(aId), api.getUserPredictions(bId)])
      .then(([a, b]) => { if (active) { setDataA(a); setDataB(b); setError(null); } })
      .catch(() => { if (active) setError('Kunde inte ladda tipsen.'); });
    return () => { active = false; };
  }, [valid, aId, bId, setDataA, setDataB, setError]);

  const ready = !!(valid && dataA && dataB && dataA.user?.userId === aId && dataB.user?.userId === bId);
  const loading = valid && !ready && !error;

  const users = board?.users || [];
  const total = board?.count ?? users.length;
  const sortedUsers = [...users].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', 'sv'));
  const rowOf = (id) => {
    const u = users.find((x) => x.userId === id);
    return u ? { ...u, total } : null;
  };
  const aRow = rowOf(aId);
  const bRow = rowOf(bId);

  // Join both match lists by id; keep only decided matches, grouped by group letter with a
  // per-group head-to-head tally (a wins – b wins).
  const tally = { a: 0, b: 0, tie: 0 };
  const groupMap = new Map();
  if (ready) {
    const bById = new Map((dataB.matches || []).map((m) => [m.id, m]));
    (dataA.matches || [])
      .filter((m) => m.actual)
      .sort((x, y) => x.matchNumber - y.matchNumber)
      .forEach((m) => {
        const t = bById.get(m.id) || {};
        const aPts = m.points || 0;
        const bPts = t.points || 0;
        if (aPts > bPts) tally.a += 1; else if (bPts > aPts) tally.b += 1; else tally.tie += 1;
        if (!groupMap.has(m.group)) groupMap.set(m.group, { letter: m.group, a: 0, b: 0, tie: 0, rows: [] });
        const g = groupMap.get(m.group);
        if (aPts > bPts) g.a += 1; else if (bPts > aPts) g.b += 1; else g.tie += 1;
        g.rows.push({
          id: m.id,
          home: { team: m.homeTeam, flag: m.homeFlag },
          away: { team: m.awayTeam, flag: m.awayFlag },
          actual: m.actual,
          a: { prediction: m.prediction || null, points: aPts },
          b: { prediction: t.prediction || null, points: bPts },
        });
      });
  }
  const groups = [...groupMap.values()].sort((a, b) => a.letter.localeCompare(b.letter, 'sv'));
  const groupGridStyle = {
    display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', alignItems: 'start',
  };

  // Once the playoff has started, groups collapse by default (the group stage is old news).
  const playoffStarted = !!(dataA?.playoffMode || dataB?.playoffMode);
  const defaultOpen = !playoffStarted;
  const isOpen = (letter) => (openGroups ? openGroups.has(letter) : defaultOpen);
  const allOpen = groups.length > 0 && groups.every((g) => isOpen(g.letter));
  const baseSet = () => new Set(openGroups || (defaultOpen ? groups.map((g) => g.letter) : []));
  const toggleGroup = (letter) => setOpenGroups(() => {
    const next = baseSet();
    if (next.has(letter)) next.delete(letter); else next.add(letter);
    return next;
  });
  const toggleAll = () => setOpenGroups(allOpen ? new Set() : new Set(groups.map((g) => g.letter)));

  const div = bracketDivergence(dataA?.playoff, dataB?.playoff);
  const aName = aRow?.displayName || 'Spelare 1';
  const bName = bRow?.displayName || 'Spelare 2';
  const summaryText = tally.a === tally.b
    ? `Oavgjort ${tally.a}–${tally.b} på avgjorda matcher${tally.tie ? ` (${tally.tie} lika)` : ''}`
    : `${tally.a > tally.b ? aName : bName} leder ${Math.max(tally.a, tally.b)}–${Math.min(tally.a, tally.b)} på avgjorda matcher${tally.tie ? ` (${tally.tie} lika)` : ''}`;

  const renderOption = (u) => <option key={u.userId} value={u.userId}>{u.displayName}</option>;

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Trivseltipset · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Jämför tips</h1>
        <p style={styles.sub}>Ställ två deltagares tips mot varandra, match för match.</p>
        <Link to="/leaderboard" style={styles.back}>← Tillbaka till ställningen</Link>
      </section>

      <div style={styles.page}>
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.pickerRow}>
          <label style={styles.pickerField}>
            <span style={styles.pickerLabel}>Spelare 1</span>
            <select style={styles.select} value={aId} onChange={(e) => setASel(e.target.value)}>
              {sortedUsers.map(renderOption)}
            </select>
          </label>
          <span style={styles.pickerVs}>vs</span>
          <label style={styles.pickerField}>
            <span style={styles.pickerLabel}>Spelare 2</span>
            <select style={styles.select} value={bId} onChange={(e) => setBSel(e.target.value)}>
              <option value="">Välj deltagare…</option>
              {sortedUsers.map(renderOption)}
            </select>
          </label>
        </div>

        {!bId && <p style={styles.empty}>Välj en andra deltagare för att jämföra.</p>}
        {bId && aId === bId && <p style={styles.empty}>Välj två olika deltagare.</p>}

        {valid && aRow && bRow && (
          <>
            <div style={styles.vsCard}>
              <PlayerColumn row={aRow} highlight={aId === user.userId} />
              <div style={styles.vsMid}>VS</div>
              <PlayerColumn row={bRow} highlight={bId === user.userId} />
            </div>

            {loading && <p style={styles.empty}>Laddar tips…</p>}

            {ready && (
              <>
                {groups.length > 0 && <div style={styles.summary}>{summaryText}</div>}

                {div != null && div.shared > 0 && (
                  <div style={styles.summary}>
                    Slutspelsträd: {div.differ === 0
                      ? 'identiska val hittills 🤝'
                      : `de skiljer sig på ${div.differ} av ${div.shared} val`}
                  </div>
                )}
                {div == null && (
                  <div style={styles.playoffNote}>
                    Slutspelstipsen jämförs här när slutspelet startar och tipsen låses.
                  </div>
                )}

                <div style={styles.sectionHeadRow}>
                  <h2 style={styles.sectionTitle}>Gruppspel – avgjorda matcher</h2>
                  {groups.length > 0 && (
                    <button type="button" style={styles.expandAllBtn} onClick={toggleAll}>
                      {allOpen ? 'Fäll ihop alla' : 'Expandera alla'}
                    </button>
                  )}
                </div>
                {groups.length === 0 ? (
                  <p style={styles.empty}>Inga avgjorda matcher att jämföra än.</p>
                ) : (
                  <div style={groupGridStyle}>
                    {groups.map((g) => (
                      <GroupSection key={g.letter} group={g} open={isOpen(g.letter)} onToggle={() => toggleGroup(g.letter)} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
