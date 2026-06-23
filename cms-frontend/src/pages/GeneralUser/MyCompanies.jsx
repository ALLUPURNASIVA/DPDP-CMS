import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";

export default function MyCompanies() {

  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [companies, setCompanies] = useState([]);
  const [history, setHistory] = useState([]);
  const [myCompanies, setMyCompanies] = useState([]);

  useEffect(() => {
    fetchCompanies();
    fetchHistory();
  }, []);

  const fetchCompanies = async () => {
    try {

      const api = await getSecureClient(
        getAccessTokenSilently
      );

      const res = await api.get("/consent/fiduciaries");

      setCompanies(res.data);

    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {

      const api = await getSecureClient(
        getAccessTokenSilently
      );

      const res = await api.get(
        "/consent/history"
      );

      setHistory(res.data);

      const uniqueCompanies = [
        ...new Set(
          res.data.map(
            item => item.tenantId
          )
        )
      ];

      setMyCompanies(uniqueCompanies);

    } catch (err) {
      console.error(err);
    }
  };

  const connectedCompanies =
    companies.filter(
      company =>
        myCompanies.includes(
          company.tenantId
        )
    );

  return (

    <div className="max-w-6xl mx-auto">
    <button
  onClick={() => navigate('/user')}
  className="text-gray-500 hover:text-blue-600 transition"
>
  ← Back to Dashboard
</button>

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-gray-800">
          My Connected Companies
        </h1>

        <p className="text-gray-500 mt-2">
          Companies where you have already provided consent.
        </p>

      </div>

      {/* No Companies */}

      {connectedCompanies.length === 0 ? (

        <div className="bg-white border rounded-xl p-8 text-center">

          <p className="text-gray-500">
            No connected companies found.
          </p>

        </div>

      ) : (

        <div className="grid md:grid-cols-2 gap-5">

          {connectedCompanies.map((company) => (

            <div
              key={company.id}
              className="bg-white border rounded-xl p-6 shadow-sm"
            >

              <h3 className="text-xl font-bold text-gray-800">
                {company.name}
              </h3>

              <p className="text-gray-500 mt-2">
                Tenant ID : {company.tenantId}
              </p>

              <div className="flex gap-3 mt-5">

                <button
                  onClick={() =>
                    navigate(
                      `/user/consent/${company.tenantId}`
                    )
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  Manage Consents
                </button>

                

              </div>

            </div>

          ))}

        </div>

      )}

    </div>

  );
}