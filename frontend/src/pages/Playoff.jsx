import { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { buildBracket } from '../lib/bracket.js';
import BracketTree from '../components/BracketTree.jsx';
import LockBanner from '../components/LockBanner.jsx';

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    padding: '36px 20px 28px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)', marginBottom: '8px', fontWeight: 600,
  },
  title: { fontSize: '28px', fontWeight: 800, letterSpacing: '-0.01em', margin: 0 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: '14px', marginTop: '8px' },
  page: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 60px' },
  notice: {
    background: 'rgba(184,134,11,0.10)', border: '1px solid rgba(184,134,11,0.35)',
    color: 'var(--text)', borderRadius: 'var(--radius)', padding: '12px 16px',
    fontSize: '14px', marginBottom: '20px',
  },
  scroller: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '12px' },
  champ: {
    marginTop: '24px', textAlign: 'center', padding: '18px',
    background: 'rgba(21,163,74,0.10)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  },
  champLabel: { fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 },
  champName: { fontSize: '22px', fontWeight: 800, marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  flag: { width: '32px', height: '24px', borderRadius: '3px', backgroundSize: 'cover', backgroundPosition: 'center', display: 'inline-block', boxShadow: '0 1px 3px rgba(13,27,42,0.2)' },
  error: { color: 'var(--danger)', padding: '16px', background: 'rgba(220,38,38,0.08)', borderRadius: 'var(--radius)', textAlign: 'center' },
};

export default function Playoff() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState(new Map());
  const [picks, setPicks] = useState({});
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    Promise.all([api.getMatches(), api.getPlayoff()])
      .then(([m, p]) => {
        setMatches(m.matches);
        const predMap = new Map();
        for (const match of m.matches) if (match.prediction) predMap.set(match.id, match.prediction);
        setPredictions(predMap);
        const pk = {};
        for (const ko of p.matches) if (ko.pick) pk[ko.id] = ko.pick;
        setPicks(pk);
        setLocked(p.locked);
      })
      .catch(() => setError('Kunde inte ladda slutspelet. Försök igen.'))
      .finally(() => setLoading(false));
  }, []);

  const bracket = useMemo(
    () => buildBracket(matches, predictions, picks),
    [matches, predictions, picks]
  );

  const handlePick = (koMatchId, winner) => {
    if (locked || !winner) return;
    setPicks((prev) => ({ ...prev, [koMatchId]: winner }));
    const mySeq = ++seq.current;
    api.savePlayoffPick(koMatchId, winner)
      .then((res) => {
        if (mySeq !== seq.current) return; // a newer pick superseded this one
        const pk = {};
        for (const ko of res.matches) if (ko.pick) pk[ko.id] = ko.pick;
        setPicks(pk);
        setSaveError(false);
      })
      .catch(() => setSaveError(true));
  };

  if (loading) {
    return <div style={{ ...styles.page, textAlign: 'center', paddingTop: '80px' }}><span style={{ color: 'var(--text-muted)' }}>Laddar slutspel...</span></div>;
  }
  if (error) {
    return <div style={styles.page}><p style={styles.error}>{error}</p></div>;
  }

  const champ = bracket.matches.find((m) => m.id === 'ko_104');
  const champFlag = champ && champ.pick ? (champ.home.team === champ.pick ? champ.home.flag : champ.away.flag) : null;

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Slutspel · FIFA World Cup 2026</div>
        <h1 style={styles.title}>Ditt slutspelsträd</h1>
        <p style={styles.sub}>
          {locked ? 'Slutspelstipsen är låsta.' : `${user?.displayName || user?.email} · välj vem som går vidare`}
        </p>
      </section>

      <div style={styles.page}>
        {locked && <LockBanner />}
        {!bracket.allComplete && (
          <div style={styles.notice}>
            Fyll i alla gruppspelsmatcher under <strong>Tippa</strong> för att låsa upp hela slutspelsträdet.
            Lagen placeras automatiskt utifrån dina gruppspelstips.
          </div>
        )}
        {saveError && <div style={styles.notice}>Kunde inte spara senaste valet. Kontrollera anslutningen.</div>}

        <BracketTree matches={bracket.matches} locked={locked} onPick={handlePick} />

        <div style={styles.champ}>
          <div style={styles.champLabel}>Din världsmästare</div>
          <div style={styles.champName}>
            {champ && champ.pick ? (
              <>
                <span className={`fi fi-${champFlag}`} style={styles.flag} aria-hidden="true" />
                {champ.pick}
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '16px', fontWeight: 500 }}>Inte vald än</span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
