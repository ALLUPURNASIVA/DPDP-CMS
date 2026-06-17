import React, { useEffect, useState } from "react";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";
import toast from "react-hot-toast";

export default function PurposeManagement() {
  const { getAccessTokenSilently } = useAuth0();

  const [purposes, setPurposes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    tenantId: "",
    name: "",
    description: "",
    mandatory: false,
  });

  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadPurposes();
    loadCompanies();
  }, []);

  const loadPurposes = async () => {
    try {
      setLoading(true);

      const api = await getSecureClient(getAccessTokenSilently);

      const res = await api.get("/admin/purposes");

      setPurposes(res.data);
    } catch (err) {
      toast.error("Failed to load purposes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const res = await api.get("/fiduciaries");

      setCompanies(res.data);
    } catch (err) {
      toast.error("Failed to load companies");
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const payload = {
        tenantId: formData.tenantId,
        name: formData.name,
        description: formData.description,
        mandatory: formData.mandatory,
      };

      if (editingId) {
        await api.put(`/admin/purposes/${editingId}`, payload);
        toast.success("Purpose updated successfully");
      } else {
        await api.post("/admin/purposes", payload);
        toast.success("Purpose created successfully");
      }

      setFormData({
        tenantId: "",
        name: "",
        description: "",
        mandatory: false,
      });

      setEditingId(null);

      loadPurposes();
    } catch (err) {
      toast.error("Operation failed");
      console.error(err);
    }
  };

  const handleEdit = (purpose) => {
    setEditingId(purpose.id);

    setFormData({
      tenantId: purpose.tenantId,
      name: purpose.name,
      description: purpose.description,
      mandatory: purpose.mandatory,
    });
  };

  const getCompanyName = (tenantId) => {
    const company = companies.find(
      (c) => c.tenantId === tenantId
    );

    return company ? company.name : tenantId;
  };

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-xl shadow border p-6">
        <h3 className="text-xl font-bold mb-4">
          {editingId ? "Update Purpose" : "Create Purpose"}
        </h3>

        <div className="grid md:grid-cols-2 gap-4">

          <select
            className="border rounded p-2"
            value={formData.tenantId}
            onChange={(e) =>
              setFormData({
                ...formData,
                tenantId: e.target.value,
              })
            }
          >
            <option value="">
              Select Company
            </option>

            {companies.map((company) => (
              <option
                key={company.id}
                value={company.tenantId}
              >
                {company.name}
              </option>
            ))}
          </select>

          <input
            className="border rounded p-2"
            placeholder="Purpose Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
          />

          <textarea
            className="border rounded p-2 md:col-span-2"
            rows="3"
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.mandatory}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  mandatory: e.target.checked,
                })
              }
            />
            Mandatory Purpose
          </label>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded"
        >
          {editingId
            ? "Update Purpose"
            : "Create Purpose"}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border p-6">
        <h3 className="text-xl font-bold mb-4">
          Purpose Management
        </h3>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">
                  ID
                </th>

                <th className="text-left p-3">
                  Company
                </th>

                <th className="text-left p-3">
                  Purpose
                </th>

                <th className="text-left p-3">
                  Description
                </th>

                <th className="text-left p-3">
                  Mandatory
                </th>

                <th className="text-left p-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {purposes.map((purpose) => (
                <tr
                  key={purpose.id}
                  className="border-b"
                >
                  <td className="p-3">
                    {purpose.id}
                  </td>

                  <td className="p-3">
                    {getCompanyName(
                      purpose.tenantId
                    )}
                  </td>

                  <td className="p-3">
                    {purpose.name}
                  </td>

                  <td className="p-3">
                    {purpose.description}
                  </td>

                  <td className="p-3">
                    {purpose.mandatory
                      ? "Yes"
                      : "No"}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() =>
                        handleEdit(purpose)
                      }
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}