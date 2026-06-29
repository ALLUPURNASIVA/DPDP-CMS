import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LayoutDashboard, Settings, Files, ShieldCheck, Users, AlertCircle, ListChecks } from 'lucide-react';
import { getSecureClient } from '../../api';

// Tabs
import AnalyticsOverview from './tabs/AnalyticsOverview';
import PurposeManagement from './tabs/PurposeManagement';
import ConsentDirectory from './tabs/ConsentDirectory';
import SubjectProfile from './tabs/SubjectProfile';
import WorkerAccess from './tabs/WorkerAccess';
import ComplaintQueue from '../../components/ComplaintQueue';
import ComplianceLogs from './tabs/ComplianceLogs'; // NEW IMPORT

export default function FiduciaryDashboard() {
  const { user, getAccessTokenSilently } = useAuth0();
  const [activeTab, setActiveTab] = useState('analytics');

  // NEW: Fetch the fiduciary's own company name dynamically
  const [companyName, setCompanyName] = useState('');
  const [tenantId, setTenantId] = useState('');

  useEffect(() => {
    const fetchMyCompany = async () => {
      try {
        const api = await getSecureClient(getAccessTokenSilently);

        // GET /users/me returns { role, tenantId }
        const meRes = await api.get('/users/me');
        const myTenantId = meRes.data.tenantId;
        setTenantId(myTenantId);

        // GET /api/fiduciaries returns list — find own company by tenantId
        const companiesRes = await api.get('/fiduciaries');
        const myCompany = companiesRes.data.find(c => c.id === myTenantId);
        if (myCompany) setCompanyName(myCompany.name);

      } catch (err) {
        console.error('Failed to load company info:', err);
      }
    };

    fetchMyCompany();
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-10 mb-12">

      {/* Page Header — now dynamic */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {companyName ? `${companyName} Compliance Dashboard` : 'Compliance Dashboard'}
        </h1>
        <p className="text-gray-500 mt-2">
          Logged in as Fiduciary Admin: <span className="font-medium text-gray-800">{user?.email}</span>
          {tenantId && (
            <span className="ml-3 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
              {tenantId}
            </span>
          )}
        </p>
      </div>

      <div className="flex gap-8">

        {/* Sidebar Navigation */}
        <div className="w-1/4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" /> Analytics Overview
            </button>
            <button
              onClick={() => setActiveTab('purposes')}
              className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'purposes' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Settings className="w-5 h-5 mr-3" /> Purpose Management
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'directory' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Files className="w-5 h-5 mr-3" /> Consent Directory
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <ShieldCheck className="w-5 h-5 mr-3" /> Subject Profile
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'team' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <Users className="w-5 h-5 mr-3" /> Worker Access
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'complaints' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <AlertCircle className="w-5 h-5 mr-3" /> Complaint Queue
            </button>
            {/* Compliance Logs Tab */}
            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'audit' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
            >
              <ListChecks className="w-5 h-5 mr-3" /> Compliance Logs
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="w-3/4">
          {activeTab === 'analytics' && <AnalyticsOverview />}
          {activeTab === 'purposes' && <PurposeManagement />}
          {activeTab === 'directory' && <ConsentDirectory />}
          {activeTab === 'profile' && <SubjectProfile />}
          {activeTab === 'team' && <WorkerAccess />}
          {activeTab === 'complaints' && <ComplaintQueue viewMode="admin" />}
          {activeTab === 'audit' && <ComplianceLogs />}
        </div>

      </div>
    </div>
  );
}