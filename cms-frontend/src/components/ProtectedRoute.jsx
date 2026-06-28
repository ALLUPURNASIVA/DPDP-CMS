import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../api';

export default function ProtectedRoute({ allowedRoles, children }) {
  const { getAccessTokenSilently, isAuthenticated, isLoading } = useAuth0();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const verifyRole = async () => {
      try {
        // Always fetch from backend — never use cache
        const api = await getSecureClient(getAccessTokenSilently);
        const res = await api.get('/users/me');
        setRole(res.data.role);
      } catch (error) {
        console.error("Role check failed:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    verifyRole();
  }, [isAuthenticated, isLoading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-400">Verifying access...</p>
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}