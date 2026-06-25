import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../../../api';
import toast from 'react-hot-toast';

export default function ConsentDirectory() {
  const { getAccessTokenSilently } = useAuth0();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchConsents();
  }, []);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get('/fiduciary/consents');
      setConsents(res.data);
    } catch (error) {
      toast.error("Failed to load consent records.");
    } finally {
      setLoading(false);
    }
  };

  // Real-time filtering logic
  const filteredConsents = consents.filter((c) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      c.userEmail?.toLowerCase().includes(searchLower) ||
      c.purposeName?.toLowerCase().includes(searchLower) ||
      c.status?.toLowerCase().includes(searchLower) ||
      c.id?.toLowerCase().includes(searchLower)
    );
  });

  const handleExportCSV = () => {
    // 1. Create CSV headers
    const headers = ["Audit Receipt,User Email,Purpose,Status,Granted On,Valid Until"];
    
    // 2. Map data to CSV rows
    const csvRows = filteredConsents.map(c => {
      const granted = c.grantedAt ? new Date(c.grantedAt).toISOString() : 'N/A';
      const expires = c.expiresAt ? new Date(c.expiresAt).toISOString() : 'Indefinite';
      return `${c.id},${c.userEmail},"${c.purposeName}",${c.status},${granted},${expires}`;
    });

    // 3. Combine and download
    const csvContent = [headers, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `consent_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Consent Directory</h2>
          <p className="text-sm text-gray-500">Real-time audit log of user consent decisions.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={handleExportCSV} className="text-sm text-gray-600 font-medium hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded bg-white">
            Export CSV
          </button>
          <button onClick={fetchConsents} className="text-sm text-blue-600 font-medium hover:text-blue-800 px-3 py-1.5">
            Refresh
          </button>
        </div>
      </div>

      {/* --- REAL-TIME SEARCH BAR --- */}
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <input 
          type="text" 
          placeholder="Search by Email, Purpose, Status, or Audit ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
        />
      </div>

      {/* Added max-h-[600px] and overflow-y-auto for vertical scrolling */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] relative rounded-b-xl">
        <table className="w-full text-left whitespace-nowrap border-collapse">
          
          {/* Added sticky, top-0, z-10, and shadow to keep headers fixed */}
          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] tracking-wider font-bold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg bg-gray-50">Audit Receipt</th>
              <th className="px-6 py-4 bg-gray-50">User Identity</th>
              <th className="px-6 py-4 bg-gray-50">Processing Purpose</th>
              <th className="px-6 py-4 bg-gray-50">Status</th>
              <th className="px-6 py-4 bg-gray-50">Granted On</th>
              <th className="px-6 py-4 bg-gray-50">Valid Until</th>
              <th className="px-6 py-4 text-right rounded-tr-lg bg-gray-50">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center text-gray-500">Loading audit logs...</td></tr>
            ) : filteredConsents.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-gray-500">
                  {searchTerm ? "No matching records found for your search." : "No consent data found."}
                </td>
              </tr>
            ) : (
              filteredConsents.map((c) => (
                <tr key={c.id} className="hover:bg-blue-50/50 transition-colors group">
                  
                  {/* Audit Receipt - Truncated UUID for professional look */}
                  <td className="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-blue-600 transition-colors" title={c.id}>
                    #{c.id ? c.id.substring(0, 8) : 'N/A'}...
                  </td>

                  {/* User Identity */}
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {c.userEmail}
                  </td>
                  
                  {/* Processing Purpose */}
                  <td className="px-6 py-4 text-gray-600 font-medium">
                    {c.purposeName}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wide rounded-md border 
                      ${c.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 
                        c.status === 'WITHDRAWN' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                        'bg-red-50 text-red-700 border-red-200'}`}>
                      {c.status}
                    </span>
                  </td>
                  
                  {/* Granted Timestamp */}
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {c.grantedAt ? new Date(c.grantedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </td>

                  {/* Expiration Timestamp */}
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Indefinite'}
                  </td>

                  {/* Action Button */}
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedLog(c)} 
                      className="text-blue-600 hover:text-blue-800 text-xs font-semibold px-3 py-1.5 rounded bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                      Inspect Log
                    </button>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- INSPECT LOG MODAL --- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Consent Audit Record</h3>
                <p className="text-xs text-gray-500 font-mono mt-1">ID: {selectedLog.id}</p>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Raw Data */}
            <div className="p-6">
              <div className="bg-slate-900 rounded-xl p-5 overflow-x-auto shadow-inner">
                <div className="flex justify-between items-center mb-3 border-b border-slate-700 pb-2">
                  <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Raw JSON Payload</span>
                  <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    VERIFIED
                  </span>
                </div>
                <pre className="text-sm font-mono text-blue-300">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close Inspector
                </button>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
                    toast.success("JSON copied to clipboard!");
                  }}
                  className="px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow transition-colors"
                >
                  Copy JSON
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );

  }