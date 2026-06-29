import React, { useState, useEffect } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { getSecureClient } from './api';

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

import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  const { isAuthenticated, loginWithRedirect, logout, user, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);

  const getRoleHomePath = (role) => {
    if (role === 'ADMIN') return '/admin/panel';
    if (role === 'FIDUCIARY_ADMIN') return '/fiduciary/dashboard';
    if (role === 'FIDUCIARY_WORKER') return '/worker/dashboard';
    return '/user';
  };

  const getRoleLabel = (role) => {
    if (role === 'ADMIN') return 'Platform Admin';
    if (role === 'FIDUCIARY_ADMIN') return 'Fiduciary Admin';
    if (role === 'FIDUCIARY_WORKER') return 'Fiduciary Worker';
    return 'General User';
  };

  const goHome = () => {
    navigate(getRoleHomePath(currentRole));
  };

  const displayName =
    user?.name && user.name !== user?.email
      ? user.name
      : getRoleLabel(currentRole);

  useEffect(() => {
    const syncAndRedirect = async () => {
      if (isAuthenticated && user?.email) {
        setSyncing(true);

        try {
          const api = await getSecureClient(getAccessTokenSilently);
          const response = await api.post('/users/sync', { email: user.email });

          const { role } = response.data;
          setCurrentRole(role);

          if (window.location.pathname === "/") {
            navigate(getRoleHomePath(role), { replace: true });
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

      <nav className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1
            className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition"
            onClick={goHome}
          >
            DPDP Portal
          </h1>

          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
            {getRoleLabel(currentRole)}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center rounded-full hover:bg-gray-50 px-2 py-2 transition"
          >
            <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
          </button>

          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
              <div className="p-5 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
                    {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                {currentRole === "GENERAL_USER" && (
                  <>
                    <button
                      onClick={() => { navigate("/user/profile"); setOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg text-gray-700 font-medium"
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => { navigate("/user/settings"); setOpen(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg text-gray-700 font-medium"
                    >
                      Settings
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    logout({ logoutParams: { returnTo: window.location.origin } });
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 rounded-lg text-red-600 font-medium"
                >
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="p-8">
        <Routes>
          <Route path="/" element={
            <div className="flex h-full items-center justify-center py-32">
              <button
                onClick={goHome}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
              >
                Continue to {getRoleLabel(currentRole)} Dashboard
              </button>
            </div>
          } />

          <Route path="/admin/panel" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPanel />
            </ProtectedRoute>
          } />

          <Route path="/fiduciary/dashboard" element={
            <ProtectedRoute allowedRoles={['FIDUCIARY_ADMIN']}>
              <FiduciaryDashboard />
            </ProtectedRoute>
          } />

          <Route path="/worker/dashboard" element={
            <ProtectedRoute allowedRoles={['FIDUCIARY_WORKER']}>
              <WorkerDashboard />
            </ProtectedRoute>
          } />

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