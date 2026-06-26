import React, { useState, useEffect } from 'react';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';
import Icons from './Icons';

export default function CompanyManagement({ onCompanyAdded }) {
  const { getAccessTokenSilently } = useAuth0();
  const [fiduciaries, setFiduciaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  // Modal State for Credentials
  const [generatedCreds, setGeneratedCreds] = useState(null);

  // NEW: Assign Rep Modal State
  const [assigningTenant, setAssigningTenant] = useState(null); // holds { id, name }
  const [assignEmail, setAssignEmail] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchFiduciaries();
  }, []);

  const fetchFiduciaries = async () => {
    setIsLoading(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get('/admin/fiduciaries');
      setFiduciaries(res.data || []);
    } catch (err) {
      toast.error('Failed to load companies.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleEditClick = (company) => {
    setEditingId(company.id);
    setCompanyName(company.name);
    setTenantId(company.id);
    setCustomEmail('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCompanyName('');
    setTenantId('');
    setCustomEmail('');
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    if (!companyName || !tenantId) {
      toast.error("Both Name and Tenant ID are required.");
      return;
    }

    try {
      const api = await getSecureClient(getAccessTokenSilently);

      if (editingId) {
        // UPDATE EXISTING COMPANY
        await api.put(`/admin/fiduciaries/${editingId}`, {
          name: companyName,
          tenantId: tenantId
        });
        toast.success("Company Successfully Updated!");
        handleCancelEdit();
        fetchFiduciaries();
      } else {
        // ONBOARD NEW COMPANY — just creates tenant + default purposes
        // Role assignment happens separately via "Assign Rep" button
        await api.post('/admin/fiduciaries', {
          name: companyName,
          tenantId: tenantId,
        });

        toast.success("New Company Onboarded! Now assign a Fiduciary Rep using the 'Assign Rep' button.");
        handleCancelEdit();
        fetchFiduciaries();
        if (onCompanyAdded) onCompanyAdded();
      }

    } catch (err) {
      const errorMessage = err.response?.data?.error;
      toast.error(errorMessage || (editingId ? "Failed to update company." : "Failed to onboard company."));
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to delete ${name}? This will permanently wipe all associated purposes and tenant records!`)) return;

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.delete(`/admin/fiduciaries/${id}`);
      toast.success(`${name} has been permanently deleted.`);
      fetchFiduciaries();
      if (onCompanyAdded) onCompanyAdded();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete company.");
    }
  };

  // NEW: Handle Assign Fiduciary Rep
  const handleAssignRep = async () => {
    if (!assignEmail.trim()) {
      toast.error('Please enter an email address.');
      return;
    }

    setAssignLoading(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);

      // Calls the new endpoint in UserController
      await api.put('/users/admin/assign-fiduciary', {
        email: assignEmail.trim(),
        tenantId: assigningTenant.id,
        tenantName: assigningTenant.name
      });

      toast.success(`${assignEmail} is now Fiduciary Admin for ${assigningTenant.name}`);
      setAssigningTenant(null);
      setAssignEmail('');

    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('User not found. They must log in to the portal at least once first.');
      } else {
        toast.error('Failed to assign rep. Please try again.');
      }
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-8 relative">

      {/* ── LEFT SIDE: FORM ── */}
      <div className={`col-span-1 p-6 rounded-2xl border transition-colors shadow-sm h-fit ${
        editingId ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-gray-200'
      }`}>
        <h4 className="font-bold text-gray-900 mb-5 text-lg">
          {editingId ? `Update Company Details` : 'Onboard New Company'}
        </h4>

        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Company Name</label>
            <input
              required
              type="text"
              placeholder="e.g. Acme Corp"
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition-all shadow-sm"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tenant Identifier</label>
            <input
              required
              type="text"
              placeholder="e.g. TENANT_ACME"
              className="w-full px-4 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition-all shadow-sm disabled:bg-gray-100 disabled:text-gray-400"
              value={tenantId}
              onChange={e => setTenantId(e.target.value)}
              disabled={editingId !== null}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className={`flex-1 text-white text-sm font-bold py-2.5 rounded-lg transition shadow-sm ${
              editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-gray-800'
            }`}>
              {editingId ? 'Save Changes' : 'Onboard Company'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition shadow-sm">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Helper note */}
        {!editingId && (
          <p className="text-xs text-gray-400 mt-4 leading-relaxed">
            After onboarding, click <strong className="text-gray-600">Assign Rep</strong> on the company row to give a user Fiduciary Admin access.
          </p>
        )}
      </div>

      {/* ── RIGHT SIDE: DATA TABLE ── */}
      <div className="col-span-2">
        <div className="overflow-auto max-h-[600px] border border-gray-200 rounded-2xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">DB ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr><td colSpan="3" className="p-12 text-center text-sm font-medium text-gray-500">Loading fiduciaries...</td></tr>
              ) : fiduciaries.length === 0 ? (
                <tr><td colSpan="3" className="p-12 text-center text-sm font-medium text-gray-500">No companies onboarded yet.</td></tr>
              ) : (
                fiduciaries.map(company => (
                  <tr key={company.id} className={`transition-colors ${editingId === company.id ? 'bg-indigo-50/30' : 'hover:bg-gray-50/80'}`}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-400 text-xs">#{company.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-sm">🏢</span>
                        {company.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-4">
                      {/* NEW: Assign Rep button */}
                      <button
                        onClick={() => { setAssigningTenant({ id: company.id, name: company.name }); setAssignEmail(''); }}
                        className="text-emerald-600 hover:text-emerald-800 text-sm font-bold transition-colors"
                      >
                        Assign Rep
                      </button>
                      <button
                        onClick={() => handleEditClick(company)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-bold transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company.id, company.name)}
                        className="text-rose-600 hover:text-rose-900 text-sm font-bold transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ASSIGN REP MODAL ── */}
      {assigningTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-gray-900/5">
            <div className="px-6 py-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Assign Fiduciary Rep</h3>
              <p className="text-sm text-gray-500 mt-1">
                Assigning for: <span className="font-semibold text-gray-700">{assigningTenant.name}</span>
              </p>
            </div>

            <div className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  User Email Address
                </label>
                <input
                  type="email"
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="fiduciary@company.com"
                  className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-2">
                  The user must have logged into the portal at least once before you can assign them.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={handleAssignRep}
                disabled={assignLoading}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-purple-700 disabled:opacity-50 transition"
              >
                {assignLoading ? 'Assigning...' : 'Assign as Fiduciary Admin'}
              </button>
              <button
                onClick={() => { setAssigningTenant(null); setAssignEmail(''); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}