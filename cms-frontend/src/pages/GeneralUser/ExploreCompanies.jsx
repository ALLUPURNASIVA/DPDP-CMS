import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";

export default function ExploreCompanies() {
  const [companies, setCompanies] = useState([]);
  const [myCompanies, setMyCompanies] = useState([]);

  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const companiesRes = await api.get("/fiduciaries");
      const historyRes = await api.get("/consent/history");

      const connectedCompanies = [
        ...new Set(historyRes.data.map((item) => item.tenantId)),
      ];

      setMyCompanies(connectedCompanies);

      const availableCompanies = companiesRes.data.filter(
        (c) => !connectedCompanies.includes(c.tenantId)
      );

      setCompanies(availableCompanies);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">

      {/* Back Button */}
      <button
        onClick={() => navigate("/user")}
        className="mb-6 text-gray-500 hover:text-blue-600 font-medium transition"
      >
        ← Back to Dashboard
      </button>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800">
          Explore Companies
        </h1>

        <p className="text-gray-500 mt-2 text-lg">
          Discover companies and manage your privacy preferences.
        </p>
      </div>

      {/* Empty State */}
      {companies.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
          <div className="text-5xl mb-4">🎉</div>

          <h2 className="text-2xl font-bold text-green-600">
            You are connected to all companies
          </h2>

          <p className="text-gray-500 mt-3">
            No more companies available right now.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-lg transition"
            >
              <h3 className="text-2xl font-bold text-gray-800">
                {company.name}
              </h3>

              <p className="text-gray-500 mt-3">
                Available Purposes:{" "}
                <span className="font-semibold text-blue-600">
                  {company.purposeCount || 0}
                </span>
              </p>

              <button
                onClick={() =>
                  navigate(`/user/consent/${company.tenantId}`)
                }
                className="mt-6 bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 transition"
              >
                Manage Consents
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}