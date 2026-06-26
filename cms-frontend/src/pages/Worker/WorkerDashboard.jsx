import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import DataValidator from './DataValidator';
import { getSecureClient } from '../../api'; 

export default function WorkerDashboard() {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();
  
  const [isAuthorized, setIsAuthorized] = useState(null); 

  useEffect(() => {
    if (authLoading) return;

    if (!user?.email) {
      setIsAuthorized(false);
      return;
    }

    const verifyWorkerAccess = async () => {
      try {
        const api = await getSecureClient(getAccessTokenSilently);
        // CHANGED: check role from DB instead of old /worker/verify endpoint
        const res = await api.get('/users/me');
        if (res.data.role === 'FIDUCIARY_WORKER') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error("Backend Verification Failed:", error);
        setIsAuthorized(false);
      }
    };
    
    verifyWorkerAccess();
  }, [getAccessTokenSilently, user?.email, authLoading]); 

  // --- STATE 1: LOADING SCREEN ---
  if (authLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-bold text-slate-700 tracking-wide">Verifying Secure Access...</h2>
      </div>
    );
  }

  // --- STATE 2: ACCESS DENIED SCREEN ---
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-red-100 max-w-md text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            ✕
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your account (<strong className="text-slate-800">{user?.email}</strong>) is not authorized to access the Fiduciary Worker environment. Please contact your Fiduciary Admin to request provisioning.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl hover:bg-slate-800 transition-colors shadow-md"
          >
            Return to Portal Hub
          </button>
        </div>
      </div>
    );
  }

  // --- STATE 3: AUTHORIZED DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-500">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Data Processing Validation</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">Worker Access Portal</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-900">{user?.name || 'Worker'}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto mt-12 px-6 pb-12">
        <DataValidator apiPrefix="/worker" workerEmail={user?.email} />
      </div>
    </div>
  );
}