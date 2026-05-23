import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  success: {
    textAlign: 'center',
    padding: '32px 0',
  },
  successIcon: { fontSize: '48px', marginBottom: '16px' },
  successTitle: { fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--green)' },
  successSub: { color: 'var(--text-muted)', fontSize: '14px' },
};

const ERROR_MESSAGES = {
  invalid: 'Länken är ogiltig eller har redan använts. Begär en ny nedan.',
  expired: 'Länken har gått ut. Begär en ny nedan.',
  not_allowed: 'Din e-postadress finns inte med i listan. Kontakta administratören.',
};

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(params.get('error') ? ERROR_MESSAGES[params.get('error')] || 'Något gick fel.' : null);

  useEffect(() => {
    if (user) navigate('/matches', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.sendMagicLink(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      if (err.status === 403) {
        setError(ERROR_MESSAGES.not_allowed);
      } else {
        setError('Kunde inte skicka e-post. Försök igen.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div style={styles.page}>
        <div style={styles.success}>
          <div style={styles.successIcon}>📬</div>
          <div style={styles.successTitle}>Kolla din e-post!</div>
          <p style={styles.successSub}>
            Vi har skickat en inloggningslänk till <strong>{email}</strong>.<br />
            Länken är giltig i 15 minuter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Logga in</h1>
      <p style={styles.sub}>Ange din e-postadress — vi skickar en inloggningslänk.</p>

      {error && <p style={{ ...styles.error, marginBottom: '16px' }}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          style={styles.input}
          type="email"
          placeholder="din@epost.se"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
        <button
          type="submit"
          style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}
          disabled={loading}
        >
          {loading ? 'Skickar...' : 'Skicka inloggningslänk'}
        </button>
      </form>
    </div>
  );
}
