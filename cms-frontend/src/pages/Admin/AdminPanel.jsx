import React, { useState, useEffect } from 'react';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

import PurposeManagement from "./PurposeManagement";
import UserManagement from "./UserManagement";
import NotificationStatus from "./NotificationStatus";
import CompanyManagement from "./CompanyManagement";
import ConsentValidation from "./ConsentValidation";

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

      const sortedLogs = res.data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setAuditLogs(sortedLogs);
    } catch (err) {
      toast.error('Failed to load audit logs');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Platform Administration
        </h2>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6 flex-wrap">

        <button
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'audit'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Logs
        </button>

        <button
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'purposes'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('purposes')}
        >
          Purpose Management
        </button>

        <button
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>

        <button
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'notifications'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('notifications')}
        >
          Notification Status
        </button>
        <button
  className={`px-6 py-3 font-medium text-sm ${
    activeTab === "companies"
      ? "border-b-2 border-blue-600 text-blue-600"
      : "text-gray-500 hover:text-gray-700"
  }`}
  onClick={() => setActiveTab("companies")}
>
  Company Management
</button>
<button
  className={`px-6 py-3 font-medium text-sm ${
    activeTab === "consent"
      ? "border-b-2 border-blue-600 text-blue-600"
      : "text-gray-500 hover:text-gray-700"
  }`}
  onClick={() => setActiveTab("consent")}
>
  Consent Validation
</button>

      </div>

      {/* Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              Immutable Audit Ledger
            </h3>

            <button
              onClick={fetchAuditLogs}
              className="text-sm text-blue-600 hover:underline"
            >
              ↻ Refresh Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">

              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Tenant</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Hash</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8 text-gray-500"
                    >
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8 text-gray-500"
                    >
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        {log.actionType}
                      </td>

                      <td className="py-3 px-4">
                        {log.userId}
                      </td>

                      <td className="py-3 px-4">
                        {log.tenantId}
                      </td>

                      <td className="py-3 px-4">
                        {log.sourceIp}
                      </td>

                      <td className="py-3 px-4">
                        {log.cryptographicHash?.substring(0, 16)}...
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

        </div>
      )}

      {/* Purpose Management */}
      {activeTab === 'purposes' && (
        <PurposeManagement />
      )}

      {/* User Management */}
      {activeTab === 'users' && (
        <UserManagement />
      )}

      {/* Notification Status */}
      {activeTab === 'notifications' && (
        <NotificationStatus />
      )}
{activeTab === "consent" && <ConsentValidation />}
{activeTab === "companies" && <CompanyManagement />}

    </div>
  );
}