import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../../../api';
import toast from 'react-hot-toast';

export default function SubjectProfile() {
  const { getAccessTokenSilently } = useAuth0();
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSearching(true);
    setResult(null);

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get(`/fiduciary/subject-profile?email=${encodeURIComponent(email)}`);
      setResult(res.data);
      if (!res.data.found) {
        toast.error("User not found in the system.");
      }
    } catch (error) {
      toast.error("Failed to retrieve user profile.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Subject Consent Profile (360° View)</h2>
        <p className="text-sm text-gray-500 mb-6">Instantly verify a user's complete data privacy matrix.</p>
        
        <form onSubmit={handleSearch} className="flex gap-4">
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Search by user email address..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
          <button 
            type="submit" 
            disabled={isSearching || !email}
            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm whitespace-nowrap"
          >
            {isSearching ? "Searching..." : "Retrieve Profile"}
          </button>
        </form>
      </div>

      {/* Results Matrix */}
      {result && result.found && (
        <div className="bg-slate-50 rounded-xl border border-gray-200 p-8">
          <div className="mb-6 border-b border-gray-200 pb-4 flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Target Identity</p>
              <h3 className="text-2xl font-black text-slate-800">{result.email}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">System User ID</p>
              <p className="font-mono text-sm text-slate-500">{result.userId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.profile.map((purpose, index) => (
              <div key={index} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
                
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-gray-900">{purpose.purposeName}</h4>
                  
                  {/* Dynamic Status Badge */}
                  <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-md border 
                    ${purpose.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 
                      purpose.status === 'WITHDRAWN' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                      'bg-gray-100 text-gray-500 border-gray-200'}`}>
                    {purpose.status === 'NEVER_PROVIDED' ? 'NO CONSENT' : purpose.status}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 mb-4 flex-1">{purpose.description}</p>
                
                <div className="mt-auto pt-4 border-t border-gray-50">
                  {purpose.status === 'ACTIVE' ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Granted</p>
                          <p className="text-xs text-gray-700 mt-0.5 font-medium">
                            {new Date(purpose.grantedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Expires</p>
                          <p className="text-xs text-gray-700 mt-0.5 font-medium">
                            {purpose.expiresAt ? new Date(purpose.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Indefinite'}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-2 truncate bg-gray-50 p-1.5 rounded" title={purpose.receiptId}>
                        Ref: {purpose.receiptId}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                       <p className="text-xs font-bold text-gray-400">Processing Blocked</p>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}