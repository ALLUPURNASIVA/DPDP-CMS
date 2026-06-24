import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getSecureClient } from "../../api";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, getAccessTokenSilently } = useAuth0();

  const [stats, setStats] = useState({
    connected: 0,
    active: 0,
    explore: 0
  });

  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const [companiesRes, historyRes] = await Promise.all([
        api.get("/consent/fiduciaries"),
        api.get("/consent/history")
      ]);

      const connectedCompanies = [
        ...new Set(historyRes.data.map(item => item.tenantId))
      ];

      const activeConsents = historyRes.data.filter(
        item =>
          item.status === "ACTIVE" ||
          item.status === "GRANTED"
      );

      const recentFive = [...historyRes.data]
        .sort(
          (a, b) =>
            new Date(b.grantedAt) - new Date(a.grantedAt)
        )
        .slice(0, 5);

      setRecentActivities(recentFive);

      setStats({
        connected: connectedCompanies.length,
        active: activeConsents.length,
        explore:
          companiesRes.data.length - connectedCompanies.length
      });

    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">

      {/* Hero Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-white via-blue-50 to-blue-100 rounded-3xl shadow-md border border-gray-200 px-12 py-10 flex justify-between items-center">

          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Hi {localStorage.getItem("userName") || user?.name} 
            </h1>

            <p className="text-gray-500 mt-3 text-lg max-w-lg leading-relaxed">
              Manage your privacy preferences and consent activity across all companies.
            </p>
          </div>

          <div className="hidden md:flex items-center justify-center w-60 h-40">
            <div className="w-32 h-32 bg-white rounded-full shadow-lg flex items-center justify-center">
              <span className="text-6xl">🛡️</span>
            </div>
          </div>

        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">

        <div
          onClick={() => navigate("/user/my-companies")}
          className="bg-white rounded-2xl shadow border-l-4 border-blue-500 p-6 cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-2xl">
              🏢
            </div>

            <div>
              <p className="text-gray-500">Connected Companies</p>
              <h2 className="text-4xl font-bold text-blue-600">
                {stats.connected}
              </h2>
            </div>
          </div>

          <p className="mt-5 text-blue-600 font-semibold">
            View My Companies →
          </p>
        </div>

        <div
          onClick={() => navigate("/user/active-consents")}
          className="bg-white rounded-2xl shadow border-l-4 border-green-500 p-6 cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center text-2xl">
              ✅
            </div>

            <div>
              <p className="text-gray-500">Active Consents</p>
              <h2 className="text-4xl font-bold text-green-600">
                {stats.active}
              </h2>
            </div>
          </div>

          <p className="mt-5 text-green-600 font-semibold">
            View Active Consents →
          </p>
        </div>

        <div
          onClick={() => navigate("/user/explore")}
          className="bg-white rounded-2xl shadow border-l-4 border-purple-500 p-6 cursor-pointer hover:shadow-xl transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center text-2xl">
              🔍
            </div>

            <div>
              <p className="text-gray-500">Explore Companies</p>
              <h2 className="text-4xl font-bold text-purple-600">
                {stats.explore}
              </h2>
            </div>
          </div>

          <p className="mt-5 text-purple-600 font-semibold">
            View Companies →
          </p>
        </div>

      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-900">
            Recent Activity
          </h2>

          <button
            onClick={() => navigate("/user/activity")}
            className="text-blue-600 font-semibold"
          >
            View More →
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b text-left">
              <th className="py-4">Company</th>
              <th>Purpose</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>

          <tbody>
            {recentActivities.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-4">{item.tenantId}</td>

                <td>
                  {item.purpose?.name ||
                    item.purposeName ||
                    "N/A"}
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      item.status === "ACTIVE"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>

                <td>
                  {item.grantedAt
                    ? new Date(item.grantedAt).toLocaleString()
                    : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}