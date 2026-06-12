import React, { useState } from 'react';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

export default function Validator() {
  const [userId, setUserId] = useState("");
  const [purposeId, setPurposeId] = useState("");
  const [result, setResult] = useState(null);
  const { getAccessTokenSilently } = useAuth0();

  const handleValidate = async (e) => {
    e.preventDefault();
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      // Hardcoding TENANT_A for MVP, normally derived from rep's login
      const res = await api.post('/consent/validate', { userId, purposeId, tenantId: 'TENANT_A' });
      setResult(res.data.valid);
      toast.success("Validation checked.");
    } catch (err) {
      toast.error("Validation failed to run.");
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 border rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6 text-green-700">Consent Validator</h2>
      <form onSubmit={handleValidate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Data Principal (User) ID</label>
          <input required type="text" className="w-full p-2 border rounded" value={userId} onChange={e => setUserId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Purpose ID to check</label>
          <input required type="text" className="w-full p-2 border rounded" value={purposeId} onChange={e => setPurposeId(e.target.value)} />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Check Status</button>
      </form>

      {result !== null && (
        <div className={`mt-6 p-4 rounded text-center font-bold text-lg ${result ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result ? '✓ CONSENT IS ACTIVE - SAFE TO PROCESS' : 'X NO ACTIVE CONSENT - DO NOT PROCESS'}
        </div>
      )}
    </div>
  );
}