import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wrap a page with this to require login, and optionally a specific role.
// This is a UX convenience only - the backend enforces the real
// authorization, so this component never needs to be "trusted".
export default function ProtectedRoute({ roles, children }) {
  const { user, token, loading } = useAuth();

  if (loading) return <p className="page-status">Loading...</p>;
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
