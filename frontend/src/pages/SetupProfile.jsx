import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../api.js';

const styles = {
  page: {
    maxWidth: '400px',
    margin: '0 auto',
    padding: '60px 20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '8px',
    color: 'var(--text)',
  },
  sub: {
    color: 'var(--text-muted)',
    fontSize: '14px',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontSize: '15px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  hint: {
    color: 'var(--text-muted)',
    fontSize: '12px',
    marginTop: '-4px',
  },
  btn: {
    padding: '12px',
    background: 'var(--green)',
    color: '#000',
    fontWeight: 700,
    fontSize: '15px',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  error: {
    color: 'var(--danger)',
    fontSize: '13px',
    padding: '10px 14px',
    background: 'rgba(248, 81, 73, 0.1)',
    border: '1px solid rgba(248, 81, 73, 0.3)',
    borderRadius: 'var(--radius)',
  },
};

export default function SetupProfile() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  // Pre-fill once user is loaded
  const initialName = displayName || user.displayName || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = displayName.trim();
    if (!name) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.updateProfile(name);
      await refresh();
      navigate('/matches', { replace: true });
    } catch (err) {
      setError(err.message || 'Något gick fel. Försök igen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Välj ett visningsnamn</h1>
      <p style={styles.sub}>
        Ditt namn visas i resultattabellen. Du kan ändra det här senare.
      </p>

      {error && <p style={{ ...styles.error, marginBottom: '16px' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="text"
          maxLength={30}
          placeholder="Ditt namn"
          value={displayName || initialName}
          onChange={e => setDisplayName(e.target.value)}
          required
          autoFocus
        />
        <p style={styles.hint}>Max 30 tecken</p>
        <button
          type="submit"
          style={{ ...styles.btn, ...(submitting ? styles.btnDisabled : {}) }}
          disabled={submitting}
        >
          {submitting ? 'Sparar...' : 'Spara och fortsätt'}
        </button>
      </form>
    </div>
  );
}
