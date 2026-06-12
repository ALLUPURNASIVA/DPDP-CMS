import React, { useState, useEffect } from 'react';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('audit');
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get('/admin/audit-logs');
      
      // Sort logs so the newest ones are at the top
      const sortedLogs = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAuditLogs(sortedLogs);
    } catch (err) {
      toast.error("Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Platform Administration</h2>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button 
          className={`px-6 py-3 font-medium text-sm ${activeTab === 'audit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('audit')}
        >
          Compliance & Audit Logs
        </button>
        <button 
          className={`px-6 py-3 font-medium text-sm ${activeTab === 'config' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('config')}
        >
          System Configuration
        </button>
      </div>

      {/* Tab Content: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Immutable Audit Ledger</h3>
            <button onClick={fetchAuditLogs} className="text-sm text-blue-600 hover:underline">
              ↻ Refresh Logs
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="py-3 px-4 rounded-tl-lg">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4 rounded-tr-lg">Cryptographic Hash</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading secure logs...</td></tr>
                ) : auditLogs.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-8 text-gray-500">No audit logs recorded yet.</td></tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-gray-50 font-mono text-xs">
                      <td className="py-3 px-4 text-gray-800">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded font-bold ${
                          log.actionType === 'GRANT' ? 'bg-green-100 text-green-800' :
                          log.actionType === 'WITHDRAW' ? 'bg-red-100 text-red-800' :
                          log.actionType === 'VALIDATE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                        }`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 truncate max-w-[150px]" title={log.userId}>{log.userId}</td>
                      <td className="py-3 px-4 text-gray-600">{log.tenantId}</td>
                      <td className="py-3 px-4 text-gray-600">{log.sourceIp || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-400 truncate max-w-[150px]" title={log.cryptographicHash}>
                        {log.cryptographicHash.substring(0, 16)}...
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content: System Configuration (Placeholder for MVP scope) */}
      {activeTab === 'config' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-2">Consent Purposes</h3>
            <p className="text-sm text-gray-500 mb-4">Manage the definitions of data processing purposes across tenants.</p>
            <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded cursor-not-allowed">
              + Add New Purpose (Coming Soon)
            </button>
          </div>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
            <h3 className="text-lg font-bold mb-2">User Management</h3>
            <p className="text-sm text-gray-500 mb-4">View and manage Data Principal accounts and Fiduciary representatives.</p>
            <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded cursor-not-allowed">
              View Directory (Coming Soon)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}