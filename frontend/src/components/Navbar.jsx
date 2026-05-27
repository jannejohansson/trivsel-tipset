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
    gap: '20px',
    alignItems: 'center',
    fontSize: '14px',
  },
  link: {
    color: 'var(--text-muted)',
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
        <Link to="/matches" style={styles.link}>Tippa</Link>
        <Link to="/leaderboard" style={styles.link}>Tabell</Link>
        {!loading && (
          user
            ? <button style={styles.btn} onClick={handleLogout}>Logga ut</button>
            : <Link to="/login" style={styles.link}>Logga in</Link>
        )}
      </div>
    </nav>
  );
}
