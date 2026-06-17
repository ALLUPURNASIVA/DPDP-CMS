import React, { useEffect, useState } from "react";
import { getSecureClient } from "../../api";
import { useAuth0 } from "@auth0/auth0-react";
import toast from "react-hot-toast";

export default function CompanyManagement() {
  const { getAccessTokenSilently } = useAuth0();

  const [companies, setCompanies] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    tenantId: "",
    name: "",
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      const res = await api.get("/admin/fiduciaries");

      setCompanies(res.data);
    } catch (err) {
      toast.error("Failed to load companies");
    }
  };

  const handleSubmit = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      if (editingId) {
        await api.put(`/admin/fiduciaries/${editingId}`, formData);
        toast.success("Company updated");
      } else {
        await api.post("/admin/fiduciaries", formData);
        toast.success("Company created");
      }

      setFormData({
        tenantId: "",
        name: "",
      });

      setEditingId(null);

      loadCompanies();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  const handleEdit = (company) => {
    setEditingId(company.id);

    setFormData({
      tenantId: company.tenantId,
      name: company.name,
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete company?")) return;

    try {
      const api = await getSecureClient(getAccessTokenSilently);

      await api.delete(`/admin/fiduciaries/${id}`);

      toast.success("Company deleted");

      loadCompanies();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">

      <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-xl font-bold mb-4">
          {editingId ? "Update Company" : "Create Company"}
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="border p-2 rounded"
            placeholder="Tenant ID"
            value={formData.tenantId}
            onChange={(e) =>
              setFormData({
                ...formData,
                tenantId: e.target.value,
              })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Company Name"
            value={formData.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                name: e.target.value,
              })
            }
          />
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 bg-blue-600 text-white px-5 py-2 rounded"
        >
          {editingId ? "Update Company" : "Create Company"}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow border">
        <h3 className="text-xl font-bold mb-4">
          Company Management
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Tenant ID</th>
              <th className="p-3 text-left">Company</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-b">
                <td className="p-3">{company.id}</td>
                <td className="p-3">{company.tenantId}</td>
                <td className="p-3">{company.name}</td>

                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(company)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(company.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}