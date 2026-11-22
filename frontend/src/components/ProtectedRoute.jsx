import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

// Protected page: must be logged in. Optional `roles` = role based access on the frontend too.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="empty">
        <Icon name="lock" size={32} />
        <h2>This page is not available for your role</h2>
        <p>You are logged in as {user.role}. Ask an admin if you need access.</p>
      </div>
    );
  }
  return children;
}
