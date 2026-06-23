import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getSecureClient } from '../../../api';
import toast from 'react-hot-toast';

export default function AnalyticsOverview() {
  const { getAccessTokenSilently } = useAuth0();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- REAL BACKEND CONNECTION ---
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const api = await getSecureClient(getAccessTokenSilently);
        const res = await api.get('/fiduciary/analytics');
        setMetrics(res.data);
      } catch (error) {
        toast.error("Failed to load live analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [getAccessTokenSilently]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400 animate-in fade-in duration-500">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium tracking-wide">Syncing with Immutable Ledger...</p>
      </div>
    );
  }

  if (!metrics) return null;

  // Safe fallback math to prevent Divide-By-Zero errors on new accounts
  const total = metrics.totalConsents || 1; 
  const activePct = Math.round((metrics.activeConsents / total) * 100);
  const withdrawnPct = Math.round((metrics.withdrawnConsents / total) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Command Center</h2>
          <p className="text-sm text-slate-500 mt-1">Live telemetry of your organization's data privacy posture.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">System Live</span>
        </div>
      </div>

      {/* TOP ROW: Asymmetric KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* HERO METRIC: Compliance Score (Spans 2 columns) */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/20 blur-3xl rounded-full group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
          
          <p className="text-sm font-medium text-slate-300 mb-2 relative z-10">Global Compliance Score</p>
          <div className="relative z-10 flex items-baseline gap-2">
            <h3 className="text-6xl font-black text-white tracking-tighter">{metrics.complianceHealth}</h3>
            <span className="text-2xl text-slate-400 font-bold">%</span>
          </div>
          <p className="text-xs text-indigo-300 font-medium mt-4 relative z-10 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            Retention rate across {(metrics.totalConsents || 0).toLocaleString()} historical data points
          </p>
        </div>

        {/* Secondary Metric: Active */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <span className="text-emerald-600 text-xl">✓</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{(metrics.activeConsents || 0).toLocaleString()}</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Active Consents</p>
          </div>
        </div>

        {/* Secondary Metric: Revoked */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center mb-4">
            <span className="text-rose-600 text-xl">✕</span>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-800">{(metrics.withdrawnConsents || 0).toLocaleString()}</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">Legally Revoked</p>
          </div>
        </div>

      </div>

      {/* BOTTOM ROW: Deep Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Center: Horizontal Distribution List */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-slate-900">Active Data by Purpose</h3>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">{metrics.purposeBreakdown?.length || 0} Purposes</span>
          </div>
          
          <div className="space-y-6">
            {(!metrics.purposeBreakdown || metrics.purposeBreakdown.length === 0) ? (
              <p className="text-sm text-slate-500 italic text-center py-4">No active data streams detected.</p>
            ) : (
              metrics.purposeBreakdown.map((purpose, index) => {
                // Calculate percentage based on total unique users, avoiding divide by zero
                const pct = metrics.totalUsers > 0 
                  ? Math.round((purpose.activeCount / metrics.totalUsers) * 100) 
                  : 0;
                
                return (
                  <div key={index} className="group">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-slate-700">{purpose.name}</span>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">{purpose.activeCount.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">users ({pct}%)</span>
                      </div>
                    </div>
                    {/* Sleek Horizontal Gauge */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:bg-indigo-400" 
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Quick Audit Log / Status Widget */}
        <div className="bg-slate-900 rounded-3xl shadow-sm p-8 flex flex-col justify-between text-white relative overflow-hidden">
           {/* Decorative background lines */}
           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
           
           <div className="relative z-10">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
               <span>Shield Protocol</span>
               <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-500/30">Active</span>
             </h3>
             
             <div className="space-y-4">
               {/* 1. Total Users */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                 <p className="text-xs text-slate-400 font-medium mb-1">Total Users</p>
                 <p className="text-2xl font-black text-white">{(metrics.totalUsers || 0).toLocaleString()}</p>
               </div>

               {/* 2. Total Authorized Workers */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                 <p className="text-xs text-slate-400 font-medium mb-1">Total Authorized Workers</p>
                 <p className="text-2xl font-black text-white">{metrics.totalWorkers || 0}</p>
               </div>
               
               {/* 3. Platform Architecture */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
                 <p className="text-xs text-slate-400 font-medium mb-1">Platform Architecture</p>
                 <p className="text-sm font-bold text-emerald-400">Multi-Tenant Isolated</p>
               </div>
             </div>
           </div>
           
           <div className="mt-8 relative z-10">
             <button 
               onClick={async () => {
                 try {
                   const api = await getSecureClient(getAccessTokenSilently);
                   const res = await api.get('/fiduciary/consent/export', { responseType: 'blob' });
                   const url = window.URL.createObjectURL(new Blob([res.data]));
                   const link = document.createElement('a');
                   link.href = url;
                   link.setAttribute('download', 'audit_report.csv');
                   document.body.appendChild(link);
                   link.click();
                 } catch (err) {
                   toast.error("Failed to export audit report.");
                 }
               }}
               className="w-full bg-white text-slate-900 text-sm font-bold py-3 rounded-xl hover:bg-slate-100 transition shadow-lg"
             >
               Export Audit Report
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}