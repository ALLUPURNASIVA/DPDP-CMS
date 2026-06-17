import React, { useEffect, useState } from "react";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";
import toast from "react-hot-toast";

export default function NotificationStatus() {
  const { getAccessTokenSilently } = useAuth0();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get("/admin/notifications");

      const sorted = res.data.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setNotifications(sorted);
    } catch (err) {
      toast.error("Failed to load notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter(
    (n) =>
      n.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.tenantId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow border p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold">Notification Status</h3>

        <button
          onClick={loadNotifications}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-blue-50 p-4 rounded-xl">
          <h4 className="font-semibold">Total</h4>
          <p className="text-3xl font-bold text-blue-700">
            {notifications.length}
          </p>
        </div>

        <div className="bg-green-50 p-4 rounded-xl">
          <h4 className="font-semibold">Grants</h4>
          <p className="text-3xl font-bold text-green-700">
            {notifications.filter(n => n.actionType === "GRANT").length}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-xl">
          <h4 className="font-semibold">Withdrawals</h4>
          <p className="text-3xl font-bold text-red-700">
            {notifications.filter(n => n.actionType === "WITHDRAW").length}
          </p>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl">
          <h4 className="font-semibold">Validations</h4>
          <p className="text-3xl font-bold text-purple-700">
            {notifications.filter(n => n.actionType === "VALIDATE").length}
          </p>
        </div>

      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by User ID or Tenant..."
          className="border rounded-lg p-3 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center py-6">Loading notifications...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Action</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Timestamp</th>
              </tr>
            </thead>

            <tbody>
              {filteredNotifications.map((n) => (
                <tr
                  key={n.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">{n.userId}</td>

                  <td className="p-3">{n.tenantId}</td>

                  <td className="p-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        n.actionType === "GRANT"
                          ? "bg-green-100 text-green-700"
                          : n.actionType === "WITHDRAW"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {n.actionType}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                      Delivered
                    </span>
                  </td>

                  <td className="p-3">
                    {new Date(n.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No notifications found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}