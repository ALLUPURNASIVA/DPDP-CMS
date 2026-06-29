import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getSecureClient } from '../../../api';
import { useAuth0 } from '@auth0/auth0-react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

export default function AnalyticsOverview() {
  const { getAccessTokenSilently } = useAuth0();
  const [data, setData] = useState({ 
    purposeDistribution: [], 
    activityComparison: [],
    purposeAccessStats: [],
    totalUsers: 0,
    totalWorkers: 0,
    activeConsents: 0,
    pendingQueries: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const api = await getSecureClient(getAccessTokenSilently);
        const res = await api.get('/fiduciary/analytics'); 
        setData(res.data);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  const totalConsents = data.activeConsents + data.withdrawnConsents;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-xl font-semibold text-slate-900 mb-6">Executive Overview</h1>

      {/* KPI Cards: Reduced height with p-4 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Users" value={data.totalUsers} />
        <StatCard title="Active Workers" value={data.totalWorkers} />
        <StatCard title="Active Consents" value={data.activeConsents} color="text-emerald-600" />
        <StatCard title="Pending Queries" value={data.pendingQueries} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* PIE CHART */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Consent Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[{ name: 'Active', value: data.activeConsents }, { name: 'Withdrawn', value: data.withdrawnConsents }]} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                <Cell fill="#10b981" /><Cell fill="#ef4444" />
              </Pie>
              <Tooltip 
                formatter={(value) => {
                  if (totalConsents === 0) return ['0%', ''];
                  const percentage = ((value / totalConsents) * 100).toFixed(1); // Gives 1 decimal place, e.g., 85.5%
                  return [`${percentage}%`];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* SWAPPED POSITION: Purpose Access Penetration (Horizontal Bars) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Purpose Access Penetration</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart layout="vertical" data={data?.purposeAccessStats || []} margin={{ left: 20 }}>
              <XAxis type="number" domain={[0, 100]} unit="%" fontSize={10} tickLine={false} />
              <YAxis dataKey="name" type="category" width={100} fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip formatter={(val) => `${val}%`} />
              <Bar dataKey="percentage" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SWAPPED POSITION: Audit vs. Compliance (Full Width Row) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Consent Activity (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data?.activityComparison || []}>
            <XAxis dataKey="day" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} />
            <Legend />
            {/* Blue for Granted, Red for Withdrawn */}
            <Bar dataKey="granted" name="Access Given" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="withdrawn" name="Withdrawn" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-slate-900" }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
      <div className={`text-2xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}