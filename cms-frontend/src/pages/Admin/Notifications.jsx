// Notifications.jsx — Delivery Telemetry tab
//
// Props:
//   notifications {Array} — notification records from parent

import React, { useState } from 'react';

const FILTER_OPTIONS = ['All', 'Sent', 'Pending', 'Failed'];

export default function Notifications({ notifications = [] }) {
  const [notifFilter, setNotifFilter] = useState('All');

  const filteredNotifs = notifFilter === 'All'
    ? notifications
    : notifications.filter(n => n.status === notifFilter.toUpperCase());

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Delivery Telemetry</h3>
          <p className="text-sm text-gray-500 mt-1 font-medium">Real-time status of outgoing platform messages.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-gray-100/80 p-1 rounded-lg border border-gray-200 shadow-sm">
          {FILTER_OPTIONS.map(status => (
            <button
              key={status}
              onClick={() => setNotifFilter(status)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all duration-200 ${
                notifFilter === status
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[calc(100vh-13rem)]">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50/50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              {['Message ID', 'Recipient', 'Timestamp', 'Status', 'Diagnostics'].map(h => (
                <th key={h} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {filteredNotifs.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-12 text-sm text-gray-500 font-medium">
                  No telemetry data available.
                </td>
              </tr>
            ) : (
              filteredNotifs.map(n => (
                <tr key={n.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-500 text-xs">{n.messageId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{n.recipient}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                    {new Date(n.timestamp).toLocaleString(undefined, {
                      month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      n.status === 'SENT'    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                      n.status === 'FAILED'  ? 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20' :
                      'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20'
                    }`}>
                      {n.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-medium">
                    {n.errorLog
                      ? <span className="text-rose-600">{n.errorLog}</span>
                      : <span className="text-emerald-600">250 OK Delivered</span>
                    }
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