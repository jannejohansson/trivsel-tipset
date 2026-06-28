import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  pickerRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' },
  pickerLabel: { fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 },
  select: {
    flex: 1, minWidth: '180px', padding: '10px 12px', fontSize: '15px',
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
  sectionTitle: { fontSize: '15px', fontWeight: 800, color: 'var(--text)', margin: '0 0 12px' },
  // ── Collapsible group sections (laid out two-up on desktop) ──
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
  playoffNote: {
    background: 'rgba(184,134,11,0.10)', border: '1px solid rgba(184,134,11,0.35)',
    color: 'var(--text)', borderRadius: 'var(--radius)', padding: '12px 16px', fontSize: '14px', marginBottom: '20px',
  },
  empty: { textAlign: 'center', color: 'var(--text-muted)', padding: '32px 20px' },
  error: { color: 'var(--danger)', padding: '16px', background: 'rgba(220,38,38,0.08)', borderRadius: 'var(--radius)', textAlign: 'center' },
  back: { display: 'inline-block', marginTop: '14px', color: '#ffffff', fontSize: '13px', textDecoration: 'none', opacity: 0.9 },
};

// Count knockout ties where both have made a (different) winner pick.
function bracketDivergence(minePlayoff, theirPlayoff) {
  if (!minePlayoff || !theirPlayoff) return null;
  const theirsById = new Map(theirPlayoff.matches.map((m) => [m.id, m.pick]));
  let differ = 0;
  let shared = 0;
  for (const m of minePlayoff.matches) {
    const tp = theirsById.get(m.id);
    if (m.pick && tp) { shared += 1; if (m.pick !== tp) differ += 1; }
  }
  return { differ, shared };
}

