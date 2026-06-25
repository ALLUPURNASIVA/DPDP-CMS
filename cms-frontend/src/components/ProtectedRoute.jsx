import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../api';

// Wraps any route — only renders children if user has the right role
// Otherwise sends them to /unauthorized

export default function ProtectedRoute({ allowedRoles, children }) {
  const { getAccessTokenSilently } = useAuth0();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyRole = async () => {
      try {
        // First check sessionStorage (fast, already set during sync)
        const cachedRole = sessionStorage.getItem('userRole');
        if (cachedRole) {
          setRole(cachedRole);
          setLoading(false);
          return;
        }

        // Fallback — ask backend directly (e.g. on page refresh)
        const api = await getSecureClient(getAccessTokenSilently);
        const res = await api.get('/users/me');
        const fetchedRole = res.data.role;

        sessionStorage.setItem('userRole', fetchedRole);
        setRole(fetchedRole);

      } catch (error) {
        console.error("Role check failed:", error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    verifyRole();
  }, []);

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