import React, { useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Existing Pages
import FiduciaryList from './pages/GeneralUser/FiduciaryList';
import ConsentManager from './pages/GeneralUser/ConsentManager';
import AccountSettings from './pages/GeneralUser/AccountSettings';
import Validator from './pages/Fiduciary/Validator';
import AdminPanel from './pages/Admin/AdminPanel';

// New Pages
import ExploreCompanies from "./pages/GeneralUser/ExploreCompanies";
//import MyCompanies from "./pages/GeneralUser/MyCompanies";
import UserDashboard from "./pages/GeneralUser/UserDashboard";
import ActiveConsents from "./pages/GeneralUser/ActiveConsents";
import ActivityHistory from "./pages/GeneralUser/ActivityHistory";
import Profile from "./pages/GeneralUser/Profile";
import MyCompanies from "./pages/GeneralUser/MyCompanies";
export default function App() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
        <h1
          className="text-xl font-bold text-gray-800 cursor-pointer"
          onClick={() => navigate('/')}
        >
          DPDP Portal
        </h1>

        <div className="relative">
          <div
            onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold cursor-pointer"
          >
            {(localStorage.getItem("userName") || user?.name)
              ?.charAt(0)
              ?.toUpperCase() || "U"}
          </div>

          {open && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border z-50">
              <div className="p-6 text-center border-b">
                <div className="w-16 h-16 mx-auto rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  {(localStorage.getItem("userName") || user?.name)
                    ?.charAt(0)
                    ?.toUpperCase() || "U"}
                </div>

                <h3 className="mt-3 text-lg font-semibold">
                  {localStorage.getItem("userName") || user?.name}
                </h3>

                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              <div className="p-3">
                <button
                  onClick={() => {
                    navigate("/user/profile");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg"
                >
                  👤 Profile
                </button>

                <button
                  onClick={() => {
                    navigate("/user/settings");
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-lg"
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={() =>
                    logout({
                      logoutParams: { returnTo: window.location.origin }
                    })
                  }
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
          <Route path="/" element={<RoleSelection navigate={navigate} />} />

          {/* Existing Backend-Compatible Routes */}
          <Route path="/user" element={<UserDashboard />} />
          <Route path="/user/consent/:tenantId" element={<ConsentManager />} />
          <Route path="/user/settings" element={<AccountSettings />} />
          <Route path="/fiduciary/validate" element={<Validator />} />
          <Route path="/admin/panel" element={<AdminPanel />} />

          {/* New UI Routes */}
          <Route path="/user" element={<UserDashboard />} />
              <Route path="/user/my-companies" element={<MyCompanies />} />
              <Route path="/user/explore" element={<ExploreCompanies />} />
              <Route path="/user/consent/:tenantId" element={<ConsentManager />} />
              <Route path="/user/active-consents" element={<ActiveConsents />} />
              <Route path="/user/activity" element={<ActivityHistory />} />
              <Route path="/user/profile" element={<Profile />} />
              <Route path="/user/settings" element={<AccountSettings />} />
        </Routes>
      </div>
    </div>
  );
}

const RoleSelection = ({ navigate }) => (
  <div className="max-w-4xl mx-auto mt-10">
    <h2 className="text-2xl font-bold mb-8 text-center">
      Select Your Portal
    </h2>

    <div className="grid md:grid-cols-3 gap-6">
      <div
        className="bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer"
        onClick={() => navigate('/user')}
      >
        <h3 className="text-xl font-bold text-blue-600 mb-2">General User</h3>
        <p className="text-sm text-gray-600">
          View companies, grant consents, and manage your data privacy.
        </p>
      </div>

      <div
        className="bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer"
        onClick={() => navigate('/fiduciary/validate')}
      >
        <h3 className="text-xl font-bold text-green-600 mb-2">Fiduciary Rep</h3>
        <p className="text-sm text-gray-600">
          Validate user consents before processing personal data.
        </p>
      </div>

      <div
        className="bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer"
        onClick={() => navigate('/admin/panel')}
      >
        <h3 className="text-xl font-bold text-purple-600 mb-2">
          Platform Admin
        </h3>
        <p className="text-sm text-gray-600">
          Manage purposes, view audit logs, and configure the system.
        </p>
      </div>
    </div>
  </div>
);