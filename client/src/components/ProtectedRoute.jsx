import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Strict role check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their respective authorized dashboard
    if (user.role === 'manager') {
      return <Navigate to="/manager" replace />;
    } else if (user.role === 'housekeeper') {
      return <Navigate to="/housekeeper" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
