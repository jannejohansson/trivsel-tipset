import { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { TOTAL_MATCHES, TOTAL_PLAYOFF } from '../lib/constants.js';
import {
  buildBracket, computeAllStandings, rankThirdPlace,
} from '../lib/bracket.js';
import BracketTree from '../components/BracketTree.jsx';
import { useIsMobile } from '../lib/useIsMobile.js';

function formatKickoff(utc) {
  return new Date(utc).toLocaleString('sv-SE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

// Day bucket key in Swedish local time (matches Home.jsx). sv-SE renders 'YYYY-MM-DD',
// so plain string comparison orders days chronologically.
const dayKey = (d) => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(d);

// Human day heading from a dayKey, e.g. "onsdag 11 juni" (Swedish local time).
const dayLabel = (key) => new Date(`${key}T12:00:00Z`).toLocaleDateString('sv-SE', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Stockholm',
});

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
  matchRowMobile: { gap: '6px' },
  matchMetaMobile: { width: '60px' },
  matchTimeMobile: { fontSize: '11px', whiteSpace: 'normal' },
  teamL: { flex: 1, textAlign: 'right' },
  teamR: { flex: 1, textAlign: 'left' },
  input: { width: '44px', height: '34px', textAlign: 'center', fontSize: '16px', fontWeight: 700, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' },
  thirdRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: '14px' },
  rank: { width: '24px', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' },
  qualBadge: { fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '999px', background: 'rgba(21,163,74,0.15)', color: 'var(--green-text)' },
  arrowBtn: { width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text)' },
  sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', margin: '0 0 12px' },
  modeBadge: { fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' },
  modeAuto: { background: 'var(--surface-2)', color: 'var(--text-muted)' },
  modeManual: { background: 'rgba(184,134,11,0.15)', color: 'var(--text)' },
  resetBtn: { fontSize: '12px', fontWeight: 700, padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text)' },
  resetBtnDisabled: { opacity: 0.45, cursor: 'default' },
  scoringToggle: { display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 14px', margin: '0 0 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: '14px' },
  scoringCheckbox: { width: '18px', height: '18px', marginTop: '1px', flexShrink: 0, cursor: 'pointer' },
  scoringHint: { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' },
  clearBtn: { width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 },
  clearBtnHidden: { width: '26px', flexShrink: 0, visibility: 'hidden' },
  flag: { width: '22px', height: '16px', borderRadius: '2px', backgroundSize: 'cover', backgroundPosition: 'center', display: 'inline-block', flexShrink: 0 },
  subHead: { fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', margin: '18px 0 8px' },
  subHeadFirst: { marginTop: '4px' },
  emptyDay: { fontSize: '13px', color: 'var(--text-muted)', padding: '2px 2px 6px', margin: 0 },
  dayPanel: { border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '8px', overflow: 'hidden', background: 'var(--surface)' },
  dayHeader: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '10px 14px', background: 'var(--surface-2)', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)' },
  dayChevron: { display: 'inline-block', fontSize: '10px', color: 'var(--text-muted)', transition: 'transform .15s ease', flexShrink: 0 },
  dayChevronOpen: { transform: 'rotate(90deg)' },
  dayTitle: { fontWeight: 800, fontSize: '14px', textTransform: 'capitalize' },
  todayBadge: { fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', background: 'var(--green-dim)', color: 'var(--green-text)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  dayCount: { marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
  dayCountDone: { color: 'var(--green-text)' },
  dayBody: { padding: '0 14px 6px' },
  scroller: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '12px' },
  status: { fontSize: '12px', color: 'var(--text-muted)', minHeight: '16px' },
  userRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderTop: '1px solid var(--border)' },
  userRowHidden: { opacity: 0.5 },
  userInfo: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  userName: { fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' },
  hiddenTag: { fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', background: 'var(--surface-2)', borderRadius: '999px', padding: '1px 7px' },
  userEmail: { fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  chips: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' },
  chip: { display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
  chipDone: { background: 'var(--green-dim)', color: 'var(--green-text)' },
  chipWarn: { background: 'rgba(184,134,11,0.14)', color: 'var(--yellow)', border: '1px solid rgba(184,134,11,0.35)' },
  paidLabel: { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer', flexShrink: 0, fontWeight: 600 },
  titlesBox: { display: 'inline-flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
  titlesLabel: { fontSize: '13px', color: 'var(--text)', fontWeight: 600 },
  stepBtn: { width: '24px', height: '24px', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text)', fontSize: '15px', fontWeight: 700, lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit', padding: 0 },
  titlesVal: { minWidth: '20px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' },
  removeBtn: { flexShrink: 0, background: 'none', border: '1px solid var(--border)', color: 'var(--danger)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  restoreBtn: { flexShrink: 0, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
};

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [matches, setMatches] = useState([]);
  const [groupResults, setGroupResults] = useState({});
  const [knockoutWinners, setKnockoutWinners] = useState({});
  const [thirdOrder, setThirdOrder] = useState([]);
  const [playoffScoring, setPlayoffScoring] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  // Per-day collapse state for the group-results list, keyed by dayKey.
  // Absent ⇒ falls back to the day's default (past collapsed, today/upcoming open).
  const [openDays, setOpenDays] = useState({});

  useEffect(() => {
    Promise.all([api.getMatches(), api.getResults(), api.getUsers().catch(() => ({ users: [] }))])
      .then(([m, r, u]) => {
        setMatches(m.matches);
        setGroupResults(r.groupResults || {});
        setKnockoutWinners(r.knockoutWinners || {});
        setThirdOrder(r.thirdOrder || []);
        setPlayoffScoring(!!r.playoffScoring);
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
    // allowPartial fills the Round-of-32 tree from results so far, so the admin can
    // populate/pick the knockout before every group is finished.
    () => buildBracket(matches, groupResults, knockoutWinners, { thirdOrder, allowPartial: true }),
    [matches, groupResults, knockoutWinners, thirdOrder]
  );

  // The 12 actual third-placed teams, ordered by saved thirdOrder or computed rank.
  const thirds = useMemo(() => rankThirdPlace(all, thirdOrder), [all, thirdOrder]);
  // A non-empty saved order means the admin has overridden the automatic ranking.
  const manualThirdOrder = Array.isArray(thirdOrder) && thirdOrder.length > 0;
  const hasKnockoutWinners = Object.values(knockoutWinners).some(Boolean);

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

  // Bucket group matches by Swedish-local day, then split into past / today / upcoming
  // so the admin can collapse already-played days and focus on what's current.
  const groupsByDay = new Map();
  for (const m of sortedMatches) {
    const k = dayKey(new Date(m.kickoffUtc));
    if (!groupsByDay.has(k)) groupsByDay.set(k, []);
    groupsByDay.get(k).push(m);
  }
  const todayKey = dayKey(new Date());
  const dayEntries = [...groupsByDay.entries()];
  const pastDays = dayEntries.filter(([k]) => k < todayKey);
  const todayMatches = groupsByDay.get(todayKey) || [];
  const upcomingDays = dayEntries.filter(([k]) => k > todayKey);

  const isFilled = (m) => {
    const r = groupResults[m.id];
    return r && Number.isInteger(r.homeScore) && Number.isInteger(r.awayScore);
  };
  const filledCount = (ms) => ms.filter(isFilled).length;

  // One editable result row. A plain function (not a component) so React keeps the
  // <input>s mounted across re-renders and typing doesn't lose focus.
  const renderMatchRow = (m) => {
    const r = groupResults[m.id] || {};
    return (
      <div key={m.id} style={{ ...styles.matchRow, ...(isMobile ? styles.matchRowMobile : {}) }}>
        <div style={{ ...styles.matchMeta, ...(isMobile ? styles.matchMetaMobile : {}) }}>
          <span style={{ ...styles.matchTime, ...(isMobile ? styles.matchTimeMobile : {}) }}>{formatKickoff(m.kickoffUtc)}</span>
          <span style={styles.groupBadge}>{isMobile ? m.group : `Grupp ${m.group}`}</span>
        </div>
        {!isMobile && <span style={styles.teamL}>{m.homeTeam}</span>}
        <span className={`fi fi-${m.homeFlag}`} style={styles.flag} aria-hidden="true" />
        <input style={styles.input} value={r.homeScore ?? ''} onChange={(e) => setScore(m.id, 'homeScore', e.target.value)} onBlur={() => commitScore(m.id)} inputMode="numeric" />
        <span style={{ color: 'var(--text-muted)' }}>–</span>
        <input style={styles.input} value={r.awayScore ?? ''} onChange={(e) => setScore(m.id, 'awayScore', e.target.value)} onBlur={() => commitScore(m.id)} inputMode="numeric" />
        <span className={`fi fi-${m.awayFlag}`} style={styles.flag} aria-hidden="true" />
        {!isMobile && <span style={styles.teamR}>{m.awayTeam}</span>}
        {Number.isInteger(r.homeScore) && Number.isInteger(r.awayScore) ? (
          <button style={styles.clearBtn} onClick={() => clearScore(m.id)} title="Rensa resultat (låser upp matchen)">✕</button>
        ) : (
          <span style={styles.clearBtnHidden} aria-hidden="true" />
        )}
      </div>
    );
  };

  // Collapsible per-day panel with a filled/total badge. `defaultOpen` applies until
  // the admin toggles the day (tracked in openDays).
  const renderDayPanel = (k, ms, defaultOpen) => {
    const open = openDays[k] ?? defaultOpen;
    const filled = filledCount(ms);
    const done = filled === ms.length;
    return (
      <div key={k} style={styles.dayPanel}>
        <button
          type="button"
          style={styles.dayHeader}
          onClick={() => setOpenDays((p) => ({ ...p, [k]: !open }))}
          aria-expanded={open}
        >
          <span style={{ ...styles.dayChevron, ...(open ? styles.dayChevronOpen : {}) }}>▶</span>
          <span style={styles.dayTitle}>{dayLabel(k)}</span>
          {k === todayKey && <span style={styles.todayBadge}>Idag</span>}
          <span style={{ ...styles.dayCount, ...(done ? styles.dayCountDone : {}) }}>
            {filled}/{ms.length}{done ? ' ✓' : ''}
          </span>
        </button>
        {open && <div style={styles.dayBody}>{ms.map(renderMatchRow)}</div>}
      </div>
    );
  };

  const moveThird = (i, dir) => {
    const order = thirds.map((t) => t.group);
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    [order[i], order[j]] = [order[j], order[i]];
    setThirdOrder(order);
    save({ thirdOrder: order });
  };

  // Drop the manual order so the ranking falls back to automatic (points/goals).
  const resetThirdOrder = () => {
    setThirdOrder([]);
    save({ thirdOrder: [] });
  };

  const pickKo = (koId, winner) => {
    setKnockoutWinners((prev) => ({ ...prev, [koId]: winner }));
    save({ knockoutWinners: { [koId]: winner } });
  };

  const togglePlayoffScoring = (enabled) => {
    setPlayoffScoring(enabled);
    save({ playoffScoring: enabled });
  };

  // Clear every saved knockout winner so the bracket falls back to empty.
  const resetKnockout = () => {
    const ids = Object.keys(knockoutWinners).filter((id) => knockoutWinners[id]);
    if (ids.length === 0) return;
    if (!window.confirm('Rensa alla slutspelsvinnare? Trädet nollställs.')) return;
    setKnockoutWinners({});
    save({ knockoutWinners: Object.fromEntries(ids.map((id) => [id, null])) });
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
  // Previous-edition wins, shown as stars on the leaderboard. Clamp to the API's 0–20 range.
  const setTitles = (u, delta) => {
    const next = Math.max(0, Math.min(20, (u.titles || 0) + delta));
    if (next !== (u.titles || 0)) patchUser(u, { titles: next });
  };
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

        {/* 1. Knockout / playoff tree — kept at the top in preparation for playoff start */}
        <div style={styles.section}>
          <div style={styles.sectionHead}>
            <h2 style={{ ...styles.h2, margin: 0 }}>1. Slutspel</h2>
            <button
              style={{ ...styles.resetBtn, ...(hasKnockoutWinners ? {} : styles.resetBtnDisabled) }}
              onClick={resetKnockout}
              disabled={!hasKnockoutWinners}
              title="Rensa alla slutspelsvinnare"
            >
              ↺ Rensa trädet
            </button>
          </div>
          <p style={styles.hint}>Klicka på laget som faktiskt gick vidare i varje match. Sextondelsfinalerna fylls i utifrån resultaten hittills.</p>
          <label style={styles.scoringToggle}>
            <input
              type="checkbox"
              checked={playoffScoring}
              onChange={(e) => togglePlayoffScoring(e.target.checked)}
              style={styles.scoringCheckbox}
            />
            <span>
              <strong>Räkna slutspelspoäng till deltagarna</strong>
              <span style={styles.scoringHint}>
                {playoffScoring
                  ? 'På – deltagarna får poäng för sina slutspelstips utifrån resultaten ovan. Tipsen låses eller visas inte för andra förrän slutspelet startar (match 73).'
                  : 'Av – inga slutspelspoäng delas ut än. Slå på för att börja räkna poäng – det varken låser eller avslöjar någons slutspelstips.'}
              </span>
            </span>
          </label>
          <BracketTree matches={bracket.matches} locked={false} onPick={pickKo} />
        </div>

        {/* 2. Group results — grouped by day; played days collapsed, today + upcoming open */}
        <div style={styles.section}>
          <h2 style={styles.h2}>2. Gruppspelsresultat</h2>
          <p style={styles.hint}>Matcherna är grupperade per dag. Spelade dagar är hopfällda – klicka på en dag för att öppna. Faktiska slutresultat; tabellen och slutspelsträdet uppdateras automatiskt.</p>

          <div style={{ ...styles.subHead, ...styles.subHeadFirst }}>Idag</div>
          {todayMatches.length > 0
            ? renderDayPanel(todayKey, todayMatches, true)
            : <p style={styles.emptyDay}>Inga matcher idag.</p>}

          {upcomingDays.length > 0 && (
            <>
              <div style={styles.subHead}>Kommande</div>
              {upcomingDays.map(([k, ms]) => renderDayPanel(k, ms, true))}
            </>
          )}

          {pastDays.length > 0 && (
            <>
              <div style={styles.subHead}>Tidigare (spelade)</div>
              {pastDays.map(([k, ms]) => renderDayPanel(k, ms, false))}
            </>
          )}
        </div>

        {/* 3. Third-place ranking */}
        <div style={styles.section}>
          <div style={styles.sectionHead}>
            <h2 style={{ ...styles.h2, margin: 0 }}>3. Ranka trean i grupperna</h2>
            <span style={{ ...styles.modeBadge, ...(manualThirdOrder ? styles.modeManual : styles.modeAuto) }}>
              {manualThirdOrder ? 'Manuell ordning' : 'Automatisk ordning'}
            </span>
          </div>
          <p style={styles.hint}>
            {manualThirdOrder
              ? 'Din manuella ordning gäller. Återställ för att gå tillbaka till automatisk rangordning (poäng, målskillnad, gjorda mål).'
              : 'Rangordnas automatiskt efter poäng, målskillnad och gjorda mål. Flytta med pilarna där t.ex. fair play avgör – då gäller din ordning tills du återställer.'}
          </p>
          <button
            style={{ ...styles.resetBtn, ...(manualThirdOrder ? {} : styles.resetBtnDisabled), marginBottom: '14px' }}
            onClick={resetThirdOrder}
            disabled={!manualThirdOrder}
            title="Återställ till automatisk ordning (poäng & mål)"
          >
            ↺ Återställ till automatisk
          </button>
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
                <div style={styles.chips}>
                  {(() => {
                    const groupCount = u.groupPredictionCount ?? 0;
                    const playoffCount = u.playoffPredictionCount ?? 0;
                    const groupDone = groupCount >= TOTAL_MATCHES;
                    const playoffDone = playoffCount >= TOTAL_PLAYOFF;
                    return (
                      <>
                        <span style={{ ...styles.chip, ...(groupDone ? styles.chipDone : styles.chipWarn) }}>
                          {groupDone ? '✓' : '⚠'} Gruppspel {groupCount}/{TOTAL_MATCHES}
                        </span>
                        <span style={{ ...styles.chip, ...(playoffDone ? styles.chipDone : styles.chipWarn) }}>
                          {playoffDone ? '✓' : '⚠'} Slutspel {playoffCount}/{TOTAL_PLAYOFF}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <div style={styles.titlesBox} title="Tidigare segrar i Trivseltipset (visas som stjärnor)">
                <span style={styles.titlesLabel}>⭐ Segrar</span>
                <button type="button" style={styles.stepBtn} onClick={() => setTitles(u, -1)} disabled={(u.titles || 0) === 0} aria-label="Minska segrar">−</button>
                <span style={styles.titlesVal}>{u.titles || 0}</span>
                <button type="button" style={styles.stepBtn} onClick={() => setTitles(u, 1)} aria-label="Öka segrar">+</button>
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
