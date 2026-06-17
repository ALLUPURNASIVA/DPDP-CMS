import React from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import our page components
import FiduciaryList from './pages/GeneralUser/FiduciaryList';
import ConsentManager from './pages/GeneralUser/ConsentManager';
import AccountSettings from './pages/GeneralUser/AccountSettings'; // <-- NEW IMPORT
import Validator from './pages/Fiduciary/Validator';
import AdminPanel from './pages/Admin/AdminPanel';

export default function App() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-12 rounded-xl shadow-lg border">
          <h1 className="text-3xl font-bold mb-4">DPDP Compliance Portal</h1>
          <p className="text-gray-500 mb-8">Securely manage your data processing preferences.</p>
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
      
      {/* Universal Top Nav */}
      <nav className="bg-white shadow-sm border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800" onClick={() => navigate('/')} style={{cursor:'pointer'}}>DPDP Portal</h1>
        <div className="flex items-center gap-5">
          <span className="text-sm font-medium text-gray-600">{user.email}</span>
          
          {/* NEW SETTINGS BUTTON */}
          <button 
            onClick={() => navigate('/user/settings')} 
            className="text-sm text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 transition"
          >
            ⚙️ Settings
          </button>

          <button 
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })} 
            className="text-sm font-bold text-red-600 hover:text-red-800 transition"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Routing Configuration */}
      <div className="p-8">
        <Routes>
          <Route path="/" element={<RoleSelection navigate={navigate} />} />
          
          {/* General User Routes */}
          <Route path="/user/companies" element={<FiduciaryList />} />
          <Route path="/user/consent/:tenantId" element={<ConsentManager />} />
          <Route path="/user/settings" element={<AccountSettings />} /> {/* <-- NEW ROUTE */}
          
          {/* Fiduciary Route */}
          <Route path="/fiduciary/validate" element={<Validator />} />
          
          {/* Admin Route */}
          <Route path="/admin/panel" element={<AdminPanel />} />
        </Routes>
      </div>
    </div>
  );
}

// The 3-Choice UI Component
const RoleSelection = ({ navigate }) => (
  <div className="max-w-4xl mx-auto mt-10">
    <h2 className="text-2xl font-bold mb-8 text-center">Select Your Portal</h2>
    <div className="grid md:grid-cols-3 gap-6">
      
      <div className="bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/user/companies')}>
        <h3 className="text-xl font-bold text-blue-600 mb-2">General User</h3>
        <p className="text-sm text-gray-600">View companies, grant consents, and manage your data privacy.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/fiduciary/validate')}>
        <h3 className="text-xl font-bold text-green-600 mb-2">Fiduciary Rep</h3>
        <p className="text-sm text-gray-600">Validate user consents before processing personal data.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/admin/panel')}>
        <h3 className="text-xl font-bold text-purple-600 mb-2">Platform Admin</h3>
        <p className="text-sm text-gray-600">Manage purposes, view audit logs, and configure the system.</p>
      </div>

    </div>
  </div>
);