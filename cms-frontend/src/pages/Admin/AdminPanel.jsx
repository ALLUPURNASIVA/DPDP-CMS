// AdminPanel.jsx — Main shell
//
// Responsibilities:
//   • Fetches all platform data (single source of truth for metrics)
//   • Renders sidebar, header, metric cards
//   • Routes to AuditLogs, UserManagement, Notifications, CompanyManagement
//   • Secures the route to only allow the designated admin email

import React, { useState, useEffect } from 'react';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

import Icons from './Icons';
import Dashboard from './Dashboard';
import AuditLogs from './AuditLogs';
import UserManagement from './UserManagement';
import Notifications from './Notifications';
import CompanyManagement from './CompanyManagement';

// ─── Navigation items ────────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const NAV_ITEMS = [
  { id: 'dashboard',     label: 'Overview',         icon: DashboardIcon  },
  { id: 'audit',         label: 'Audit Logs',       icon: Icons.Audit    },
  { id: 'users',         label: 'User Management',  icon: Icons.Users    },
  { id: 'notifications', label: 'Notifications',    icon: Icons.Bell     },
  { id: 'companies',     label: 'Companies',        icon: Icons.Building },
];

export default function AdminPanel() {
  // Pull Auth0 identity and loading states
  const { user, isAuthenticated, isLoading: isAuthLoading, getAccessTokenSilently } = useAuth0();

  const [activeTab, setActiveTab]       = useState('dashboard');
  const [auditLogs, setAuditLogs]       = useState([]);
  const [users, setUsers]               = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [companies, setCompanies]       = useState([]);
  const [isLoading, setIsLoading]       = useState(false);

  // Shared search term — lets UserManagement deep-link into AuditLogs
  const [auditSearchTerm, setAuditSearchTerm] = useState('');

  // ─── SECURITY CLEARANCE ─────────────────────────────────────────────────────
  const ADMIN_EMAILS = ['consentmanagement88@gmail.com'];

  const isPlatformAdmin = user?.email
    ? ADMIN_EMAILS.includes(user.email.toLowerCase())
    : false;

  // ─── Data fetching ──────────────────────────────────────────────────────────
  const fetchAllDashboardData = async () => {
    // Prevent fetching if the user isn't the admin to save API calls
    if (!isAuthenticated || !isPlatformAdmin) return;

    setIsLoading(true);
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const [logsRes, userRes, notifRes, compRes] = await Promise.all([
        api.get('/admin/logs').catch(() => ({ data: [] })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/notifications').catch(() => ({ data: [] })),
        api.get('/admin/fiduciaries').catch(() => api.get('/fiduciaries')).catch(() => ({ data: [] })),
      ]);

      setAuditLogs((logsRes.data || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      setUsers(userRes.data || []);
      setNotifications(notifRes.data || []);
      setCompanies(compRes.data || []);
    } catch {
      toast.error('Failed to sync platform telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    fetchAllDashboardData(); 
  }, [activeTab, isAuthenticated, user]);

  // ─── Shared clipboard helper ────────────────────────────────────────────────
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  // ─── Cross-tab navigation: jump to Audit tab pre-filtered by identifier ─────
  const handleViewUserLogs = (identifier) => {
    setAuditSearchTerm(identifier);
    setActiveTab('audit');
  };

  // ─── SECURITY RENDER BLOCKS ─────────────────────────────────────────────────

  // 1. Show a loading screen while Auth0 verifies the token & identity
  if (isAuthLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F9FAFB] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  // 2. Block access if the user is not logged in OR their email is not configured as platform admin
  if (!isAuthenticated || !isPlatformAdmin) {
    return (
      <div className="h-screen overflow-hidden bg-[#F9FAFB] flex items-center justify-center font-sans p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">Access Denied</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            This workspace is strictly restricted to platform administrators. The authenticated account <strong className="text-gray-900">{user?.email || 'Unknown'}</strong> does not have clearance.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render Normal Admin Panel ──────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB] flex font-sans text-gray-900 antialiased tracking-tight">

      {/* ── Sidebar ── */}
      <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-y-auto">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <h2 className="text-sm font-bold tracking-wide text-gray-900 uppercase">Admin Console</h2>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className={`mr-3 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                  <item.icon />
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* Sticky top bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-lg font-bold text-gray-900">Platform Administration</h1>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Operational
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">

          {/* ── Tab Panel ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

            {activeTab === 'dashboard' && (
              <Dashboard
                auditLogs={auditLogs}
                users={users}
                notifications={notifications}
                companies={companies}
                onNavigate={setActiveTab}
              />
            )}

            {activeTab === 'audit' && (
              <AuditLogs
                logs={auditLogs}
                isLoading={isLoading}
                onRefresh={fetchAllDashboardData}
                onCopy={handleCopy}
                externalSearch={auditSearchTerm}
                onExternalSearchConsumed={() => setAuditSearchTerm('')}
              />
            )}

            {activeTab === 'users' && (
              <UserManagement
                users={users}
                onViewLogs={handleViewUserLogs}
              />
            )}

            {activeTab === 'notifications' && (
              <Notifications notifications={notifications} />
            )}

            {activeTab === 'companies' && (
              <div className="p-6 bg-gray-50/30">
                <CompanyManagement onCompanyAdded={fetchAllDashboardData} />
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
