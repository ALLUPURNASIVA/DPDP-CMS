import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../../../api';
import toast from 'react-hot-toast';

export default function WorkerAccess() {
  const { getAccessTokenSilently } = useAuth0();
  const [workers, setWorkers] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get('/fiduciary/workers');
      setWorkers(res.data);
    } catch (error) {
      toast.error("Failed to load worker list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleAddWorker = async (e) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.post('/fiduciary/workers', { email: newEmail });
      toast.success("Worker authorized successfully!");
      setNewEmail('');
      fetchWorkers();
    } catch (error) {
      toast.error(error.response?.data || "Failed to add worker.");
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm("Revoke access for this worker?")) return;
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.delete(`/fiduciary/workers/${id}`);
      toast.success("Worker access revoked.");
      fetchWorkers();
    } catch (error) {
      toast.error("Failed to revoke access.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Worker Access Control</h2>
          <p className="text-sm text-gray-500">Authorize team members to validate data processing actions.</p>
        </div>
      </div>

      <div className="p-6 border-b border-gray-100">
        <form onSubmit={handleAddWorker} className="flex gap-4 max-w-2xl">
          <input 
            type="email" 
            required
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="worker@company.com"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
          />
          <button 
            type="submit" 
            className="bg-slate-900 text-white font-bold px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            Authorize User
          </button>
        </form>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-bold">
            <tr>
              <th className="px-6 py-4">Authorized Email</th>
              <th className="px-6 py-4">Granted On</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan="3" className="p-8 text-center text-gray-500">Loading authorized workers...</td></tr>
            ) : workers.length === 0 ? (
              <tr><td colSpan="3" className="p-8 text-center text-gray-500">No workers authorized yet.</td></tr>
            ) : (
              workers.map((w) => (
                <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{w.email}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(w.addedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleRemove(w.id)}
                      className="text-red-600 hover:text-red-800 text-xs font-bold px-3 py-1.5 rounded bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      Revoke Access
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}