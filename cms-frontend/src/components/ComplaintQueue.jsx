import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../api'; // Adjust path based on your folder structure

export default function ComplaintQueue({ viewMode }) {
  const { getAccessTokenSilently } = useAuth0();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInputs, setMessageInputs] = useState({}); // Stores resolution messages per ID

  // Fetch complaints based on viewMode
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      // 1. Get current user's tenantId first
      const meRes = await api.get('/users/me');
      const tenantId = meRes.data.tenantId;

      // 2. Fetch specific queue
      const endpoint = viewMode === 'admin' ? `/complaints/admin/${tenantId}` : `/complaints/worker/${tenantId}`;
      const res = await api.get(endpoint);
      setComplaints(res.data);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [viewMode]);

  // Handle Status Update (Resolve or Escalate)
  const handleAction = async (id, status, message = "") => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.put(`/complaints/${id}/status`, { status, message });
      alert("Complaint successfully resolved and archived.");
      fetchComplaints(); // Refresh table
    } catch (err) {
      alert("Action failed. Please try again.");
    }
  };

  const handleForceResolve = async (id) => {
    const note = prompt("Please enter the reason for force resolution:");
    if (!note) return; // Cancel if no note provided

    try {
        const api = await getSecureClient(getAccessTokenSilently);
        await api.patch(`/complaints/${id}/force-resolve`, { note });
        fetchComplaints(); // Refresh table
    } catch (err) {
        alert("Action failed.");
    }
  };

  const handlePurge = async (id) => {
    try {
        const api = await getSecureClient(getAccessTokenSilently);
        await api.delete(`/complaints/${id}/purge`); // Calling the new endpoint
        fetchComplaints(); // Refresh table
    } catch (err) {
        alert("Purge failed. Check server logs.");
    }
  };

  if (loading) return <div className="text-center p-10 text-gray-500">Loading queue...</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Subject</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Description</th>
            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {complaints.length === 0 ? (
            <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-400">No pending complaints found.</td></tr>
          ) : (
            complaints.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-800">{c.subject}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{c.description}</td>
                <td className="px-6 py-4">
                  {viewMode === 'worker' ? (
                    <div className="flex flex-col gap-2">
                      <input 
                        placeholder="Resolution message..."
                        className="text-xs border rounded px-2 py-1"
                        onChange={(e) => setMessageInputs({...messageInputs, [c.id]: e.target.value})}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(c.id, 'RESOLVED', messageInputs[c.id] || "No message provided.")}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >Resolve</button>
                        <button 
                          onClick={() => handleAction(c.id, 'ESCALATED')}
                          className="text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
                        >Escalate</button>
                      </div>
                    </div>
                  ) : (
                    // Admin View: Force Resolve or Purge
                    <div className="flex gap-2">
                    <button 
                        onClick={() => handleForceResolve(c.id)}
                        className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                    >Force Resolve</button>

                    <button 
                        onClick={() => {
                            if(window.confirm("WARNING: This will PERMANENTLY DELETE all user consent data for this tenant. Proceed?")) {
                                // Trigger Purge API
                                handlePurge(c.id);
                            }
                        }}
                        className="text-xs bg-red-700 text-white px-3 py-1 rounded hover:bg-red-800 font-bold"
                    >PURGE DATA</button>
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}