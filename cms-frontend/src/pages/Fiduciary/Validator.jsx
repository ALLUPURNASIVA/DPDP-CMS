import React, { useState } from 'react';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

export default function Validator() {
  const [userId, setUserId] = useState("");
  const [tenantId, setTenantId] = useState("TENANT_A");
  const [purposeId, setPurposeId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

  const handleValidate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      
      // We wrap purposeId in Number() to ensure Java gets the correct data type
      const res = await api.post('/consent/validate', { 
        userId: userId.trim(), 
        purposeId: Number(purposeId), 
        tenantId: tenantId.trim() 
      });
      
      setResult(res.data.valid);
      if (res.data.valid) {
        toast.success("Consent is active and valid.");
      } else {
        toast.error("No active consent found.");
      }
    } catch (err) {
      toast.error("Validation failed to run. Check console.");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        
        <div className="mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-800">Fiduciary Validation Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            Check the real-time consent status of a Data Principal before processing their information.
          </p>
        </div>

        <form onSubmit={handleValidate} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Principal (User ID)</label>
            <input 
              required 
              type="text" 
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              placeholder="e.g., auth0|123456789..."
              value={userId} 
              onChange={e => setUserId(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company (Tenant ID)</label>
              <input 
                required 
                type="text" 
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                value={tenantId} 
                onChange={e => setTenantId(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose ID</label>
              <input 
                required 
                type="number" 
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                placeholder="e.g., 1"
                value={purposeId} 
                onChange={e => setPurposeId(e.target.value)} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-800 text-white py-3 rounded font-semibold hover:bg-slate-900 transition disabled:bg-slate-400"
          >
            {loading ? 'Checking Database...' : 'Run Compliance Check'}
          </button>
        </form>

        {result !== null && (
          <div className={`mt-8 p-6 rounded-lg border-2 text-center transition-all ${
            result 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
          }`}>
            <h2 className="text-3xl font-black tracking-widest mb-2">
              {result ? 'STATUS: VALID' : 'STATUS: INVALID'}
            </h2>
            <p className="text-sm">
              {result 
                ? 'The Data Principal has actively consented to this specific purpose. You may legally process this data.' 
                : 'Warning: No active consent record exists for this User/Purpose combination. Do not process.'}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}