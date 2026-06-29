import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";

export default function MyCompanies() {
  const navigate = useNavigate();
  const { getAccessTokenSilently, user } = useAuth0();

  const [companies, setCompanies] = useState([]);
  const [history, setHistory] = useState([]);
  const [companyStats, setCompanyStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);

  const getTenantId = (company) => company?.tenantId || company?.id;

  const isActiveConsent = (item) => {
    const status = String(item?.status || "").toUpperCase();
    return status === "ACTIVE" || status === "GRANTED";
  };

  const activeConsentCounts = useMemo(() => {
    return (history || []).reduce((acc, item) => {
      if (!isActiveConsent(item) || !item.tenantId) return acc;

      acc[item.tenantId] = (acc[item.tenantId] || 0) + 1;
      return acc;
    }, {});
  }, [history]);

  const connectedCompanies = useMemo(() => {
    return (companies || []).filter((company) => {
      const tenantId = getTenantId(company);
      return tenantId && (activeConsentCounts[tenantId] || 0) > 0;
    });
  }, [companies, activeConsentCounts]);

  useEffect(() => {
    fetchPageData();
  }, []);

  useEffect(() => {
    connectedCompanies.forEach((company) => {
      const tenantId = getTenantId(company);
      if (tenantId && !companyStats[tenantId]) {
        fetchCompanyStats(tenantId);
      }
    });
  }, [connectedCompanies]);

  const fetchPageData = async () => {
    setLoading(true);

    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const [companiesRes, historyRes] = await Promise.all([
        api.get("/consent/fiduciaries"),
        api.get("/consent/history")
      ]);

      setCompanies(companiesRes.data || []);
      setHistory(historyRes.data || []);
    } catch (err) {
      console.error("Failed to load connected companies", err);
      setCompanies([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

 const fetchCompanyStats = async (tenantId) => {
  try {
    const api = await getSecureClient(getAccessTokenSilently);
    const res = await api.get(`/complaints/my-stats/${tenantId}`);

    setCompanyStats((prev) => ({
      ...prev,
      [tenantId]: {
        complaintsRaised: res.data?.complaintsRaised ?? 0,
        openComplaints: res.data?.openComplaints ?? 0
      }
    }));
  } catch (err) {
    console.error("Failed to load company complaint stats", err);

    setCompanyStats((prev) => ({
      ...prev,
      [tenantId]: {
        complaintsRaised: 0,
        openComplaints: 0
      }
    }));
  }
};

  const submitComplaint = async () => {
    try {
      const tenantId = getTenantId(selectedCompany);

      if (!tenantId) {
        alert("Company not selected.");
        return;
      }

      const api = await getSecureClient(getAccessTokenSilently);

      await api.post("/complaints", {
        tenantId,
        userId: user?.sub,
        subject,
        description
      });

      alert("Complaint submitted successfully");

      setSubject("");
      setDescription("");
      setShowComplaintModal(false);
      setSelectedCompany(null);

      await fetchCompanyStats(tenantId);
      await fetchPageData();
    } catch (error) {
      console.error(error);
      alert("Failed to submit complaint. Please check your connection.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/user")}
        className="text-gray-500 hover:text-blue-600 transition"
      >
        &lt;- Back to Dashboard
      </button>

      <div className="mb-8 mt-4">
        <h1 className="text-3xl font-bold text-gray-800">My Connected Companies</h1>
        <p className="text-gray-500 mt-2">
          Active companies where you currently have active consent.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
          Loading connected companies...
        </div>
      ) : connectedCompanies.length === 0 ? (
        <div className="bg-white border rounded-xl p-10 text-center">
          <h2 className="text-xl font-bold text-gray-800">No connected companies found</h2>
          <p className="text-gray-500 mt-2">Explore companies and grant consent to connect.</p>

          <button
            onClick={() => navigate("/user/explore")}
            className="mt-5 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
          >
            Explore Companies
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5">
          {connectedCompanies.map((company) => {
            const tenantId = getTenantId(company);
            const stats = companyStats[tenantId] || {};
            const activeCount = activeConsentCounts[tenantId] || 0;

            return (
              <div key={tenantId} className="bg-white border rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800">{company.name}</h3>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Consents</span>
                    <span className="font-semibold text-green-600">
                      {activeCount}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Complaints Raised</span>
                    <span className="font-semibold text-orange-500">
                      {stats.complaintsRaised ?? 0}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Open Complaints</span>
                    <span className="font-semibold text-red-500">
                      {stats.openComplaints ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => navigate(`/user/consent/${tenantId}`)}
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showComplaintModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">Raise Complaint</h2>

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
                onClick={() => {
                  setShowComplaintModal(false);
                  setSelectedCompany(null);
                }}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={submitComplaint}
                disabled={!subject.trim() || !description.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                Submit Complaint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}