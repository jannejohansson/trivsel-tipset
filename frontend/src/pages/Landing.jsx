import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Countdown from '../components/Countdown.jsx';

const styles = {
  hero: {
    position: 'relative',
    background: 'linear-gradient(135deg, #0d1b2a 0%, #15a34a 100%)',
    color: '#ffffff',
    paddingTop: '72px',
    paddingBottom: '120px',
    paddingLeft: '20px',
    paddingRight: '20px',
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    top: '-160px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '720px',
    height: '720px',
    background: 'radial-gradient(closest-side, rgba(255,255,255,0.18), transparent 70%)',
    pointerEvents: 'none',
  },
  heroInner: {
    position: 'relative',
    maxWidth: '760px',
    margin: '0 auto',
  },
  eyebrow: {
    fontSize: '12px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '20px',
    fontWeight: 600,
  },
  title: {
    fontSize: 'clamp(44px, 8vw, 72px)',
    fontWeight: 800,
    lineHeight: 1,
    margin: 0,
    letterSpacing: '-0.02em',
  },
  tagline: {
    marginTop: '20px',
    fontSize: '18px',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 1.5,
  },
  card: {
    position: 'relative',
    marginTop: '-72px',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '14px',
    boxShadow: 'var(--shadow-card)',
    padding: '28px 24px',
    textAlign: 'center',
  },
  kickoffLabel: {
    fontSize: '11px',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: 700,
    marginBottom: '4px',
  },
  ctaWrap: {
    textAlign: 'center',
    padding: '24px 20px 60px',
  },
  cta: {
    display: 'inline-block',
    background: 'var(--green)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '16px',
    padding: '14px 32px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
    boxShadow: '0 6px 16px rgba(21,163,74,0.28)',
  },
  ctaSub: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    marginTop: '14px',
  },
  venues: {
    marginTop: '28px',
    color: 'var(--text-muted)',
    fontSize: '13px',
  },
};

export default function Landing() {
  const { user } = useAuth();
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = 'var(--surface-2)';
    return () => { document.body.style.background = prev; };
  }, []);

  const ctaStyle = hover
    ? { ...styles.cta, transform: 'translateY(-1px)', boxShadow: '0 10px 22px rgba(21,163,74,0.32)' }
    : styles.cta;

  return (
    <>
      <section style={styles.hero}>
        <div style={styles.heroGlow} />
        <div style={styles.heroInner}>
          <div style={styles.eyebrow}>FIFA World Cup 2026 · USA · Canada · Mexico</div>
          <h1 style={styles.title}>Trivseltipset 2026</h1>
          <p style={styles.tagline}>Tippa fotbolls-VM 2026 med Torsdagsklubben</p>
        </div>
      </section>

      <div style={styles.card}>
        <div style={styles.kickoffLabel}>Kickoff 11 juni 2026</div>
        <Countdown />
      </div>

      <div style={styles.ctaWrap}>
        {user ? (
          <>
            <Link
              to="/matches"
              style={ctaStyle}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              Gå till mina tips →
            </Link>
            <p style={styles.ctaSub}>Inloggad som {user.email}</p>
          </>
        ) : (
          <>
            <Link
              to="/login"
              style={ctaStyle}
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
            >
              Logga in för att tippa
            </Link>
            <p style={styles.ctaSub}>Ingen registrering krävs — bara e-post</p>
          </>
        )}
        <p style={styles.venues}>🇺🇸 🇨🇦 🇲🇽  ·  16 städer  ·  104 matcher</p>
      </div>
    </>
  );
}
