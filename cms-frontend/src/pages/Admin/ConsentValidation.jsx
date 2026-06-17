import React, { useState } from "react";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";
import toast from "react-hot-toast";

export default function ConsentValidation() {
  const { getAccessTokenSilently } = useAuth0();

  const [userId, setUserId] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [purposeId, setPurposeId] = useState("");

  const [result, setResult] = useState(null);

  const validateConsent = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const res = await api.post("/consent/validate", {
        userId,
        tenantId,
        purposeId,
      });

      setResult(res.data.valid);

      toast.success("Validation completed");
    } catch (err) {
      console.error(err);
      toast.error("Validation failed");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow border p-6">
      <h2 className="text-2xl font-bold mb-6">
        Consent Validation
      </h2>

      <div className="space-y-4">

        <input
          className="w-full border rounded p-3"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        <input
          className="w-full border rounded p-3"
          placeholder="Tenant ID"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />

        <input
          className="w-full border rounded p-3"
          placeholder="Purpose ID"
          value={purposeId}
          onChange={(e) => setPurposeId(e.target.value)}
        />

        <button
          onClick={validateConsent}
          className="bg-blue-600 text-white px-5 py-2 rounded"
        >
          Validate Consent
        </button>

        {result !== null && (
          <div className="mt-6 p-4 border rounded">
            {result ? (
              <h3 className="text-green-600 font-bold">
                ✅ Consent Valid
              </h3>
            ) : (
              <h3 className="text-red-600 font-bold">
                ❌ Consent Not Found
              </h3>
            )}
          </div>
        )}
      </div>
    </div>
  );
}