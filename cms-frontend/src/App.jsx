import React from 'react';
import { useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { getSecureClient } from './api';

// Import our page components
import FiduciaryList from './pages/GeneralUser/FiduciaryList';
import ConsentManager from './pages/GeneralUser/ConsentManager';
import AccountSettings from './pages/GeneralUser/AccountSettings'; 
import AdminPanel from './pages/Admin/AdminPanel';
import FiduciaryDashboard from './pages/Fiduciary/FiduciaryDashboard';
import WorkerDashboard from './pages/Worker/WorkerDashboard';

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
          
          {/* SETTINGS BUTTON */}
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
          <Route path="/user/settings" element={<AccountSettings />} /> 
          
          {/* Fiduciary Route - UPDATED TO NEW DASHBOARD */}
          <Route path="/fiduciary/dashboard" element={<FiduciaryDashboard />} />
          {/* Worker Route */}
          <Route path="/worker/dashboard" element={<WorkerDashboard />} />
          
          {/* Admin Route */}
          <Route path="/admin/panel" element={<AdminPanel />} />
        </Routes>
      </div>
    </div>
  );
}

// The 3-Choice UI Component
const RoleSelection = ({ navigate }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [isVerifying, setIsVerifying] = useState(false);

  // The Gatekeeper Function
  const handleFiduciaryClick = async () => {
    setIsVerifying(true);
    const toastId = toast.loading('Verifying secure access...');

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      // Ping the backend. If they aren't an admin, this throws an error.
      await api.get('/fiduciary/verify');
      
      toast.success('Access Granted', { id: toastId });
      navigate('/fiduciary/dashboard'); // Let them in
    } catch (error) {
      if (error.response && error.response.status === 403) {
        toast.error('Access Denied: You do not have Fiduciary Admin privileges.', { id: toastId });
      } else {
        toast.error('Server error verifying credentials.', { id: toastId });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-8 text-center">Select Your Portal</h2>
      <div className="grid md:grid-cols-3 gap-6">
        
        <div className="bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/user/companies')}>
          <h3 className="text-xl font-bold text-blue-600 mb-2">General User</h3>
          <p className="text-sm text-gray-600">View companies, grant consents, and manage your data privacy.</p>
        </div>

        {/* UPDATED: Now uses the Gatekeeper function */}
        <div 
          className={`bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer ${isVerifying ? 'opacity-50 pointer-events-none' : ''}`} 
          onClick={handleFiduciaryClick}
        >
          <h3 className="text-xl font-bold text-green-600 mb-2">Fiduciary Rep</h3>
          <p className="text-sm text-gray-600">Access your secure B2B data processing portal.</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow border hover:shadow-lg transition cursor-pointer" onClick={() => navigate('/admin/panel')}>
          <h3 className="text-xl font-bold text-purple-600 mb-2">Platform Admin</h3>
          <p className="text-sm text-gray-600">Manage purposes, view audit logs, and configure the system.</p>
        </div>

        {/* Fiduciary Worker Portal Card */}
        <div 
          onClick={() => navigate('/worker/dashboard')}
          className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition-all flex flex-col h-full"
        >
          <h3 className="text-xl font-bold text-blue-600 mb-3">Fiduciary Worker</h3>
          <p className="text-sm text-gray-500">
            Validate data processing actions against real-time user consent records.
          </p>
        </div>

      </div>
    </div>
  );
};