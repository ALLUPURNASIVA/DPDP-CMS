import React, { useState, useEffect } from 'react';
import { getSecureClient } from '../../api';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';

import CompanyManagement from "./CompanyManagement";


export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('audit');
  const [configView, setConfigView] = useState('hub'); 
  
  const [auditLogs, setAuditLogs] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [users, setUsers] = useState([]);
  
  // NEW: State for live notifications
  const [notifications, setNotifications] = useState([]); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newPurposeName, setNewPurposeName] = useState('');
  const [newPurposeDesc, setNewPurposeDesc] = useState('');
  const [mandatory, setMandatory] = useState(false);
  const [editingId, setEditingId] = useState(null); 

  const [notifFilter, setNotifFilter] = useState('All');
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);


  const { getAccessTokenSilently } = useAuth0();

  useEffect(() => {
  if (activeTab === 'audit') {
    fetchAuditLogs();
  }

  if (
    activeTab === 'purposes' ||
    activeTab === 'users' ||
    activeTab === 'notifications' ||
    activeTab === 'companies' 
   // activeTab === 'consent'
  ) {
    fetchConfigData();
  }
}, [activeTab]);

  const fetchAuditLogs = async () => {
    setIsLoading(true);

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      const res = await api.get('/admin/logs');
      const sortedLogs = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAuditLogs(sortedLogs);
    } catch (err) {
      toast.error('Failed to load audit logs');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConfigData = async () => {
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      // FIXED: Now fetching Purposes, Users, AND Notifications in one go!
      const [purposeRes, userRes, notifRes] = await Promise.all([
        api.get('/admin/purposes'),
        api.get('/admin/users'),
        api.get('/admin/notifications') 
      ]);
      setPurposes(purposeRes.data);
      setUsers(userRes.data);
      setNotifications(notifRes.data);
    } catch (err) {
      toast.error("Failed to load configuration data.");
    }
  };

  // --- PURPOSE CRUD LOGIC ---
  const handleEditClick = (purpose) => {
  setEditingId(purpose.id);
  setNewPurposeName(purpose.name);
  setNewPurposeDesc(purpose.description);
  setMandatory(purpose.mandatory || false);
};

  const handleCancelEdit = () => {
  setEditingId(null);
  setNewPurposeName('');
  setNewPurposeDesc('');
  setMandatory(false);
};

  const handleSavePurpose = async (e) => {
    e.preventDefault();
    if (!newPurposeName) return;
    
    try {
      const api = await getSecureClient(getAccessTokenSilently);
      
      if (editingId) {
        await api.put(`/admin/purposes/${editingId}`, {
          name: newPurposeName,
          description: newPurposeDesc,
          mandatory: mandatory
        });
        toast.success("Purpose Successfully Updated!");
      } else {
        await api.post('/admin/purposes', {
            name: newPurposeName,
            description: newPurposeDesc,
            mandatory: mandatory
          });
        toast.success("New Purpose Created!");
      }
      
      handleCancelEdit(); 
      fetchConfigData();  
    } catch (err) {
      toast.error(editingId ? "Failed to update purpose." : "Failed to create purpose.");
    }
  };

  const handleDeletePurpose = async (id) => {
    if (!window.confirm(`Are you sure you want to retire Purpose #${id}? This will legally revoke all associated user consents.`)) return;

    try {
      const api = await getSecureClient(getAccessTokenSilently);
      await api.delete(`/admin/purposes/${id}`);
      toast.success(`Purpose #${id} retired & consents revoked!`);
      fetchConfigData(); 
    } catch (err) {
      toast.error("Failed to delete purpose.");
    }
  };

  // --- USER MANAGEMENT LOGIC ---
  const handleViewUserLogs = (userId) => {
    setSearchTerm(userId); 
    setActiveTab('audit'); 
  };

  // --- FILTER LOGIC ---
  const filteredNotifs = notifFilter === 'All' 
    ? notifications 
    : notifications.filter(n => n.status === notifFilter.toUpperCase()); // Match Java Enum casing

  const filteredLogs = auditLogs.filter(log => 
    (log.userId && log.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.tenantId && log.tenantId.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.actionType && log.actionType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">
          Platform Administration
        </h2>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6 flex-wrap">

        <button
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'audit'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('audit')}
        >
          Audit Logs
        </button>

        <button
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'purposes'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setActiveTab('purposes');
            setConfigView('purposes');
          }}
        >
          Purpose Management
        </button>

        <button
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setActiveTab('users');
            setConfigView('users');
          }}
        >
          User Management
        </button>

       <button
        className={`px-6 py-3 font-medium text-sm ${
          activeTab === 'notifications'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        onClick={() => {
          setActiveTab('notifications');
          setConfigView('notifications');
        }}
      >
        Notification Status
      </button>
        <button
          className={`px-6 py-3 font-medium text-sm ${
            activeTab === 'companies'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => {
            setActiveTab('companies');
            setConfigView('companies');
          }}
        >
          Company Management
        </button>


      </div>

      {/* --- TAB 1: AUDIT LOGS --- */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-bold text-slate-800">Immutable Audit Ledger</h3>
              <button onClick={fetchAuditLogs} className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition border border-blue-200">
                ↻ Refresh Logs
              </button>
            </div>
            <div>
              <input type="text" placeholder="Search logs..." className="w-64 p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-700 border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold rounded-tl-lg">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">User ID</th>
                  <th className="py-3 px-4 font-semibold">Tenant</th>
                  <th className="py-3 px-4 font-semibold">Details</th>
                  <th className="py-3 px-4 font-semibold">Source IP</th>
                  <th className="py-3 px-4 font-semibold rounded-tr-lg">SHA-256 Hash</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8 text-gray-500"
                    >
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="text-center py-8 text-gray-500"
                    >
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b hover:bg-gray-50 text-xs font-mono text-gray-600"
                    >
                      {/* 1. Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      {/* 2. Action (With restored color formatting and EXPIRED badge) */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded font-bold font-sans ${
                          log.actionType === 'GRANT' ? 'bg-green-100 text-green-800' : 
                          log.actionType === 'WITHDRAW' ? 'bg-red-100 text-red-800' : 
                          log.actionType === 'VALIDATE' ? 'bg-blue-100 text-blue-800' : 
                          log.actionType === 'EXPIRED' ? 'bg-amber-100 text-amber-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.actionType}
                        </span>
                      </td>

                      {/* 3. User ID */}
                      <td className="py-3 px-4 truncate max-w-[120px]" title={log.userId}>
                        {log.userId}
                      </td>

                      {/* 4. Tenant */}
                      <td className="py-3 px-4 font-sans font-medium text-slate-800">
                        {log.tenantId}
                      </td>

                      {/* 5. Details (Hardcoded to N/A since your Java backend doesn't have this field) */}
                      <td className="py-3 px-4">
                        N/A
                      </td>

                      {/* 6. Source IP */}
                      <td className="py-3 px-4">
                        {log.sourceIp || 'N/A'}
                      </td>

                      {/* 7. SHA-256 Hash */}
                      <td className="py-3 px-4 text-gray-400 truncate max-w-[120px]" title={log.cryptographicHash}>
                        {log.cryptographicHash ? `${log.cryptographicHash.substring(0, 16)}...` : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

        </div>
      )}

      {/* --- TAB 2: SYSTEM CONFIGURATION --- */}
      {activeTab !== 'audit' && (
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6 min-h-[500px]">
          
          {configView === 'hub' && (
            <div className="animate-fade-in">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Platform Contribution Modules</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div onClick={() => setConfigView('purposes')} className="p-6 border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition cursor-pointer group bg-slate-50">
                  <div className="bg-white w-12 h-12 rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><span className="text-2xl">📋</span></div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">Manage Consent Purposes</h4>
                  <p className="text-sm text-gray-500">Manage data processing categories across all fiduciary tenants.</p>
                </div>
                <div onClick={() => setConfigView('users')} className="p-6 border border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition cursor-pointer group bg-slate-50">
                  <div className="bg-white w-12 h-12 rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><span className="text-2xl">👥</span></div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">Manage Users</h4>
                  <p className="text-sm text-gray-500">View unique active users currently interacting with the platform.</p>
                </div>
                <div onClick={() => setConfigView('notifications')} className="p-6 border border-gray-200 rounded-xl hover:border-amber-500 hover:shadow-lg transition cursor-pointer group bg-slate-50">
                  <div className="bg-white w-12 h-12 rounded-lg shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><span className="text-2xl">📨</span></div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">Monitor Notifications</h4>
                  <p className="text-sm text-gray-500">Real-time status of outgoing compliance emails via SMTP.</p>
                </div>
              </div>
            </div>
          )}

          {/* SPOKE 1: MANAGE PURPOSES */}
          {configView === 'purposes' && (
            <div className="animate-fade-in">
              <button onClick={() => { setConfigView('hub'); handleCancelEdit(); }} className="text-sm font-medium text-blue-600 hover:underline mb-4 flex items-center">← Back to Modules</button>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Manage Consent Purposes</h3>
              <p className="text-gray-500 mb-6 text-sm">Create, update, or remove legal data processing categories.</p>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className={`col-span-1 p-5 rounded-xl border h-fit transition-colors ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-gray-200'}`}>
                  <h4 className="font-bold text-slate-800 mb-4">{editingId ? `Update Purpose #${editingId}` : 'Add New Purpose'}</h4>
                  
                  <form onSubmit={handleSavePurpose}>
                    <input required type="text" placeholder="Name (e.g. AI Training)" className="w-full p-2.5 text-sm border border-gray-300 rounded mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newPurposeName} onChange={e => setNewPurposeName(e.target.value)} />
                    <textarea placeholder="Description..." className="w-full p-2.5 text-sm border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none h-24" value={newPurposeDesc} onChange={e => setNewPurposeDesc(e.target.value)}></textarea>
                   <div className="mb-4 flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mandatory"
                        checked={mandatory}
                        onChange={(e) => setMandatory(e.target.checked)}
                      />
                      <label htmlFor="mandatory" className="text-sm font-medium">
                        Mandatory Purpose
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className={`flex-1 text-white text-sm font-bold py-2.5 rounded transition shadow-sm ${editingId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {editingId ? 'Save Changes' : 'Create Purpose'}
                      </button>
                      {editingId && (
                        <button type="button" onClick={handleCancelEdit} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded hover:bg-gray-50 transition">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
                <div className="col-span-2">
                  <div className="overflow-y-auto max-h-[400px] border rounded-lg bg-white shadow-sm">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-100 text-slate-700 sticky top-0">
                        <tr>
                          <th className="p-3 font-semibold">ID</th>
                          <th className="p-3 font-semibold">Name</th>
                          <th className="p-3 font-semibold">Description</th>
                          <th className="p-3 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purposes.map(p => (
                          <tr key={p.id} className={`border-b last:border-0 transition-colors ${editingId === p.id ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                            <td className="p-3 text-gray-500">#{p.id}</td>
                            <td className="p-3 font-bold text-slate-800">{p.name}</td>
                            <td className="p-3 text-gray-600 text-xs leading-relaxed max-w-[200px]">{p.description}</td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <button onClick={() => handleEditClick(p)} className="text-blue-600 hover:text-blue-800 mr-4 text-xs font-bold transition">Edit</button>
                              <button onClick={() => handleDeletePurpose(p.id)} className="text-red-600 hover:text-red-800 text-xs font-bold transition">Retire</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SPOKE 2: MANAGE USERS */}
          {configView === 'users' && (
            <div className="animate-fade-in relative">
              <button onClick={() => setConfigView('hub')} className="text-sm font-medium text-blue-600 hover:underline mb-4 flex items-center">← Back to Modules</button>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-1">Data Principal Directory</h3>
                  <p className="text-gray-500 text-sm">Comprehensive list of users authenticated via Auth0.</p>
                </div>
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm">Total Active Users: {users.length}</div>
              </div>
              
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-3 font-semibold">User Identifier (Auth0 Sub)</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Details</th>
                      <th className="p-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan="4" className="p-6 text-center text-gray-500">No active users found.</td></tr>
                    ) : (
                      users.map((userId, index) => (
                        <tr key={index} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="p-3 font-mono text-xs text-slate-600">{userId}</td>
                          <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">Active</span></td>
                          <td className="p-3">
                            <button onClick={() => setSelectedUserDetails(userId)} className="text-indigo-600 hover:text-indigo-800 hover:underline text-xs font-semibold flex items-center gap-1">
                              <span>👤</span> View Profile
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleViewUserLogs(userId)} className="text-blue-600 hover:underline text-xs font-semibold">View Logs</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* USER PROFILE MODAL */}
              {selectedUserDetails && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span>👤</span> Data Principal Profile
                      </h3>
                      <button onClick={() => setSelectedUserDetails(null)} className="text-gray-400 hover:text-red-500 text-2xl transition">&times;</button>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">System Identifier (Auth0)</label>
                        <p className="font-mono text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-gray-200 mt-1 break-all">
                          {selectedUserDetails}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Email (Mocked)</label>
                        <p className="font-medium text-sm text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-gray-200 mt-1 flex items-center gap-2">
                          <span>📧</span> 
                          {selectedUserDetails.includes('|') 
                            ? `${selectedUserDetails.split('|')[1].substring(0,8)}...` 
                            : `user_${selectedUserDetails.substring(0,5)}`}@gmail.com
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                          <label className="text-xs font-bold text-green-700 uppercase">Account Status</label>
                          <p className="mt-1 flex items-center gap-1 text-sm font-bold text-green-800">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> Verified
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <label className="text-xs font-bold text-blue-700 uppercase">Data Region</label>
                          <p className="mt-1 text-sm font-bold text-blue-800">ap-south-1 (IN)</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-4 border-t flex justify-end">
                      <button onClick={() => setSelectedUserDetails(null)} className="px-5 py-2.5 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 transition shadow-sm">
                        Close Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SPOKE 3: MONITOR NOTIFICATIONS */}
          {configView === 'notifications' && (
            <div className="animate-fade-in">
              <button onClick={() => setConfigView('hub')} className="text-sm font-medium text-blue-600 hover:underline mb-4 flex items-center">← Back to Modules</button>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Notification Telemetry</h3>
              <p className="text-gray-500 mb-6 text-sm">Monitor consent receipt delivery across the platform.</p>
              
              <div className="flex space-x-2 mb-6">
                {['All', 'Sent', 'Pending', 'Failed'].map(status => (
                  <button key={status} onClick={() => setNotifFilter(status)} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${notifFilter === status ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {status}
                  </button>
                ))}
              </div>
              
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-3 font-semibold">Message ID</th>
                      <th className="p-3 font-semibold">Recipient</th>
                      <th className="p-3 font-semibold">Timestamp</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold">Diagnostics / Error Logs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotifs.length === 0 ? (
                      <tr><td colSpan="5" className="p-6 text-center text-gray-500">No notifications found.</td></tr>
                    ) : (
                      filteredNotifs.map(n => (
                        <tr key={n.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="p-3 font-mono text-xs text-gray-500">{n.messageId}</td>
                          <td className="p-3 text-slate-700 font-medium">{n.recipient}</td>
                          <td className="p-3 text-gray-500 text-xs">{new Date(n.timestamp).toLocaleString()}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              n.status === 'SENT' ? 'bg-green-100 text-green-800' : 
                              n.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {n.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs font-mono">
                            {n.errorLog ? <span className="text-red-600">{n.errorLog}</span> : <span className="text-green-600">250 OK Message accepted</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {/* COMPANY MANAGEMENT */}
              {configView === 'companies' && (
                <div className="animate-fade-in">
                  <button
                    onClick={() => setConfigView('hub')}
                    className="text-sm font-medium text-blue-600 hover:underline mb-4 flex items-center"
                  >
                    ← Back to Modules
                  </button>

                  <CompanyManagement />
                </div>
              )}
              
        </div>
      )}
    </div>
  );
}