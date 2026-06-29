import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../../../api';

export default function ComplianceLogs() {
  const { getAccessTokenSilently } = useAuth0();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const api = await getSecureClient(getAccessTokenSilently);
        // The ComplianceLog entity fields actorId, actorRole, and actionType are now being fetched
        const res = await api.get('/compliance-logs');
        setLogs(res.data);
        setFilteredLogs(res.data);
      } catch (err) {
        console.error("Failed to load logs:", err);
      }
    };
    fetchLogs();
  }, [getAccessTokenSilently]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    // Filtering now includes the new actorRole and actionType fields
    const filtered = logs.filter((log) => 
      (log.adminEmail && log.adminEmail.toLowerCase().includes(term)) ||
      (log.targetEmail && log.targetEmail.toLowerCase().includes(term)) ||
      (log.actionType && log.actionType.toLowerCase().includes(term)) ||
      (log.actorRole && log.actorRole.toLowerCase().includes(term))
    );
    setFilteredLogs(filtered);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Compliance Logs</h2>
        <input
          type="text"
          placeholder="Search by email, action, or role..."
          value={searchTerm}
          onChange={handleSearch}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <table className="w-full text-sm">
        <thead className="text-gray-500 text-left">
          <tr>
            <th className="pb-3 border-b">Timestamp</th>
            <th className="pb-3 border-b">Action</th>
            <th className="pb-3 border-b">Actor (Role)</th>
            <th className="pb-3 border-b">Target</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <tr key={log.id}>
                <td className="py-3 text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="py-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-800">
                    {log.actionType || 'N/A'}
                  </span>
                </td>
                <td className="py-3">
                  <div className="text-sm font-medium text-gray-800">{log.adminEmail}</div>
                  <div className={`text-xs font-bold ${log.actorRole === 'ADMIN' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {log.actorRole || 'UNKNOWN'}
                  </div>
                </td>
                <td className="py-3 text-gray-700">{log.targetEmail || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="py-4 text-center text-gray-400">No logs match your search.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}