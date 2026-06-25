import React, { useState, useEffect } from 'react';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

export default function CompanyManagement({ onCompanyAdded }) {
  const { getAccessTokenSilently } = useAuth0();
  const [fiduciaries, setFiduciaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [tenantId, setTenantId] = useState('');

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
      setFiduciaries(res.data);
    } catch (err) {
      toast.error('Failed to load companies.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Utility to generate a secure random password
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
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setCompanyName('');
    setTenantId('');
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
        
        // 1. Generate Credentials
        const cleanTenant = tenantId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const adminEmail = `admin@${cleanTenant}.com`;
        const adminPassword = generateSecurePassword();

        // 2. Send Payload
        await api.post('/admin/fiduciaries', {
          name: companyName,
          tenantId: tenantId,
          adminEmail: adminEmail,      // Sent to backend to create user
          adminPassword: adminPassword // Sent to backend to create user
        });
        
        toast.success("New Company Onboarded!");
        
        // 3. Show Success Modal with Credentials
        setGeneratedCreds({
          companyName: companyName,
          email: adminEmail,
          password: adminPassword
        });

        // 4. Reset & Refresh
        handleCancelEdit();
        fetchFiduciaries();
        
        // 5. Instantly update the parent dashboard metric!
        if (onCompanyAdded) onCompanyAdded(); 
      }
      
    } catch (err) {
      toast.error(editingId ? "Failed to update company." : "Failed to onboard company.");
      console.error(err);
    }
  };

  const handleDeleteCompany = async (id, name) => {
    if (!window.confirm(`CRITICAL WARNING: Are you sure you want to delete ${name}? This will permanently wipe all associated purposes and tenant records!`)) return;

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.delete(`/admin/fiduciaries/${id}`);
      toast.success(`${name} has been permanently deleted.`);
      fetchFiduciaries();
      
      // Update parent dashboard metric after deletion
      if (onCompanyAdded) onCompanyAdded();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error("Failed to delete company.");
      }
      console.error(err);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 relative">
      {/* LEFT SIDE: FORM */}
      <div className={`col-span-1 p-5 rounded-xl border h-fit transition-colors ${editingId ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-gray-200'}`}>
        <h4 className="font-bold text-slate-800 mb-4">
          {editingId ? `Update Company Details` : 'Onboard New Company'}
        </h4>
        
        <form onSubmit={handleSaveCompany}>
          <div className="mb-3">
            <label className="block text-xs font-bold text-gray-600 mb-1">Company Name</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. Acme Corp" 
              className="w-full p-2.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)} 
            />
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-600 mb-1">Tenant Identifier (System ID)</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. TENANT_ACME" 
              className="w-full p-2.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none" 
              value={tenantId} 
              onChange={e => setTenantId(e.target.value)}
              disabled={editingId !== null} 
              title={editingId ? "Tenant IDs cannot be changed once created." : ""}
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className={`flex-1 text-white text-sm font-bold py-2.5 rounded transition shadow-sm ${editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {editingId ? 'Save Changes' : 'Onboard Company'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded hover:bg-gray-50 transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* RIGHT SIDE: DATA TABLE */}
      <div className="col-span-2">
        <div className="overflow-y-auto max-h-[500px] border rounded-lg bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-3 font-semibold">DB ID</th>
                <th className="p-3 font-semibold">Company Name</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">Loading fiduciaries...</td></tr>
              ) : fiduciaries.length === 0 ? (
                <tr><td colSpan="4" className="p-6 text-center text-gray-500">No companies onboarded yet.</td></tr>
              ) : (
                fiduciaries.map(company => (
                  <tr key={company.id} className={`border-b last:border-0 transition-colors ${editingId === company.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="p-3 text-gray-500 text-xs">#{company.id}</td>
                    <td className="p-3 font-bold text-slate-800 flex items-center gap-2">
                      <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs">🏢</span>
                      {company.name}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => handleEditClick(company)} className="text-blue-600 hover:text-blue-800 mr-4 text-xs font-bold transition">Edit</button>
                      <button onClick={() => handleDeleteCompany(company.id, company.name)} className="text-red-600 hover:text-red-800 text-xs font-bold transition">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUCCESS MODAL: DISPLAYS GENERATED CREDENTIALS */}
      {generatedCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden ring-1 ring-slate-900/5 animate-fade-in">
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4 mx-auto">
                <span className="text-green-600 text-xl font-bold">✓</span>
              </div>
              <h3 className="text-xl font-semibold text-center text-slate-900">Company Onboarded</h3>
              <p className="text-sm text-center text-gray-500 mt-1">
                Please save these initial administrator credentials for {generatedCreds.companyName}.
              </p>
            </div>
            
            <div className="px-6 py-6 space-y-4 bg-slate-50/50">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Admin Email</label>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <span className="font-mono text-sm text-slate-900">{generatedCreds.email}</span>
                  <button onClick={() => copyToClipboard(generatedCreds.email)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Copy</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Temporary Password</label>
                <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <span className="font-mono text-sm text-slate-900">{generatedCreds.password}</span>
                  <button onClick={() => copyToClipboard(generatedCreds.password)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Copy</button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setGeneratedCreds(null)} 
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md shadow-sm text-sm font-bold hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                I have saved these credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}