import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useIsMobile } from '../lib/useIsMobile.js';

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 700,
    fontSize: '18px',
    color: 'var(--green)',
    textDecoration: 'none',
    minWidth: 0,
  },
  logoImg: {
    height: '26px',
    width: 'auto',
    display: 'block',
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
  account: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    maxWidth: '180px',
    padding: '6px 12px',
    borderRadius: '999px',
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    color: 'var(--text)',
    fontWeight: 600,
    textDecoration: 'none',
  },
  accountDot: {
    width: '6px',
    height: '6px',
    borderRadius: '999px',
    background: 'var(--green)',
    flexShrink: 0,
  },
  accountName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // ── Mobile ───────────────────────────────────────────────
  menuBtn: {
    background: 'none',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '20px',
    lineHeight: 1,
    padding: '6px 11px',
    cursor: 'pointer',
  },
  mobileMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 20px 16px',
  },
  mobileLink: {
    display: 'block',
    padding: '12px 4px',
    color: 'var(--text)',
    fontSize: '16px',
    fontWeight: 600,
    textDecoration: 'none',
    borderBottom: '1px solid var(--border)',
  },
};

export default function Navbar() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile(768);
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  if (isMobile) {
    return (
      <nav style={styles.nav}>
        <Link to="/" style={styles.logo} onClick={close}>
          <img src="/trivseltipset-logo.svg" alt="" style={styles.logoImg} aria-hidden="true" />
          Trivseltipset 2026
        </Link>
        <button
          type="button"
          style={styles.menuBtn}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Meny"
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        {menuOpen && (
          <div style={styles.mobileMenu}>
            <Link to="/matches" style={styles.mobileLink} onClick={close}>Tippa</Link>
            <Link to="/leaderboard" style={styles.mobileLink} onClick={close}>Ställning</Link>
            <Link to="/vad-tippar-andra" style={styles.mobileLink} onClick={close}>Vad tippar andra?</Link>
            <Link to="/regler" style={styles.mobileLink} onClick={close}>Regler</Link>
            {!loading && user?.isAdmin && (
              <Link to="/admin" style={styles.mobileLink} onClick={close}>Admin</Link>
            )}
            {!loading && (
              user
                ? <Link to="/profil" style={{ ...styles.mobileLink, borderBottom: 'none', color: 'var(--green)' }} onClick={close}>
                    Min profil ({user.displayName})
                  </Link>
                : <Link to="/login" style={{ ...styles.mobileLink, borderBottom: 'none' }} onClick={close}>Logga in</Link>
            )}
          </div>
        )}
      </nav>
    );
  }

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>
        <img src="/trivseltipset-logo.svg" alt="" style={styles.logoImg} aria-hidden="true" />
        Trivseltipset 2026
      </Link>
      <div style={styles.links}>
        <Link to="/matches" style={styles.link}>Tippa</Link>
        <Link to="/leaderboard" style={styles.link}>Ställning</Link>
        <Link to="/vad-tippar-andra" style={styles.link}>Vad tippar andra?</Link>
        <Link to="/regler" style={styles.link}>Regler</Link>
        {!loading && user?.isAdmin && <Link to="/admin" style={styles.link}>Admin</Link>}
        {!loading && (
          user
            ? <Link to="/profil" style={styles.account} title="Min profil">
                <span style={styles.accountDot} aria-hidden="true" />
                <span style={styles.accountName}>{user.displayName}</span>
              </Link>
            : <Link to="/login" style={styles.link}>Logga in</Link>
        )}
      </div>
    </nav>
  );
}
