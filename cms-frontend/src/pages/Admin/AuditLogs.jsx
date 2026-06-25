// AuditLogs.jsx — Immutable Audit Ledger tab
//
// Props:
//   logs                       {Array}    — sorted audit log entries from parent
//   isLoading                  {boolean}  — loading state from parent
//   onRefresh                  {Function} — triggers parent to re-fetch all data
//   onCopy                     {Function} — copies text to clipboard (shared utility)
//   externalSearch             {string}   — optional pre-filled search (from User Management deep-link)
//   onExternalSearchConsumed   {Function} — clears externalSearch in parent after consumption

import React, { useState, useEffect } from 'react';
import Icons from './Icons';

// --- Expiry colour helper (self-contained, no API dependency) ---
const getExpiryStyling = (expiryDateStr) => {
  if (!expiryDateStr) return 'text-gray-400';
  const diffDays = Math.ceil((new Date(expiryDateStr) - new Date()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0)   return 'text-red-800 bg-red-100 font-bold px-2 py-1 rounded';
  if (diffDays <= 30) return 'text-orange-700 bg-orange-50 font-semibold px-2 py-1 rounded border border-orange-200';
  return 'text-gray-500 font-medium';
};

export default function AuditLogs({ logs = [], isLoading, onRefresh, onCopy, externalSearch = '', onExternalSearchConsumed }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Consume external search term when navigating from User Management
  useEffect(() => {
    if (externalSearch) {
      setSearchTerm(externalSearch);
      if (onExternalSearchConsumed) onExternalSearchConsumed();
    }
  }, [externalSearch]);

  const filteredLogs = logs.filter(log =>
    (log.userId     && log.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.userEmail  && log.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.tenantId   && log.tenantId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.actionType && log.actionType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/30">
        <div className="flex items-center space-x-4">
          <h3 className="text-base font-bold text-gray-900">Immutable Audit Ledger</h3>
          <button
            onClick={onRefresh}
            className="inline-flex items-center text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
          >
            <Icons.Refresh /> Sync Logs
          </button>
        </div>
        <div className="relative w-full sm:w-72">
          <Icons.Search />
          <input
            type="text"
            placeholder="Search records..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none shadow-sm transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[calc(100vh-13rem)]">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50/50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {['Timestamp', 'Action', 'Principal (Email)', 'Tenant', 'Purpose Name', 'Status', 'Expiry Date', 'Hash'].map(h => (
                <th key={h} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {isLoading ? (
              <tr><td colSpan="8" className="text-center py-12 text-sm text-gray-500 font-medium">Retrieving secure logs...</td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="8" className="text-center py-12 text-sm text-gray-500 font-medium">No matching records found.</td></tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                  {/* Timestamp */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                    {new Date(log.timestamp).toLocaleString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>

                  {/* Action Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      log.actionType === 'GRANT'    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                      log.actionType === 'WITHDRAW' ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20' :
                      log.actionType === 'VALIDATE' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20' :
                      'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-600/20'
                    }`}>
                      {log.actionType}
                    </span>
                  </td>

                  {/* Principal */}
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900" title={log.userId}>
                    {log.userEmail || log.userId}
                  </td>

                  {/* Tenant */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{log.tenantId}</td>

                  {/* Purpose */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">{log.purposeName || '—'}</td>

                  {/* Status Badge */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.consentStatus ? (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
                        log.consentStatus === 'ACTIVE'    ? 'bg-emerald-100 text-emerald-800' :
                        log.consentStatus === 'WITHDRAWN' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {log.consentStatus}
                      </span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>

                  {/* Expiry */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getExpiryStyling(log.expiryDate)}>
                      {log.expiryDate
                        ? new Date(log.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                        : '—'}
                    </span>
                  </td>

                  {/* Hash */}
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-400 text-xs">
                    <div className="flex items-center gap-2">
                      <span title={log.cryptographicHash}>
                        {log.cryptographicHash ? `${log.cryptographicHash.substring(0, 10)}...` : '—'}
                      </span>
                      {log.cryptographicHash && (
                        <button
                          onClick={() => onCopy(log.cryptographicHash)}
                          className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-200 p-1.5 rounded transition-colors border border-gray-200 shadow-sm"
                          title="Copy Full Hash"
                        >
                          <Icons.Copy />
                        </button>
                      )}
                    </div>
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