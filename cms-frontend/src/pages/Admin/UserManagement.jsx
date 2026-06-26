import React, { useState } from 'react';
import Icons from './Icons';

export default function UserManagement({ users = [], onViewLogs }) {
  const [selectedUser, setSelectedUser] = useState(null);

  // --- ROLE BADGE HELPER ---
  // Now reads from your users table role field directly
  const renderRoleBadge = (user) => {
    const role = user.role || 'GENERAL_USER';

    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20">
          Platform Admin
        </span>
      );
    }

    if (role === 'FIDUCIARY_ADMIN') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
          Fiduciary Admin
        </span>
      );
    }

    if (role === 'FIDUCIARY_WORKER') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20">
          Fiduciary Worker
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-600/20">
        General User
      </span>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/30">
        <h3 className="text-base font-bold text-gray-900">Data Principal Directory</h3>
        <p className="text-sm text-gray-500 mt-1 font-medium">Manage authenticated entities and access profiles.</p>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[calc(100vh-13rem)]">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50/50 border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Data Principal (Email)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-12 text-sm text-gray-500 font-medium">
                  No active principals found.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                    {user.email || user.id || user}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderRoleBadge(user)}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="text-gray-900 hover:text-indigo-600 transition-colors mr-4 font-bold"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => onViewLogs(user.email || user.id || user)}
                      className="text-gray-500 hover:text-gray-900 transition-colors font-bold"
                    >
                      Audit History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-gray-900/5">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Principal Profile</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors rounded-full p-1 hover:bg-gray-200"
              >
                <Icons.Close />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  System Role
                </label>
                <div>{renderRoleBadge(selectedUser)}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Auth0 System Identifier
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-700 break-all shadow-sm">
                  {selectedUser.id || selectedUser}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Resolved Email
                </label>
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 shadow-sm">
                  {selectedUser.email || 'Email not provided by backend'}
                </div>
              </div>
              {selectedUser.tenantId && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Assigned Company
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 shadow-sm">
                    {selectedUser.tenantId}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg shadow-sm text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}