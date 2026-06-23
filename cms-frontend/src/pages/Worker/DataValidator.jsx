import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../../api';
import toast from 'react-hot-toast';

// Notice the apiPrefix prop! Defaults to admin, but the Worker Dashboard will override it.
  export default function DataValidator({ apiPrefix = '/fiduciary', workerEmail = null }) {
  const { getAccessTokenSilently } = useAuth0();
  const [purposes, setPurposes] = useState([]);
  const [email, setEmail] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);

  // Load the active purposes so the user can select what they are testing
  useEffect(() => {
    const fetchPurposes = async () => {
      try {
        const api = await getSecureClient(getAccessTokenSilently);
        const config = workerEmail ? { headers: { 'X-Worker-Email': workerEmail } } : {};
        // Uses the dynamic API prefix!
        const res = await api.get(`${apiPrefix}/purposes`, config);
        // Only show active purposes in the dropdown
        setPurposes(res.data.filter(p => p.isActive !== false));
      } catch (error) {
        toast.error("Failed to load purposes.");
      }
    };
    fetchPurposes();
  }, [getAccessTokenSilently, apiPrefix]);

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!email || !selectedPurpose) return;

    setIsChecking(true);
    setResult(null);

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const config = workerEmail ? { headers: { 'X-Worker-Email': workerEmail } } : {};
      // Uses the dynamic API prefix!
      const res = await api.get(`${apiPrefix}/validate?email=${encodeURIComponent(email)}&purposeId=${selectedPurpose}`, config);
      setResult(res.data);
    } catch (error) {
      toast.error("Validation check failed. You may not have authorization.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-gray-100 bg-slate-900 text-white flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        <div>
          <h2 className="text-xl font-bold tracking-wide">Data Compliance Validator</h2>
          <p className="text-sm text-slate-400">Pre-flight check for data processing actions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
        
        {/* LEFT SIDE: Input Form */}
        <div className="p-8 border-r border-gray-100">
          <form onSubmit={handleValidate} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target User Email</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g., user@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Intended Action / Purpose</label>
              <select 
                required
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition bg-white"
              >
                <option value="">-- Select Purpose --</option>
                {purposes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isChecking || !email || !selectedPurpose}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {isChecking ? "Running Compliance Check..." : "Verify Authorization"}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE: Results Terminal */}
        <div className="p-8 bg-gray-50 flex items-center justify-center min-h-[300px]">
          {!result && !isChecking && (
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p className="text-sm font-medium">Awaiting inputs to run verification.</p>
            </div>
          )}

          {isChecking && (
            <div className="text-center text-slate-600 animate-pulse">
              <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-bold">Querying Consent Ledgers...</p>
            </div>
          )}

          {result && !isChecking && (
            <div className="w-full animate-in fade-in zoom-in-95 duration-300">
              <div className={`p-6 rounded-2xl border-2 ${result.isCompliant ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                
                <div className="flex items-center gap-3 mb-4">
                  {result.isCompliant ? (
                     <span className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-700 rounded-full font-bold text-xl">✓</span>
                  ) : (
                     <span className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-700 rounded-full font-bold text-xl">✕</span>
                  )}
                  <h3 className={`text-xl font-black tracking-wide ${result.isCompliant ? 'text-green-800' : 'text-red-800'}`}>
                    {result.isCompliant ? 'ACTION ALLOWED' : 'ACTION BLOCKED'}
                  </h3>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-600 mb-1">System Reason:</p>
                  <p className="font-mono text-sm font-bold text-slate-800">{result.reason}</p>
                </div>

                {result.receiptId && (
                  <div className="mt-4 pt-4 border-t border-gray-200/50 flex justify-between items-center gap-4">
                     <div className="flex-1 overflow-hidden">
                       <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Audit Receipt ID</p>
                       <p className="font-mono text-xs text-slate-500 truncate" title={result.receiptId}>
                         {result.receiptId}
                       </p>
                     </div>
                     <div className="text-right border-l border-gray-200/50 pl-4">
                       <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Valid Until</p>
                       <p className="font-mono text-xs text-slate-800 font-bold bg-gray-100/50 px-2 py-1 rounded">
                         {result.expiresAt ? new Date(result.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Indefinite'}
                       </p>
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}