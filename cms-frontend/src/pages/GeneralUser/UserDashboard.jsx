import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getSecureClient } from "../../api";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, getAccessTokenSilently } = useAuth0();

  const [stats, setStats] = useState({ connected: 0, active: 0, explore: 0 });
  const [recentActivities, setRecentActivities] = useState([]);

  const storagePrefix = useMemo(() => {
    return user?.sub ? `profile:${user.sub}` : "profile:anonymous";
  }, [user?.sub]);

  const displayName = useMemo(() => {
    const savedName = localStorage.getItem(`${storagePrefix}:name`);

    if (savedName && savedName.trim()) return savedName.trim();
    if (user?.name && user.name !== user?.email) return user.name;
    if (user?.nickname) return user.nickname;
    if (user?.email) return user.email.split("@")[0];

    return "User";
  }, [storagePrefix, user?.name, user?.nickname, user?.email]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const isActiveConsent = (item) => {
    const status = String(item?.status || "").toUpperCase();
    return status === "ACTIVE" || status === "GRANTED";
  };

  const getTenantId = (company) => company?.tenantId || company?.id;

  const fetchDashboardStats = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const [companiesRes, historyRes] = await Promise.all([
        api.get("/consent/fiduciaries"),
        api.get("/consent/history")
      ]);

      const activeCompanies = companiesRes.data || [];
      const activeTenantIds = activeCompanies.map(getTenantId).filter(Boolean);

      const activeConsents = (historyRes.data || []).filter(
        (item) => activeTenantIds.includes(item.tenantId) && isActiveConsent(item)
      );

      const connectedCompanies = [
        ...new Set(activeConsents.map((item) => item.tenantId))
      ];

      const recentFive = [...(historyRes.data || [])]
        .filter((item) => activeTenantIds.includes(item.tenantId))
        .sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt))
        .slice(0, 5);

      setRecentActivities(recentFive);

      setStats({
        connected: connectedCompanies.length,
        active: activeConsents.length,
        explore: Math.max(activeCompanies.length - connectedCompanies.length, 0)
      });
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-white via-blue-50 to-blue-100 rounded-2xl shadow-md border border-gray-200 px-10 py-10 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Hi {displayName}
            </h1>

            <p className="text-gray-500 mt-3 text-lg max-w-lg leading-relaxed">
              Manage your privacy preferences and consent activity across active companies.
            </p>

            {stats.connected === 0 && (
              <button
                onClick={() => navigate("/user/explore")}
                className="mt-6 bg-blue-600 text-white px-5 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Explore companies
              </button>
            )}
          </div>

          <div className="hidden md:flex items-center justify-center w-40 h-32">
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-5xl">
              🛡️
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div
          onClick={() => navigate("/user/my-companies")}
          className="bg-white rounded-xl shadow border-l-4 border-blue-500 p-6 cursor-pointer hover:shadow-xl transition"
        >
          <p className="text-gray-500">Connected Companies</p>
          <h2 className="text-4xl font-bold text-blue-600 mt-2">{stats.connected}</h2>
          <p className="mt-5 text-blue-600 font-semibold">View My Companies -&gt;</p>
        </div>

        <div
          onClick={() => navigate("/user/active-consents")}
          className="bg-white rounded-xl shadow border-l-4 border-green-500 p-6 cursor-pointer hover:shadow-xl transition"
        >
          <p className="text-gray-500">Active Consents</p>
          <h2 className="text-4xl font-bold text-green-600 mt-2">{stats.active}</h2>
          <p className="mt-5 text-green-600 font-semibold">View Active Consents -&gt;</p>
        </div>

        <div
          onClick={() => navigate("/user/explore")}
          className="bg-white rounded-xl shadow border-l-4 border-purple-500 p-6 cursor-pointer hover:shadow-xl transition"
        >
          <p className="text-gray-500">Explore Companies</p>
          <h2 className="text-4xl font-bold text-purple-600 mt-2">{stats.explore}</h2>
          <p className="mt-5 text-purple-600 font-semibold">View Companies -&gt;</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <button onClick={() => navigate("/user/activity")} className="text-blue-600 font-semibold">
            View More -&gt;
          </button>
        </div>

        {recentActivities.length === 0 ? (
          <div className="border border-dashed rounded-xl p-10 text-center text-gray-500">
            No recent activity yet. Your consent actions will appear here.
          </div>
        ) : (
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
                <tr key={item.id || index} className="border-b">
                  <td className="py-4">{item.tenantId}</td>
                  <td>{item.purpose?.name || item.purposeName || "N/A"}</td>
                  <td>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      isActiveConsent(item)
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.grantedAt ? new Date(item.grantedAt).toLocaleString() : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}