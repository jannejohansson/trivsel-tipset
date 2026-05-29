import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontWeight: 700,
    fontSize: '18px',
    color: 'var(--green)',
    textDecoration: 'none',
  },
  links: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    fontSize: '14px',
  },
  link: {
    color: 'var(--text-muted)',
    textDecoration: 'none',
  },
  predictGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 10px',
    border: '1px solid var(--border)',
    borderRadius: '999px',
    background: 'var(--surface-2)',
  },
  predictLabel: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
  },
  predictLink: {
    color: 'var(--text)',
    fontWeight: 600,
    textDecoration: 'none',
  },
  btn: {
    background: 'none',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    padding: '6px 14px',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>⚽ Trivseltipset 2026</Link>
      <div style={styles.links}>
        <span style={styles.predictGroup}>
          <span style={styles.predictLabel}>Tippa</span>
          <Link to="/matches" style={styles.predictLink}>Gruppspel</Link>
          <Link to="/slutspel" style={styles.predictLink}>Slutspel</Link>
        </span>
        <Link to="/leaderboard" style={styles.link}>Ställning</Link>
        <Link to="/regler" style={styles.link}>Regler</Link>
        {!loading && user?.isAdmin && <Link to="/admin" style={styles.link}>Admin</Link>}
        {!loading && (
          user
            ? <button style={styles.btn} onClick={handleLogout}>Logga ut</button>
            : <Link to="/login" style={styles.link}>Logga in</Link>
        )}
      </div>
    </nav>
  );
}
