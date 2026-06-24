import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";

import axios from "axios";

export default function MyCompanies() {

  const navigate = useNavigate();
  const { getAccessTokenSilently } = useAuth0();

  const [companies, setCompanies] = useState([]);
  const [history, setHistory] = useState([]);
  const [myCompanies, setMyCompanies] = useState([]);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
const [subject, setSubject] = useState("");

const [description, setDescription] = useState("");
const [selectedCompany, setSelectedCompany] = useState(null);

const [companyStats, setCompanyStats] = useState({});

  useEffect(() => {
    fetchCompanies();
    fetchHistory();
  }, []);
  
  /*useEffect(() => {

  axios
    .get("http://localhost:8080/api/fiduciary/stats")
    .then((res) => {
      setStats(res.data);
    })
    .catch((err) => {
      console.error(err);
    });

}, []);*/
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
  const fetchCompanyStats = async (tenantId) => {
  try {

    const api = await getSecureClient(
      getAccessTokenSilently
    );

    const res = await api.get(
      `/user/company-stats/${tenantId}`,
    );

    setCompanyStats(prev => ({
      ...prev,
      [tenantId]: res.data
    }));

  } catch (err) {
    console.error(err);
  }
};

const connectedCompanies = companies.filter(
  company => myCompanies.includes(company.tenantId)
);

useEffect(() => {

  if (connectedCompanies.length > 0) {

    connectedCompanies.forEach(company => {
      fetchCompanyStats(company.tenantId);
    });

  }

}, [connectedCompanies.length]);
const submitComplaint = async () => {
  try {

    await axios.post(
      "http://localhost:8080/api/complaints",
      {
        tenantId: selectedCompany?.tenantId,
        userId: "USER_001",
        subject,
        description
      }
    );

    alert("Complaint submitted successfully");

    setSubject("");
    setDescription("");
    setShowComplaintModal(false);

  } catch (error) {
    console.error(error);
    alert("Failed to submit complaint");
  }
};



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

              
              <div className="mt-4 space-y-2 text-sm">

                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Active Consents
                              </span>

                              <span className="font-semibold text-green-600">
                                {companyStats[company.tenantId]?.activeConsents ?? 0}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Complaints Raised
                              </span>

                              <span className="font-semibold text-orange-500">
                                {companyStats[company.tenantId]?.complaintsRaised ?? 0}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Open Complaints
                              </span>

                              <span className="font-semibold text-red-500">
                                {companyStats[company.tenantId]?.openComplaints ?? 0}
                              </span>
                            </div>

                          </div>
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
                <button
                  onClick={() => {
                    setSelectedCompany(company);
                    setShowComplaintModal(true);
                  }}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Raise Complaint
                </button>
                {showComplaintModal && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

                      <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6">

                        <h2 className="text-2xl font-bold mb-4">
                          Raise Complaint
                        </h2>

                        <input
                          type="text"
                          placeholder="Subject"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full border rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <textarea
                          rows="5"
                          placeholder="Complaint Description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full border rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="flex justify-end gap-3">

                          <button
                            onClick={() => setShowComplaintModal(false)}
                            className="px-4 py-2 border rounded-lg"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={submitComplaint}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Submit Complaint
                          </button>

                        </div>

                      </div>

                    </div>
                  )}

              </div>

            </div>

          ))}

        </div>

      )}

    </div>

  );
}
