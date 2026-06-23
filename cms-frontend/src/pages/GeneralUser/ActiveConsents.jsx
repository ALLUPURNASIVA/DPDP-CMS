import React, { useEffect, useState } from "react";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export default function ActiveConsents() {
  const { getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  const [consents, setConsents] = useState([]);

  useEffect(() => {
    fetchActiveConsents();
  }, []);

  const fetchActiveConsents = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const res = await api.get("/consent/active-consents");

      const activeConsents = res.data.filter(
        (consent) =>
          consent.status === "ACTIVE" ||
          consent.status === "GRANTED"
      );

      setConsents(activeConsents);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/user")}
        className="text-gray-500 hover:text-blue-600 transition"
      >
        ← Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Active Consents
        </h1>

        <p className="text-gray-500 mt-2">
          View all active consents granted across companies.
        </p>
      </div>

      <div className="space-y-4">
        {consents.length === 0 && (
          <div className="bg-white border rounded-xl p-10 text-center">
            <h2 className="text-xl font-semibold text-gray-500">
              No active consents found
            </h2>
          </div>
        )}

        {consents.map((consent, index) => (
          <div
            key={index}
            className="bg-white border rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-xl font-bold text-blue-600">
              {consent.tenantId}
            </h3>

            <div className="mt-4 space-y-2">
              <p>
                <strong>Purpose:</strong>{" "}
                {consent.purposeName || "N/A"}
              </p>

              <p>
                <strong>Granted On:</strong>{" "}
                {consent.grantedAt
                  ? new Date(consent.grantedAt).toLocaleDateString()
                  : "N/A"}
              </p>

              <p>
                <strong>Expires On:</strong>{" "}
                {consent.expiresAt
                  ? new Date(consent.expiresAt).toLocaleDateString()
                  : "N/A"}
              </p>

              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                {consent.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}