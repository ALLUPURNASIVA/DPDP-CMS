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
  const groupedConsents = consents.reduce(
  (acc, consent) => {

    if (!acc[consent.tenantId]) {
      acc[consent.tenantId] = [];
    }

    acc[consent.tenantId].push(consent);

    return acc;

  },
  {}
);
const colors = [
  "bg-blue-50 border-blue-200",
  "bg-green-50 border-green-200",
  "bg-purple-50 border-purple-200",
  "bg-pink-50 border-pink-200",
  "bg-orange-50 border-orange-200"
];

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
        {Object.entries(groupedConsents).map(
  ([tenantId, companyConsents], index) => {

    const color =
      colors[index % colors.length];

    return (

      <div
        key={tenantId}
        className={`border rounded-2xl p-6 shadow-sm ${color}`}
      >

        <h3 className="text-3xl font-bold mb-2">
  {tenantId.replace("TENANT_", "")}
</h3>

        <p className="text-gray-500 mb-6">
          {companyConsents.length} Active Consent(s)
        </p>

        <div className="grid md:grid-cols-2 gap-6">

          {companyConsents.map((consent, idx) => (

            <div
              key={idx}
              className="
              bg-white/70
              rounded-xl
              p-5
              border
              "
            >

              <h4 className="font-bold text-lg">
                {consent.purposeName}
              </h4>

              <div className="grid grid-cols-3 gap-4 mt-4">

                <div>
                  <p className="text-gray-500 text-sm">
                    Granted On
                  </p>

                  <p>
                    {new Date(
                      consent.grantedAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">
                    Expires On
                  </p>

                  <p>
                    {new Date(
                      consent.expiresAt
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center justify-end">

                  <span className="
                  bg-green-100
                  text-green-700
                  px-3
                  py-1
                  rounded-full
                  text-sm
                  ">
                    ACTIVE
                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

    );
  }
)}
        

      </div>
    </div>
  );
}