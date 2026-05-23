import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Countdown from '../components/Countdown.jsx';

const styles = {
  page: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '60px 20px',
    textAlign: 'center',
  },
  title: {
    fontSize: '40px',
    fontWeight: 800,
    color: 'var(--text)',
    lineHeight: 1.2,
    marginBottom: '12px',
  },
  sub: {
    color: 'var(--text-muted)',
    fontSize: '16px',
    marginBottom: '8px',
  },
  date: {
    color: 'var(--green)',
    fontSize: '14px',
    marginBottom: '40px',
  },
  cta: {
    display: 'inline-block',
    marginTop: '16px',
    background: 'var(--green)',
    color: '#000',
    fontWeight: 700,
    fontSize: '15px',
    padding: '12px 28px',
    borderRadius: 'var(--radius)',
    textDecoration: 'none',
  },
  or: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    margin: '16px 0',
  },
  secondary: {
    color: 'var(--accent)',
    fontSize: '14px',
  },
};

export default function Landing() {
  const { user } = useAuth();

  return (
    <div style={styles.page}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚽</div>
      <h1 style={styles.title}>Trivseltipset</h1>
      <p style={styles.sub}>Tippa alla gruppspelsmatcher i VM 2026</p>
      <p style={styles.date}>Kampstart: 11 juni 2026 i USA, Kanada &amp; Mexiko</p>

      <Countdown />

      {user ? (
        <Link to="/matches" style={styles.cta}>Gå till mina tips →</Link>
      ) : (
        <>
          <Link to="/login" style={styles.cta}>Logga in för att tippa</Link>
          <p style={styles.or}>Ingen registrering krävs — bara e-post</p>
        </>
      )}

      {user && (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '24px' }}>
          Inloggad som {user.email}
        </p>
      )}
    </div>
  );
}
