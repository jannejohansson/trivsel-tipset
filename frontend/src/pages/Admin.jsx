import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  buildBracket, computeAllStandings, rankThirdPlace,
} from '../lib/bracket.js';
import BracketTree from '../components/BracketTree.jsx';

function formatKickoff(utc) {
  return new Date(utc).toLocaleString('sv-SE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

const styles = {
  hero: { background: 'linear-gradient(135deg, #0d1b2a 0%, #7a1f1f 100%)', color: '#fff', padding: '28px 20px', textAlign: 'center' },
  title: { fontSize: '24px', fontWeight: 800, margin: 0 },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '6px' },
  page: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 60px' },
  section: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px', marginBottom: '24px', boxShadow: 'var(--shadow-card)' },
  h2: { fontSize: '16px', fontWeight: 800, margin: '0 0 12px' },
  hint: { fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px' },
  matchRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: '14px' },
  matchMeta: { width: '104px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '3px' },
  matchTime: { fontSize: '12px', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
  groupBadge: { alignSelf: 'flex-start', fontSize: '11px', fontWeight: 800, lineHeight: 1, padding: '2px 7px', borderRadius: '999px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' },
  teamL: { flex: 1, textAlign: 'right' },
  teamR: { flex: 1, textAlign: 'left' },
  input: { width: '44px', height: '34px', textAlign: 'center', fontSize: '16px', fontWeight: 700, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' },
  thirdRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: '14px' },
  rank: { width: '24px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' },
  qualBadge: { fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px', background: 'rgba(21,163,74,0.15)', color: '#0b6b32' },
  arrowBtn: { width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text)' },
  clearBtn: { width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 },
  clearBtnHidden: { width: '26px', flexShrink: 0, visibility: 'hidden' },
  flag: { width: '22px', height: '16px', borderRadius: '2px', backgroundSize: 'cover', backgroundPosition: 'center', display: 'inline-block', flexShrink: 0 },
  scroller: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '12px' },
  status: { fontSize: '12px', color: 'var(--text-muted)', minHeight: '16px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--border)' },
  userRowHidden: { opacity: 0.5 },
  userInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  userName: { fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
  hiddenTag: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: '999px', padding: '1px 7px' },
  userEmail: { fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  paidLabel: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', flexShrink: 0, fontWeight: 600 },
  removeBtn: { flexShrink: 0, background: 'none', border: '1px solid var(--border)', color: 'var(--danger)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  restoreBtn: { flexShrink: 0, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState([]);
  const [groupResults, setGroupResults] = useState({});
  const [knockoutWinners, setKnockoutWinners] = useState({});
  const [thirdOrder, setThirdOrder] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    Promise.all([api.getMatches(), api.getResults(), api.getUsers().catch(() => ({ users: [] }))])
      .then(([m, r, u]) => {
        setMatches(m.matches);
        setGroupResults(r.groupResults || {});
        setKnockoutWinners(r.knockoutWinners || {});
        setThirdOrder(r.thirdOrder || []);
        setUsers(u.users || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = (payload) => {
    setStatus('Sparar...');
    api.saveResults(payload)
      .then(() => setStatus('Sparat ✓'))
      .catch(() => setStatus('Fel vid sparande'));
  };

  const all = useMemo(() => computeAllStandings(matches, groupResults), [matches, groupResults]);
  const bracket = useMemo(
    () => buildBracket(matches, groupResults, knockoutWinners, { thirdOrder }),
    [matches, groupResults, knockoutWinners, thirdOrder]
  );

  // The 12 actual third-placed teams, ordered by saved thirdOrder or computed rank.
  const thirds = useMemo(() => rankThirdPlace(all, thirdOrder), [all, thirdOrder]);

  if (authLoading || loading) {
    return <div style={{ ...styles.page, textAlign: 'center', paddingTop: '80px' }}><span style={{ color: 'var(--text-muted)' }}>Laddar...</span></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;

  // All group matches in true kickoff order (matchNumber is grouped by group, not chronological).
  const sortedMatches = [...matches]
    .sort((a, b) => new Date(a.kickoffUtc) - new Date(b.kickoffUtc) || a.matchNumber - b.matchNumber);

  const setScore = (id, side, value) => {
    const v = value.replace(/[^0-9]/g, '').slice(0, 2);
    setGroupResults((prev) => {
      const cur = prev[id] || {};
      return { ...prev, [id]: { ...cur, [side]: v === '' ? '' : Number(v) } };
    });
  };
  const commitScore = (id) => {
    const r = groupResults[id];
    if (r && Number.isInteger(r.homeScore) && Number.isInteger(r.awayScore)) {
      save({ groupResults: { [id]: { homeScore: r.homeScore, awayScore: r.awayScore } } });
    }
  };
  // Clearing a result unlocks the match so users can edit predictions again
  // (unless its kickoff has already passed).
  const clearScore = (id) => {
    setGroupResults((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    save({ groupResults: { [id]: { homeScore: null, awayScore: null } } });
  };

  const moveThird = (i, dir) => {
    const order = thirds.map((t) => t.group);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    setThirdOrder(order);
    save({ thirdOrder: order });
  };

  const pickKo = (koId, winner) => {
    setKnockoutWinners((prev) => ({ ...prev, [koId]: winner }));
    save({ knockoutWinners: { [koId]: winner } });
  };

  // Optimistically patch a user flag (paid/hidden), reverting the row on failure.
  const patchUser = (u, patch) => {
    setUsers((prev) => prev.map((x) => (x.userId === u.userId ? { ...x, ...patch } : x)));
    setStatus('Sparar...');
    api.updateUser(u.userId, patch)
      .then(() => setStatus('Sparat ✓'))
      .catch(() => {
        setStatus('Fel vid sparande');
        const revert = Object.fromEntries(Object.keys(patch).map((k) => [k, u[k]]));
        setUsers((prev) => prev.map((x) => (x.userId === u.userId ? { ...x, ...revert } : x)));
      });
  };

  const togglePaid = (u) => patchUser(u, { paid: !u.paid });
  const setHidden = (u, hidden) => {
    if (hidden && !window.confirm(`Ta bort ${u.displayName} från ställningen? Tipsen sparas men deltagaren döljs.`)) return;
    patchUser(u, { hidden });
  };

  return (
    <>
      <section style={styles.hero}>
        <h1 style={styles.title}>Admin · Faktiska resultat</h1>
        <p style={styles.sub}>Ange verkliga resultat — poäng räknas ut automatiskt.</p>
      </section>

      <div style={styles.page}>
        <div style={styles.status}>{status}</div>

        {/* 1. Group results */}
        <div style={styles.section}>
          <h2 style={styles.h2}>1. Gruppspelsresultat</h2>
          <p style={styles.hint}>Alla matcher i spelordning. Faktiska slutresultat — tabellen och slutspelsträdet uppdateras automatiskt.</p>
          {sortedMatches.map((m) => {
            const r = groupResults[m.id] || {};
            return (
              <div key={m.id} style={styles.matchRow}>
                <div style={styles.matchMeta}>
                  <span style={styles.matchTime}>{formatKickoff(m.kickoffUtc)}</span>
                  <span style={styles.groupBadge}>Grupp {m.group}</span>
                </div>
                <span style={styles.teamL}>{m.homeTeam}</span>
                <span className={`fi fi-${m.homeFlag}`} style={styles.flag} aria-hidden="true" />
                <input style={styles.input} value={r.homeScore ?? ''} onChange={(e) => setScore(m.id, 'homeScore', e.target.value)} onBlur={() => commitScore(m.id)} inputMode="numeric" />
                <span style={{ color: 'var(--text-muted)' }}>–</span>
                <input style={styles.input} value={r.awayScore ?? ''} onChange={(e) => setScore(m.id, 'awayScore', e.target.value)} onBlur={() => commitScore(m.id)} inputMode="numeric" />
                <span className={`fi fi-${m.awayFlag}`} style={styles.flag} aria-hidden="true" />
                <span style={styles.teamR}>{m.awayTeam}</span>
                {Number.isInteger(r.homeScore) && Number.isInteger(r.awayScore) ? (
                  <button style={styles.clearBtn} onClick={() => clearScore(m.id)} title="Rensa resultat (låser upp matchen)">✕</button>
                ) : (
                  <span style={styles.clearBtnHidden} aria-hidden="true" />
                )}
              </div>
            );
          })}
        </div>

        {/* 2. Third-place ranking */}
        <div style={styles.section}>
          <h2 style={styles.h2}>2. Ranka trean i grupperna</h2>
          <p style={styles.hint}>De 8 högst rankade treorna går vidare. Justera ordningen där poäng/målskillnad inte räcker (fair play, Fifa-ranking).</p>
          {thirds.length < 12 && <p style={styles.hint}>Fyll i alla gruppresultat för att se alla 12 treor (just nu {thirds.length}).</p>}
          {thirds.map((t, i) => (
            <div key={t.group} style={styles.thirdRow}>
              <span style={styles.rank}>{i + 1}</span>
              <span className={`fi fi-${t.flag}`} style={styles.flag} aria-hidden="true" />
              <span style={{ flex: 1 }}>{t.team} <span style={{ color: 'var(--text-muted)' }}>(Grupp {t.group} · {t.Pts}p, {t.GD > 0 ? '+' : ''}{t.GD})</span></span>
              {i < 8 && <span style={styles.qualBadge}>Vidare</span>}
              <button style={styles.arrowBtn} onClick={() => moveThird(i, -1)} disabled={i === 0}>↑</button>
              <button style={styles.arrowBtn} onClick={() => moveThird(i, 1)} disabled={i === thirds.length - 1}>↓</button>
            </div>
          ))}
        </div>

        {/* 3. Knockout winners */}
        <div style={styles.section}>
          <h2 style={styles.h2}>3. Slutspelsvinnare</h2>
          <p style={styles.hint}>Klicka på laget som faktiskt gick vidare i varje match.</p>
          {!bracket.allComplete && <p style={styles.hint}>Sextondelsfinalerna fylls i när alla gruppresultat är inlagda.</p>}
          <BracketTree matches={bracket.matches} locked={false} onPick={pickKo} />
        </div>

        {/* 4. Participants */}
        <div style={styles.section}>
          <h2 style={styles.h2}>4. Deltagare</h2>
          <p style={styles.hint}>Markera betald avgift och dölj deltagare vid behov. Dolda deltagare visas inte i ställningen men behåller sina tips.</p>
          {users.length === 0 && <p style={styles.hint}>Inga deltagare ännu.</p>}
          {users.map((u) => (
            <div key={u.userId} style={{ ...styles.userRow, ...(u.hidden ? styles.userRowHidden : {}) }}>
              <div style={styles.userInfo}>
                <span style={styles.userName}>
                  {u.displayName}
                  {u.hidden && <span style={styles.hiddenTag}>dold</span>}
                </span>
                <span style={styles.userEmail}>{u.email}</span>
              </div>
              <label style={styles.paidLabel}>
                <input type="checkbox" checked={u.paid} onChange={() => togglePaid(u)} />
                Betalat
              </label>
              {u.hidden ? (
                <button style={styles.restoreBtn} onClick={() => setHidden(u, false)}>Återställ</button>
              ) : (
                <button style={styles.removeBtn} onClick={() => setHidden(u, true)}>Dölj</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
