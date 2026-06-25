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
  const [customEmail, setCustomEmail] = useState(''); // NEW: Allow custom email input

  // Modal State for Credentials
  const [generatedCreds, setGeneratedCreds] = useState(null);

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
    setCustomEmail(''); // Hide email field when editing
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
        // --- UPDATE EXISTING COMPANY ---
        await api.put(`/admin/fiduciaries/${editingId}`, {
          name: companyName,
          tenantId: tenantId
        });
        toast.success("Company Successfully Updated!");
        handleCancelEdit();
        fetchFiduciaries();
      } else {
        // --- ONBOARD NEW COMPANY ---
        
        // 1. Determine Email (Use custom or auto-generate)
        const cleanTenant = tenantId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const finalAdminEmail = customEmail.trim() !== '' ? customEmail.trim() : `admin@${cleanTenant}.com`;
        const finalAdminPassword = generateSecurePassword();

        // 2. Send Payload (Including the requested role)
        await api.post('/admin/fiduciaries', {
          name: companyName,
          tenantId: tenantId,
          adminEmail: finalAdminEmail,
          adminPassword: finalAdminPassword,
          role: "FIDUCIARY_REPRESENTATIVE" // Instruct backend to assign this Auth0 role
        });
        
        toast.success("New Company Onboarded!");
        
        // 3. Show Success Modal with Credentials
        setGeneratedCreds({
          companyName: companyName,
          email: finalAdminEmail,
          password: finalAdminPassword
        });

        // 4. Reset & Refresh
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

          {/* NEW FIELDS: Only show when onboarding a NEW company, not when editing */}
          {!editingId && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Email (Optional)</label>
                <input 
                  type="email" 
                  placeholder="e.g. admin@acmecorp.com" 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none transition-all shadow-sm" 
                  value={customEmail} 
                  onChange={e => setCustomEmail(e.target.value)} 
                />
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Leave blank to auto-generate from Tenant ID.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Role</label>
                <div className="w-full px-4 py-2.5 text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg shadow-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Fiduciary Representative
                </div>
              </div>
            </>
          )}

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
                <tr><td colSpan="4" className="p-12 text-center text-sm font-medium text-gray-500">Loading fiduciaries...</td></tr>
              ) : fiduciaries.length === 0 ? (
                <tr><td colSpan="4" className="p-12 text-center text-sm font-medium text-gray-500">No companies onboarded yet.</td></tr>
              ) : (
                fiduciaries.map(company => (
                  <tr key={company.id} className={`transition-colors ${editingId === company.id ? 'bg-indigo-50/30' : 'hover:bg-gray-50/80'}`}>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-gray-400 text-xs">#{company.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900 flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-sm">🏢</span>
                      {company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button onClick={() => handleEditClick(company)} className="text-indigo-600 hover:text-indigo-900 mr-5 text-sm font-bold transition-colors">Edit</button>
                      <button onClick={() => handleDeleteCompany(company.id, company.name)} className="text-rose-600 hover:text-rose-900 text-sm font-bold transition-colors">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SUCCESS MODAL: CREDENTIALS ── */}
      {generatedCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-gray-900/5 animate-fade-in">
            <div className="px-6 py-6 border-b border-gray-100 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Company Onboarded</h3>
              <p className="text-sm text-center text-gray-500 mt-2 font-medium">
                Please securely save these initial administrator credentials for <strong className="text-gray-900">{generatedCreds.companyName}</strong>.
              </p>
            </div>
            
            <div className="px-6 py-6 space-y-5 bg-gray-50/50">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Admin Email</label>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <span className="font-mono text-sm font-bold text-gray-900">{generatedCreds.email}</span>
                  <button onClick={() => copyToClipboard(generatedCreds.email)} className="text-gray-400 hover:text-gray-900 p-1.5 rounded transition-colors hover:bg-gray-50"><Icons.Copy /></button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Temporary Password</label>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <span className="font-mono text-sm font-bold text-gray-900">{generatedCreds.password}</span>
                  <button onClick={() => copyToClipboard(generatedCreds.password)} className="text-gray-400 hover:text-gray-900 p-1.5 rounded transition-colors hover:bg-gray-50"><Icons.Copy /></button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex justify-end">
              <button onClick={() => setGeneratedCreds(null)} className="w-full px-5 py-2.5 bg-gray-900 text-white rounded-lg shadow-sm text-sm font-bold hover:bg-gray-800 transition-colors">
                I have saved these credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}