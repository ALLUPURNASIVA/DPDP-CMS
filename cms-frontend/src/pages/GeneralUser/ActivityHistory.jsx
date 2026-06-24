import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";

export default function ActivityHistory() {

  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {

    const api = await getSecureClient(
      getAccessTokenSilently
    );

    const res = await api.get(
      "/consent/history"
    );

    setHistory(res.data);
  };

  return (

    <div className="max-w-6xl mx-auto">

      <button
        onClick={() => navigate('/user')}
        className="text-gray-500 hover:text-blue-600 transition"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Activity History
      </h1>

      <div className="bg-white border rounded-xl p-6 shadow-sm">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left p-3">
                Company
              </th>

              <th className="text-left p-3">
                Purpose
              </th>

              <th className="text-left p-3">
                Status
              </th>

              <th className="text-left p-3">
                Timestamp
              </th>

            </tr>

          </thead>

          <tbody>

            {history
              .slice()
              .reverse()
              .map((item) => (

                <tr
                  key={item.id}
                  className="border-b"
                >

                  <td className="p-3">
                    {item.tenantId}
                  </td>

                  <td className="p-3">
                    {item.purpose?.name}
                  </td>
                  <td className="p-3">
  <span
    style={{
      backgroundColor:
        item.status === "ACTIVE"
          ? "#DCFCE7"
          : item.status === "WITHDRAWN"
          ? "#FEE2E2"
          : "#FEF3C7",
      color:
        item.status === "ACTIVE"
          ? "#15803D"
          : item.status === "WITHDRAWN"
          ? "#B91C1C"
          : "#B45309",
      padding: "4px 12px",
      borderRadius: "9999px",
      fontSize: "12px",
      fontWeight: "600",
      display: "inline-block"
    }}
  >
    {item.status}
  </span>
</td>

                  <td className="p-3">
                    {new Date(
                      item.grantedAt
                    ).toLocaleString()}
                  </td>

                </tr>

              ))}

          </tbody>

        </table>

      </div>

    </div>

  );
}