import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { LayoutDashboard, Settings, Files, ShieldCheck, Users } from 'lucide-react';

// Import your new sub-components
import AnalyticsOverview from './tabs/AnalyticsOverview';
import PurposeManagement from './tabs/PurposeManagement';
import ConsentDirectory from './tabs/ConsentDirectory';
import SubjectProfile from './tabs/SubjectProfile';
import WorkerAccess from './tabs/WorkerAccess';

export default function FiduciaryDashboard() {
  const { user } = useAuth0();
  const [activeTab, setActiveTab] = useState('analytics'); 

  return (
    <div className="max-w-6xl mx-auto mt-10 mb-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Swiggy Compliance Dashboard</h1>
        <p className="text-gray-500 mt-2">
          Logged in as Fiduciary Admin: <span className="font-medium text-gray-800">{user?.email}</span>
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <div className="w-1/4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'analytics' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <LayoutDashboard className="w-5 h-5 mr-3" /> Analytics Overview
            </button>
            <button onClick={() => setActiveTab('purposes')} className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'purposes' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <Settings className="w-5 h-5 mr-3" /> Purpose Management
            </button>
            <button onClick={() => setActiveTab('directory')} className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'directory' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <Files className="w-5 h-5 mr-3" /> Consent Directory
            </button>
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <ShieldCheck className="w-5 h-5 mr-3" /> Subject Profile
            </button>
            <button onClick={() => setActiveTab('team')} className={`w-full flex items-center px-6 py-4 font-medium transition-colors ${activeTab === 'team' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <Users className="w-5 h-5 mr-3" /> Worker Access
            </button>
          </div>
        </div>

        {/* Main Content Area - Renders the selected component cleanly */}
        <div className="w-3/4">
          {activeTab === 'analytics' && <AnalyticsOverview />}
          {activeTab === 'purposes' && <PurposeManagement />}
          {activeTab === 'directory' && <ConsentDirectory />}
          {activeTab === 'profile' && <SubjectProfile />}
          {activeTab === 'team' && <WorkerAccess />}
        </div>
      </div>
    </div>
  );
}