function PlayerColumn({ row, isMe }) {
  return (
    <div style={{ ...styles.vsCol, ...(isMe ? styles.vsColMe : {}) }}>
      <div style={styles.vsName}>{row.displayName}{isMe ? ' (du)' : ''}</div>
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

// One collapsible group of compared matches. The header shows the group letter and the
// head-to-head score within that group (your wins–theirs). Default open.
function GroupSection({ group, rows }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={styles.section}>
      <button type="button" style={styles.sectionHead} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span style={styles.sectionName}>Grupp {group.letter}</span>
        <span style={styles.sectionScore} title="Dina vinster – motståndarens vinster i gruppen">
          {group.me}–{group.them}
        </span>
        <span style={styles.chevron} aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div style={styles.sectionBody}>
          {rows.map((r) => (
            <CompareMatchRow key={r.id} home={r.home} away={r.away} actual={r.actual} mine={r.mine} theirs={r.theirs} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const { userId: rivalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [board, setBoard] = useState(null);   // leaderboard users + count
  const [mine, setMine] = useState(null);     // getUserPredictions(me)
  const [theirs, setTheirs] = useState(null); // getUserPredictions(rival)
  const [error, setError] = useState(null);

  // Leaderboard once: drives the picker list + authoritative totals/rank/champion.
  useEffect(() => {
    api.getLeaderboard()
      .then(setBoard)
      .catch(() => setError('Kunde inte ladda ställningen.'));
  }, []);

  // Per-match detail for both players whenever a (valid) rival is selected. State is only
  // set in the async callbacks (never synchronously in the effect body); staleness is
  // handled by the `ready` check below, which ties the loaded data to the current rival.
  useEffect(() => {
    if (!user || !rivalId || rivalId === user.userId) return undefined;
    let active = true;
    Promise.all([api.getUserPredictions(user.userId), api.getUserPredictions(rivalId)])
      .then(([m, t]) => { if (active) { setMine(m); setTheirs(t); setError(null); } })
      .catch(() => { if (active) setError('Kunde inte ladda tipsen.'); });
    return () => { active = false; };
  }, [user, rivalId]);

  if (!user) return null;

  // The loaded predictions belong to the currently selected pair (guards against showing
  // a previous rival's data while a new fetch is in flight).
  const ready = !!(mine && theirs && mine.user?.userId === user.userId && theirs.user?.userId === rivalId);
  const loading = !!rivalId && rivalId !== user.userId && !ready && !error;

  const users = board?.users || [];
  const total = board?.count ?? users.length;
  const others = users.filter((u) => u.userId !== user.userId);
  const rowOf = (id) => {
    const u = users.find((x) => x.userId === id);
    return u ? { ...u, total } : null;
  };
  const meRow = rowOf(user.userId);
  const rivalRow = rivalId ? rowOf(rivalId) : null;

  // Join the two match lists by id; keep only decided matches both sides can see.
  let rows = [];
  let tally = { me: 0, them: 0, tie: 0 };
  if (ready) {
    const theirById = new Map((theirs.matches || []).map((m) => [m.id, m]));
    rows = (mine.matches || [])
      .filter((m) => m.actual)
      .sort((a, b) => a.matchNumber - b.matchNumber)
      .map((m) => {
        const t = theirById.get(m.id) || {};
        const myPts = m.points || 0;
        const theirPts = t.points || 0;
        if (myPts > theirPts) tally.me += 1;
        else if (theirPts > myPts) tally.them += 1;
        else tally.tie += 1;
        return {
          id: m.id,
          group: m.group,
          home: { team: m.homeTeam, flag: m.homeFlag },
          away: { team: m.awayTeam, flag: m.awayFlag },
          actual: m.actual,
          mine: { prediction: m.prediction || null, points: myPts },
          theirs: { prediction: t.prediction || null, points: theirPts },
        };
      });
  }

  // Group the compared matches by group letter, with a per-group head-to-head tally.
  const groupMap = new Map();
  for (const r of rows) {
    if (!groupMap.has(r.group)) groupMap.set(r.group, { letter: r.group, me: 0, them: 0, tie: 0, rows: [] });
    const g = groupMap.get(r.group);
    g.rows.push(r);
    if (r.mine.points > r.theirs.points) g.me += 1;
    else if (r.theirs.points > r.mine.points) g.them += 1;
    else g.tie += 1;
  }
  const groups = [...groupMap.values()].sort((a, b) => a.letter.localeCompare(b.letter, 'sv'));
  const groupGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '16px',
    alignItems: 'start',
  };

  const div = bracketDivergence(mine?.playoff, theirs?.playoff);
  const summaryText = tally.me === tally.them
    ? `Oavgjort ${tally.me}–${tally.them} på avgjorda matcher${tally.tie ? ` (${tally.tie} lika)` : ''}`
    : `${tally.me > tally.them ? 'Du leder' : `${rivalRow?.displayName} leder`} ${Math.max(tally.me, tally.them)}–${Math.min(tally.me, tally.them)} på avgjorda matcher${tally.tie ? ` (${tally.tie} lika)` : ''}`;

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Trivseltipset · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Jämför tips</h1>
        <p style={styles.sub}>Ställ dina tips mot en annan deltagares, match för match.</p>
        <Link to="/leaderboard" style={styles.back}>← Tillbaka till ställningen</Link>
      </section>

      <div style={styles.page}>
        {error && <p style={styles.error}>{error}</p>}

        <div style={styles.pickerRow}>
          <span style={styles.pickerLabel}>Jämför mot:</span>
          <select
            style={styles.select}
            value={rivalId || ''}
            onChange={(e) => navigate(e.target.value ? `/jamfor/${e.target.value}` : '/jamfor')}
          >
            <option value="">Välj deltagare…</option>
            {others.map((u) => (
              <option key={u.userId} value={u.userId}>{u.displayName}</option>
            ))}
          </select>
        </div>

        {!rivalId && (
          <p style={styles.empty}>Välj en deltagare ovan för att jämföra era tips.</p>
        )}

        {rivalId && meRow && rivalRow && (
          <>
            <div style={styles.vsCard}>
              <PlayerColumn row={meRow} isMe />
              <div style={styles.vsMid}>VS</div>
              <PlayerColumn row={rivalRow} isMe={false} />
            </div>

            {loading && <p style={styles.empty}>Laddar tips…</p>}

            {ready && (
              <>
                {rows.length > 0 && <div style={styles.summary}>{summaryText}</div>}

                {div != null && div.shared > 0 && (
                  <div style={styles.summary}>
                    Slutspelsträd: {div.differ === 0
                      ? 'identiska val hittills 🤝'
                      : `ni skiljer er på ${div.differ} av ${div.shared} val`}
                  </div>
                )}
                {div == null && (
                  <div style={styles.playoffNote}>
                    Slutspelstipsen jämförs här när slutspelet startar och tipsen låses.
                  </div>
                )}

                <h2 style={styles.sectionTitle}>Gruppspel – avgjorda matcher</h2>
                {groups.length === 0 ? (
                  <p style={styles.empty}>Inga avgjorda matcher att jämföra än.</p>
                ) : (
                  <div style={groupGridStyle}>
                    {groups.map((g) => (
                      <GroupSection key={g.letter} group={g} rows={g.rows} />
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
