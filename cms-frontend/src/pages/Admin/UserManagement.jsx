import React, { useEffect, useState } from "react";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";
import toast from "react-hot-toast";

export default function UserManagement() {
  const { getAccessTokenSilently } = useAuth0();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get("/admin/users");

      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow border p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-3xl font-bold">User Management</h3>

        <button
          onClick={loadUsers}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-5 rounded-xl">
          <h4 className="font-semibold text-gray-700">Total Users</h4>
          <p className="text-3xl font-bold text-blue-700">
            {users.length}
          </p>
        </div>

        <div className="bg-green-50 p-5 rounded-xl">
          <h4 className="font-semibold text-gray-700">General Users</h4>
          <p className="text-3xl font-bold text-green-700">
            {users.filter((u) => u.role === "GENERAL_USER").length}
          </p>
        </div>

        <div className="bg-purple-50 p-5 rounded-xl">
          <h4 className="font-semibold text-gray-700">Admins</h4>
          <p className="text-3xl font-bold text-purple-700">
            {users.filter((u) => u.role === "ADMIN").length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search user by email or id..."
          className="border rounded-lg p-3 w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center py-6">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3">User ID</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3">{user.id}</td>

                  <td className="p-3">{user.email}</td>

                  <td className="p-3">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {user.role}
                    </span>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found.
            </div>
          )}
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[500px] shadow-xl">

            <h2 className="text-2xl font-bold mb-4">
              User Details
            </h2>

            <div className="space-y-3">
              <p>
                <strong>User ID:</strong> {selectedUser.id}
              </p>

              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>

              <p>
                <strong>Role:</strong> {selectedUser.role}
              </p>

              <hr />

              <p>
                <strong>Total Consents:</strong> N/A
              </p>

              <p>
                <strong>Active Consents:</strong> N/A
              </p>

              <p>
                <strong>Last Activity:</strong> Available in Audit Logs
              </p>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
            >
              Close
            </button>

          </div>
        </div>
      )}
    </div>
  );
}