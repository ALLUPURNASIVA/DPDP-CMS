import React, { useEffect, useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { getSecureClient } from '../../api';

export default function ConsentManager() {
  const { tenantId } = useParams(); // Grabs the company ID from the URL (e.g., TENANT_A)
  const navigate = useNavigate();
  const { user, getAccessTokenSilently } = useAuth0();
  
  const [history, setHistory] = useState([]);
  const [availablePurposes, setAvailablePurposes] = useState([]);
  const [selectedPurposes, setSelectedPurposes] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [tenantId]); // Re-fetch if the URL tenant changes

  const fetchDashboardData = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      
      // Fetch both history and available purposes simultaneously
      const [historyRes, purposesRes] = await Promise.all([
        api.get('/consent/history'),
        api.get(`/consent/purposes/${tenantId}`)
      ]);
      
      // Filter the global history to ONLY show records for the company we are currently viewing
      const currentTenantHistory = historyRes.data.filter(h => h.tenantId === tenantId);
      setHistory(currentTenantHistory);
      
      // Filter out purposes the user has already actively consented to for THIS company
      const activeConsentPurposeIds = currentTenantHistory
        .filter(h => h.status === 'ACTIVE')
        .map(h => h.purpose.id);
        
      const unconsentedPurposes = purposesRes.data.filter(
        p => !activeConsentPurposeIds.includes(p.id)
      );
      
      setAvailablePurposes(unconsentedPurposes);
    } catch (e) {
      toast.error("Failed to load dashboard data. Check backend connection.");
      console.error(e);
    }
  };

  const handleTogglePurpose = (purposeId) => {
    setSelectedPurposes(prev => 
      prev.includes(purposeId) 
        ? prev.filter(id => id !== purposeId)
        : [...prev, purposeId]
    );
  };

  const handleSubmitConsent = async () => {
    if (selectedPurposes.length === 0) return;
    
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.post(`/consent/collect/${tenantId}`, selectedPurposes);
      toast.success('Consents granted successfully!');
      setSelectedPurposes([]); // Clear checkboxes
      fetchDashboardData();    // Refresh UI
    } catch (e) {
      toast.error('Failed to submit consents');
    }
  };

  const handleWithdraw = async (artifactId) => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.post(`/consent/withdraw/${artifactId}`);
      toast.success('Consent withdrawn. Processing stopped.');
      fetchDashboardData(); // Refresh UI
    } catch (e) {
      toast.error('Failed to withdraw consent');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/user/companies')}
          className="text-gray-500 hover:text-blue-600 transition flex items-center gap-1"
        >
          ← Back to Companies
        </button>
      </div>

      <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Consent Management</h1>
          <p className="text-sm text-gray-500">Managing data preferences for: <span className="font-semibold text-blue-600">{tenantId}</span></p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Left Column: Grant New Consents */}
        <div className="md:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Provide Consent</h2>
            
            {availablePurposes.length === 0 ? (
              <p className="text-sm text-gray-500">You have granted all available consents for this company.</p>
            ) : (
              <div className="space-y-4">
                {availablePurposes.map(purpose => (
                  <label key={purpose.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded border cursor-pointer hover:bg-gray-100 transition">
                    <input 
                      type="checkbox" 
                      className="mt-1 h-4 w-4 text-blue-600 rounded"
                      checked={selectedPurposes.includes(purpose.id)}
                      onChange={() => handleTogglePurpose(purpose.id)}
                    />
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {purpose.name} {purpose.isMandatory && <span className="text-red-500">*</span>}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{purpose.description}</p>
                    </div>
                  </label>
                ))}
                <button 
                  onClick={handleSubmitConsent}
                  disabled={selectedPurposes.length === 0}
                  className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:bg-blue-300 transition hover:bg-blue-700"
                >
                  Submit Preferences
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Consent History */}
        <div className="md:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 border-b pb-2">Consent History</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-500 text-sm border-b">
                    <th className="py-3 font-medium">Purpose</th>
                    <th className="font-medium">Status</th>
                    <th className="font-medium">Granted On</th>
                    <th className="font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-4 text-sm text-gray-800">
                        <span className="font-medium">{item.purpose.name}</span>
                      </td>
                      <td>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                          item.status === 'WITHDRAWN' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">
                        {new Date(item.grantedAt).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        {item.status === 'ACTIVE' && !item.purpose.isMandatory && (
                          <button 
                            onClick={() => handleWithdraw(item.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        No consent history found for this company.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}