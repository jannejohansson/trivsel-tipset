import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import GroupTabs from '../components/GroupTabs.jsx';
import BracketTree from '../components/BracketTree.jsx';

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
  back: {
    display: 'inline-block', marginTop: '14px', color: '#ffffff', fontSize: '13px',
    textDecoration: 'none', opacity: 0.9,
  },
  page: { maxWidth: '1100px', margin: '0 auto', padding: '24px 20px 60px' },
  toolbar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '12px', marginBottom: '20px', flexWrap: 'wrap',
  },
  segment: { display: 'flex', gap: '8px', flex: 1, justifyContent: 'center' },
  segBtn: {
    flex: 1, maxWidth: '220px',
    background: 'var(--surface)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', padding: '10px 16px', borderRadius: 'var(--radius)',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
  },
  segBtnActive: {
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    borderColor: 'transparent', color: '#ffffff',
    boxShadow: '0 4px 10px rgba(21,163,74,0.25)',
  },
  revealBtn: {
    background: 'rgba(184,134,11,0.12)', border: '1px solid rgba(184,134,11,0.4)',
    color: 'var(--text)', padding: '8px 14px', borderRadius: 'var(--radius)',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
  },
  notice: {
    background: 'rgba(184,134,11,0.10)', border: '1px solid rgba(184,134,11,0.35)',
    color: 'var(--text)', borderRadius: 'var(--radius)', padding: '12px 16px',
    fontSize: '14px', marginBottom: '20px',
  },
  champ: {
    marginBottom: '20px', padding: '10px 18px',
    background: 'rgba(21,163,74,0.10)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap',
  },
  champLabel: { fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 },
  champName: { fontSize: '26px', fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '10px' },
  flag: { width: '32px', height: '24px', borderRadius: '3px', backgroundSize: 'cover', backgroundPosition: 'center', display: 'inline-block', boxShadow: '0 1px 3px rgba(13,27,42,0.2)' },
  scoreLine: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginTop: '16px' },
  error: { color: 'var(--danger)', padding: '16px', background: 'rgba(220,38,38,0.08)', borderRadius: 'var(--radius)', textAlign: 'center' },
};

export default function UserPredictions() {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reveal, setReveal] = useState(false);
  const [view, setView] = useState('group'); // 'group' | 'playoff'

  useEffect(() => {
    api.getUserPredictions(userId, reveal)
      .then((d) => { setData(d); setError(null); })
      .catch(() => setError('Kunde inte ladda tipsen.'))
      .finally(() => setLoading(false));
  }, [userId, reveal]);

  if (loading && !data) {
    return <div style={{ ...styles.page, textAlign: 'center', paddingTop: '80px' }}><span style={{ color: 'var(--text-muted)' }}>Laddar tips...</span></div>;
  }
  if (error) {
    return <div style={styles.page}><p style={styles.error}>{error}</p></div>;
  }

  const name = data.user.displayName;
  const playoff = data.playoff;
  const champ = playoff?.matches.find((m) => m.id === 'ko_104');
  const champFlag = champ && champ.pick ? (champ.home.team === champ.pick ? champ.home.flag : champ.away.flag) : null;
  const showReveal = data.viewerIsAdmin && !data.isSelf;

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.eyebrow}>Deltagartips · FIFA World Cup 2026</div>
        <h1 style={styles.title}>{name}s tips</h1>
        <Link to="/leaderboard" style={styles.back}>← Tillbaka till ställningen</Link>
      </section>

      <div style={styles.page}>
        <div style={styles.toolbar}>
          <div style={styles.segment}>
            <button
              style={{ ...styles.segBtn, ...(view === 'group' ? styles.segBtnActive : {}) }}
              onClick={() => setView('group')}
            >
              Gruppspel
            </button>
            <button
              style={{ ...styles.segBtn, ...(view === 'playoff' ? styles.segBtnActive : {}) }}
              onClick={() => setView('playoff')}
            >
              Slutspel
            </button>
          </div>
          {showReveal && (
            <button style={styles.revealBtn} onClick={() => setReveal((r) => !r)}>
              {reveal ? '🔓 Dölj' : '🔓 Visa allt (admin)'}
            </button>
          )}
        </div>

        {view === 'group' && (
          <GroupTabs matches={data.matches} readOnly />
        )}

        {view === 'playoff' && (
          playoff ? (
            <>
              <div style={styles.champ}>
                <div style={styles.champLabel}>{name}s världsmästare</div>
                <div style={styles.champName}>
                  {champ && champ.pick ? (
                    <>
                      <span className={`fi fi-${champFlag}`} style={styles.flag} aria-hidden="true" />
                      {champ.pick}
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '16px', fontWeight: 500 }}>Inte vald</span>
                  )}
                </div>
              </div>
              <BracketTree matches={playoff.matches} locked onPick={() => {}} />
              {data.playoffLocked && data.playoffScore && (
                <p style={styles.scoreLine}>Slutspelspoäng: <strong>{data.playoffScore.total} p</strong></p>
              )}
            </>
          ) : (
            <div style={styles.notice}>
              Slutspelstipsen visas när gruppspelet är spelklart.
            </div>
          )
        )}
      </div>
    </>
  );
}
