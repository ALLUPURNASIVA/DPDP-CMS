import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { getSecureClient } from './api';

// Pages
import AdminPanel from './pages/Admin/AdminPanel';
import FiduciaryDashboard from "./pages/Fiduciary/FiduciaryDashboard";
import WorkerDashboard from "./pages/Worker/WorkerDashboard";
import UserDashboard from "./pages/GeneralUser/UserDashboard";
import ExploreCompanies from "./pages/GeneralUser/ExploreCompanies";
import ConsentManager from './pages/GeneralUser/ConsentManager';
import ActiveConsents from "./pages/GeneralUser/ActiveConsents";
import ActivityHistory from "./pages/GeneralUser/ActivityHistory";
import Profile from "./pages/GeneralUser/Profile";
import MyCompanies from "./pages/GeneralUser/MyCompanies";
import AccountSettings from './pages/GeneralUser/AccountSettings';

// Route guard
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const { isAuthenticated, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // -------------------------------------------------------
  // On every login — sync user with DB and redirect by role
  // -------------------------------------------------------
  useEffect(() => {
    const syncAndRedirect = async () => {
      if (isAuthenticated && user?.email) {
        setSyncing(true);
        try {
          const api = await getSecureClient(getAccessTokenSilently);
          const response = await api.post('/users/sync', { email: user.email });

          const { role } = response.data;

          // Store role in sessionStorage so ProtectedRoute can use it
          sessionStorage.setItem('userRole', role);

          // Redirect based on role
          if (role === 'ADMIN') {
            navigate('/admin/panel');
          } else if (role === 'FIDUCIARY_ADMIN') {
            navigate('/fiduciary/dashboard');
          } else if (role === 'FIDUCIARY_WORKER') {
            navigate('/worker/dashboard');
          } else {
            navigate('/user'); // GENERAL_USER default
          }

        } catch (error) {
          console.error("Failed to sync user:", error);
        } finally {
          setSyncing(false);
        }
      }
    };

    syncAndRedirect();
  }, [isAuthenticated, user]);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg border">
          <h1 className="text-3xl font-bold mb-4">DPDP Compliance Portal</h1>
          <p className="text-gray-500 mb-8">
            Securely manage your data processing preferences.
          </p>
          <button
            onClick={() => loginWithRedirect()}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow hover:bg-blue-700 font-semibold"
          >
            Log In to Continue
          </button>
        </div>
      </div>
    );
  }

  // Show loading while syncing role
  if (syncing) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Setting up your portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 cursor-pointer" onClick={() => navigate('/')}>
          DPDP Portal
        </h1>

        <div className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold cursor-pointer"
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border z-50">
              <div className="p-6 text-center border-b">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{user?.name || "User"}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <p className="text-xs text-blue-500 mt-1 font-medium">
                  {sessionStorage.getItem('userRole') || ''}
                </p>
              </div>

              <div className="p-3">
                <button
                  onClick={() => { navigate("/user/profile"); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg"
                >
                  👤 Profile
                </button>
                <button
                  onClick={() => { navigate("/user/settings"); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg"
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={() => {
                    sessionStorage.removeItem('userRole');
                    logout({ logoutParams: { returnTo: window.location.origin } });
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg text-red-600"
                >
                  🚪 Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Routes */}
      <div className="p-8">
        <Routes>

          {/* Root "/" — Auth0 redirects here after login with ?code=&state= */}
          {/* The useEffect above handles sync and navigates away automatically */}
          <Route path="/" element={
            <div className="flex h-full items-center justify-center py-32">
              <p className="text-gray-400 text-lg">Setting up your portal...</p>
            </div>
          } />

          {/* Admin Portal — only ADMIN role */}
          <Route path="/admin/panel" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          {/* Fiduciary Portal — only FIDUCIARY_ADMIN role */}
          <Route path="/fiduciary/dashboard" element={
            <ProtectedRoute allowedRoles={['FIDUCIARY_ADMIN']}>
              <FiduciaryDashboard />
            </ProtectedRoute>
          } />

          {/* Worker Portal — only FIDUCIARY_WORKER role */}
          <Route path="/worker/dashboard" element={
            <ProtectedRoute allowedRoles={['FIDUCIARY_WORKER']}>
              <WorkerDashboard />
            </ProtectedRoute>
          } />

          {/* General User Portal */}
          <Route path="/user" element={
            <ProtectedRoute allowedRoles={['GENERAL_USER']}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/user/my-companies" element={<ProtectedRoute allowedRoles={['GENERAL_USER']}><MyCompanies /></ProtectedRoute>} />
          <Route path="/user/explore" element={<ProtectedRoute allowedRoles={['GENERAL_USER']}><ExploreCompanies /></ProtectedRoute>} />
          <Route path="/user/consent/:tenantId" element={<ProtectedRoute allowedRoles={['GENERAL_USER']}><ConsentManager /></ProtectedRoute>} />
          <Route path="/user/active-consents" element={<ProtectedRoute allowedRoles={['GENERAL_USER']}><ActiveConsents /></ProtectedRoute>} />
          <Route path="/user/activity" element={<ProtectedRoute allowedRoles={['GENERAL_USER']}><ActivityHistory /></ProtectedRoute>} />
          <Route path="/user/profile" element={<ProtectedRoute allowedRoles={['GENERAL_USER']}><Profile /></ProtectedRoute>} />
          <Route path="/user/settings" element={<ProtectedRoute allowedRoles={['GENERAL_USER']}><AccountSettings /></ProtectedRoute>} />

          {/* Access Denied page */}
          <Route path="/unauthorized" element={
            <div className="flex h-screen items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-red-500 mb-4">Access Denied</h1>
                <p className="text-gray-500">You do not have permission to view this page.</p>
              </div>
            </div>
          } />

        </Routes>
      </div>
    </div>
  );
}