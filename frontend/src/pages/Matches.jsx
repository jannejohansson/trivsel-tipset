import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import GroupTabs from '../components/GroupTabs.jsx';
import BracketTree from '../components/BracketTree.jsx';
import ThirdPlaceTable from '../components/ThirdPlaceTable.jsx';
import LockBanner from '../components/LockBanner.jsx';
import LockCountdown from '../components/LockCountdown.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { buildBracket } from '../lib/bracket.js';
import { TOTAL_MATCHES, TOTAL_PLAYOFF } from '../lib/constants.js';

const styles = {
  hero: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    padding: '36px 20px 28px',
    textAlign: 'center',
  },
  eyebrow: {
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '8px',
    fontWeight: 600,
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    margin: 0,
  },
  sub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '14px',
    marginTop: '8px',
  },
  page: {
    margin: '0 auto',
    padding: '24px 20px 60px',
  },
  segment: {
    display: 'flex',
    gap: '8px',
    marginBottom: '20px',
    justifyContent: 'center',
  },
  segBtn: {
    flex: 1,
    maxWidth: '220px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    padding: '10px 16px',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  segBtnActive: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    borderColor: 'transparent',
    color: '#ffffff',
    boxShadow: '0 4px 10px rgba(21,163,74,0.25)',
  },
  notice: {
    background: 'rgba(184,134,11,0.10)', border: '1px solid rgba(184,134,11,0.35)',
    color: 'var(--text)', borderRadius: 'var(--radius)', padding: '12px 16px',
    fontSize: '14px', marginBottom: '20px',
  },
  infoNote: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', borderRadius: 'var(--radius)', padding: '12px 16px',
    fontSize: '13px', lineHeight: 1.5, marginBottom: '20px',
  },
  scroller: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '12px' },
  champ: {
    marginBottom: '20px', padding: '10px 18px',
    background: 'rgba(21,163,74,0.10)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap',
  },
  champLabel: { fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 },
  champName: { fontSize: '26px', fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '10px' },
  flag: { width: '32px', height: '24px', borderRadius: '3px', backgroundSize: 'cover', backgroundPosition: 'center', display: 'inline-block', boxShadow: '0 1px 3px rgba(13,27,42,0.2)' },
  error: {
    color: 'var(--danger)',
    padding: '16px',
    background: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 'var(--radius)',
    textAlign: 'center',
  },
};

