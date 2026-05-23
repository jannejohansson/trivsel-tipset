import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 16px' }}>
        <span style={{ color: 'var(--text-muted)' }}>Laddar...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.displayNameConfirmed && location.pathname !== '/setup') {
    return <Navigate to="/setup" replace />;
  }

  return children;
}
