import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import DataValidator from './DataValidator';
import ComplaintQueue from '../../components/ComplaintQueue';
import { getSecureClient } from '../../api';

export default function WorkerDashboard() {
  const { user, getAccessTokenSilently, isLoading: authLoading } = useAuth0();

  const [isAuthorized, setIsAuthorized] = useState(null);
  const [activeView, setActiveView] = useState('validator');

  useEffect(() => {
    if (authLoading) return;

    if (!user?.email) {
      setIsAuthorized(false);
      return;
    }

    const verifyWorkerAccess = async () => {
      try {
        const api = await getSecureClient(getAccessTokenSilently);
        const res = await api.get('/users/me');
        setIsAuthorized(res.data.role === 'FIDUCIARY_WORKER');
      } catch (error) {
        console.error("Backend Verification Failed:", error);
        setIsAuthorized(false);
      }
    };

    verifyWorkerAccess();
  }, [getAccessTokenSilently, user?.email, authLoading]);

  if (authLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-4"></div>
        <h2 className="text-lg font-bold text-slate-700 tracking-wide">Verifying Secure Access...</h2>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-red-100 max-w-md text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            ×
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your account is not authorized to access the Fiduciary Worker environment. Please contact your Fiduciary Admin to request provisioning.
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

  return (
    <div className="min-h-screen bg-slate-50 animate-in fade-in duration-500">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Worker Access Portal</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">{user?.email}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('validator')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
              activeView === 'validator'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500'
            }`}
          >
            Data Validator
          </button>

          <button
            onClick={() => setActiveView('complaints')}
            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
              activeView === 'complaints'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500'
            }`}
          >
            Complaint Queue
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto mt-12 px-6 pb-12">
        {activeView === 'validator' ? (
          <DataValidator apiPrefix="/worker" workerEmail={user?.email} />
        ) : (
          <ComplaintQueue viewMode="worker" />
        )}
      </div>
    </div>
  );
}