// Combined predictions page. `view` ('group' | 'playoff') is driven by the route
// (/matches vs /slutspel) so the navbar and the in-page toggle stay in sync.
export default function Matches({ view = 'group' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState(new Map());
  const [actualResults, setActualResults] = useState(new Map());
  const [picks, setPicks] = useState({});
  const [groupLocked, setGroupLocked] = useState(false);
  const [playoffLocked, setPlayoffLocked] = useState(false);
  const [playoffLockoutUtc, setPlayoffLockoutUtc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    Promise.all([api.getMatches(), api.getPlayoff(), api.getResults()])
      .then(([m, p, r]) => {
        setMatches(m.matches);
        setGroupLocked(m.locked);
        const predMap = new Map();
        for (const match of m.matches) if (match.prediction) predMap.set(match.id, match.prediction);
        setPredictions(predMap);
        setActualResults(new Map(Object.entries(r.groupResults || {})));
        const pk = {};
        for (const ko of p.matches) if (ko.pick) pk[ko.id] = ko.pick;
        setPicks(pk);
        setPlayoffLocked(p.locked);
        setPlayoffLockoutUtc(p.lockoutUtc);
      })
      .catch(() => setError('Kunde inte ladda tipsen. Försök igen.'))
      .finally(() => setLoading(false));
  }, []);

  const handlePredictionChange = (matchId, pred) => {
    setPredictions((prev) => {
      const next = new Map(prev);
      next.set(matchId, pred);
      return next;
    });
  };

  const handleResetGroup = (group) =>
    api.resetGroupPredictions(group).then(({ cleared }) => {
      if (cleared?.length) {
        setPredictions((prev) => {
          const next = new Map(prev);
          for (const id of cleared) next.delete(id);
          return next;
        });
      }
      return cleared;
    });

  const bracket = useMemo(
    () => buildBracket(matches, predictions, picks, { allowPartial: true }),
    [matches, predictions, picks]
  );

  const handlePick = (koMatchId, winner) => {
    if (playoffLocked || !winner) return;
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
    return (
      <div style={{ ...styles.page, maxWidth: '900px', textAlign: 'center', paddingTop: '80px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Laddar tips...</span>
      </div>
    );
  }

  if (error) {
    return <div style={{ ...styles.page, maxWidth: '900px' }}><p style={styles.error}>{error}</p></div>;
  }

  const isPlayoff = view === 'playoff';
  const isThirds = view === 'thirds';

  // Progress counters powering the "matches left to predict" notices.
  const groupPredicted = predictions.size;
  const groupRemaining = Math.max(0, TOTAL_MATCHES - groupPredicted);
  const playoffPredicted = bracket.matches.filter((m) => m.pick).length;
  const playoffRemaining = Math.max(0, TOTAL_PLAYOFF - playoffPredicted);

  const champ = bracket.matches.find((m) => m.id === 'ko_104');
  const champFlag = champ && champ.pick ? (champ.home.team === champ.pick ? champ.home.flag : champ.away.flag) : null;

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>
          {isPlayoff ? 'Slutspel' : isThirds ? 'Grupptreor' : 'Gruppspel'} · FIFA World Cup 2026
        </div>
        <h1 style={styles.title}>{isPlayoff ? 'Ditt slutspelsträd' : isThirds ? 'Bästa grupptreorna' : 'Dina tips'}</h1>
        <p style={styles.sub}>
          {isPlayoff
            ? (playoffLocked ? 'Slutspelstipsen är låsta.' : `${user?.displayName || user?.email} · Tippa vilka som går vidare i slutspelet`)
            : isThirds
              ? 'De 8 bästa treorna går vidare till slutspelet – baserat på dina gruppspelstips'
              : (groupLocked ? 'Tipsen är låsta.' : `${user?.displayName || user?.email} · Tippa resultat i alla gruppspelsmatcher`)}
        </p>
      </section>

      <div style={{ ...styles.page, maxWidth: '1100px' }}>
        <div style={styles.segment}>
          <button
            type="button"
            style={{ ...styles.segBtn, ...(!isPlayoff && !isThirds ? styles.segBtnActive : {}) }}
            onClick={() => navigate('/matches')}
            aria-pressed={!isPlayoff && !isThirds}
          >
            Gruppspel
          </button>
          <button
            type="button"
            style={{ ...styles.segBtn, ...(isThirds ? styles.segBtnActive : {}) }}
            onClick={() => navigate('/grupptreor')}
            aria-pressed={isThirds}
          >
            Grupptreor
          </button>
          <button
            type="button"
            style={{ ...styles.segBtn, ...(isPlayoff ? styles.segBtnActive : {}) }}
            onClick={() => navigate('/slutspel')}
            aria-pressed={isPlayoff}
          >
            Slutspel
          </button>
        </div>

        {isPlayoff ? (
          <>
            {playoffLocked ? <LockBanner /> : <LockCountdown lockoutUtc={playoffLockoutUtc} />}
            {!playoffLocked && playoffRemaining > 0 && (
              <div style={styles.notice}>⚠ Du har tippat {playoffPredicted} av {TOTAL_PLAYOFF} slutspelsval. {playoffRemaining} kvar att tippa.</div>
            )}
            {!bracket.allComplete && (
              <div style={styles.notice}>
                Slutspelsträdet är ifyllt utifrån dina gruppspelstips hittills. Du har inte tippat alla
                gruppspelsmatcher under <strong>Gruppspel</strong> — fyll i resten för att placera lagen rätt.
              </div>
            )}
            {saveError && <div style={styles.notice}>Kunde inte spara senaste valet. Kontrollera anslutningen.</div>}

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

            <div style={styles.scroller}>
              <div style={{ minWidth: 'min-content' }}>
                <BracketTree matches={bracket.matches} locked={playoffLocked} onPick={handlePick} />
              </div>
            </div>
          </>
        ) : isThirds ? (
          <>
            <div style={styles.infoNote}>
              Tabellen visar de tolv grupptreorna rangordnade utifrån <strong>dina gruppspelstips</strong>:
              först poäng, sedan målskillnad och flest gjorda mål. De 8 bästa går vidare till slutspelet och
              placeras i slutspelsträdet enligt Fifas schema (Annex C). Vill du ändra ordningen? Justera dina
              resultat under <strong>Gruppspel</strong> så uppdateras tabellen direkt.
            </div>
            <ThirdPlaceTable
              matches={matches}
              predictions={predictions}
              title="Grupptreor · Tabell – baserad på ditt tips"
            />
          </>
        ) : (
          <>
            {groupLocked && <LockBanner />}
            {!groupLocked && groupRemaining > 0 && (
              <div style={styles.notice}>⚠ Du har tippat {groupPredicted} av {TOTAL_MATCHES} gruppspelsmatcher. {groupRemaining} kvar att tippa.</div>
            )}
            <GroupTabs
              matches={matches}
              locked={groupLocked}
              predictions={predictions}
              onPredictionChange={handlePredictionChange}
              onResetGroup={handleResetGroup}
              results={actualResults}
            />
          </>
        )}
      </div>
    </>
  );
}
