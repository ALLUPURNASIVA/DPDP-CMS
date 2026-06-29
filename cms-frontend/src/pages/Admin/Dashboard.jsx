import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

function MetricCard({ label, value, icon, colorClass, bgClass, onClick, hint }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full ${bgClass} opacity-40 group-hover:scale-150 transition-transform duration-700 ease-out z-0`} />
      <div className="flex items-center gap-5 relative z-10">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ring-1 shadow-sm ${bgClass} ${colorClass}`}>
          <div className="scale-125">{icon}</div>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
          <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</h3>
          {hint && <p className="text-xs text-gray-400 mt-0.5 font-medium">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ActionBadge({ type }) {
  const styles = {
    GRANT: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    WITHDRAW: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    VALIDATE: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${styles[type] || 'bg-gray-100 text-gray-700 ring-gray-600/20'}`}>
      {type}
    </span>
  );
}

export default function Dashboard({ auditLogs = [], users = [], notifications = [], companies = [], onNavigate }) {
  const companyRegistrationData = useMemo(() => {
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const label = d.toLocaleDateString(undefined, { weekday: 'short' });
      const dateStr = d.toISOString().slice(0, 10);

      const count = companies.filter(company =>
        company.createdAt && company.createdAt.slice(0, 10) === dateStr
      ).length;

      days.push({ name: label, companies: count });
    }

    return days;
  }, [companies]);

  const notifStats = useMemo(() => {
    const counts = { SENT: 0, PENDING: 0, FAILED: 0 };
    notifications.forEach(n => {
      if (counts[n.status] !== undefined) counts[n.status]++;
    });
    return counts;
  }, [notifications]);

  const deliveryRate = notifications.length
    ? Math.round((notifStats.SENT / notifications.length) * 100)
    : null;

  const todayCompanyCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return companies.filter(company =>
      company.createdAt && company.createdAt.slice(0, 10) === today
    ).length;
  }, [companies]);

  const expiringCount = useMemo(() => auditLogs.filter(log => {
    if (!log.expiryDate) return false;
    const diff = Math.ceil((new Date(log.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff >= 0 && diff <= 30;
  }).length, [auditLogs]);

  const expiredCount = useMemo(() => auditLogs.filter(log => {
    if (!log.expiryDate) return false;
    return new Date(log.expiryDate) < new Date();
  }).length, [auditLogs]);

  const recentLogs = auditLogs.slice(0, 5);

  const AuditIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const BellIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );

  const BuildingIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );

  const WarnIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );

  const ArrowIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Platform Overview</h2>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Live snapshot of your DPDP consent platform.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          label="Total Audit Logs"
          value={auditLogs.length}
          icon={<AuditIcon />}
          colorClass="text-indigo-600"
          bgClass="bg-indigo-50 ring-indigo-100"
          onClick={() => onNavigate('audit')}
          hint="Click to explore ->"
        />

        <MetricCard
          label="Active Users"
          value={users.length}
          icon={<UsersIcon />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50 ring-emerald-100"
          onClick={() => onNavigate('users')}
          hint="Click to explore ->"
        />

        <MetricCard
          label="Companies"
          value={companies.length}
          icon={<BuildingIcon />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50 ring-violet-100"
          onClick={() => onNavigate('companies')}
          hint={`${todayCompanyCount} registered today`}
        />

        <MetricCard
          label="Failed Notifications"
          value={notifStats.FAILED}
          icon={<BellIcon />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50 ring-rose-100"
          onClick={() => onNavigate('notifications')}
          hint={notifications.length ? `${deliveryRate}% delivery rate` : 'No notifications yet'}
        />
      </div>

      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {expiredCount > 0 && (
            <div
              onClick={() => onNavigate('audit')}
              className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-red-50 border border-red-200 rounded-xl cursor-pointer hover:bg-red-100 transition-colors"
            >
              <span className="text-red-600"><WarnIcon /></span>
              <p className="text-sm font-bold text-red-800">
                {expiredCount} consent record{expiredCount > 1 ? 's have' : ' has'} expired - review in Audit Logs
              </p>
              <span className="ml-auto text-red-400"><ArrowIcon /></span>
            </div>
          )}

          {expiringCount > 0 && (
            <div
              onClick={() => onNavigate('audit')}
              className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors"
            >
              <span className="text-orange-500"><WarnIcon /></span>
              <p className="text-sm font-bold text-orange-800">
                {expiringCount} consent{expiringCount > 1 ? 's expire' : ' expires'} within 30 days
              </p>
              <span className="ml-auto text-orange-400"><ArrowIcon /></span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Section title="Company Registrations" subtitle="New companies onboarded over the last 7 days">
            <div className="p-6 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyRegistrationData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: 12 }}
                    cursor={{ fill: '#f9fafb' }}
                  />
                  <Bar dataKey="companies" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>

        <Section
          title="Notification Status"
          subtitle="Delivery breakdown"
          action={
            <button onClick={() => onNavigate('notifications')} className="text-xs font-bold text-indigo-600 hover:underline">
              View all
            </button>
          }
        >
          <div className="p-6 space-y-4">
            {notifStats.FAILED > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
                Failed means the platform tried to send an email, but SMTP rejected it or the recipient email was invalid. Open Notifications for exact diagnostics.
              </div>
            )}

            {[
              { label: 'Sent', count: notifStats.SENT, color: 'bg-emerald-500', track: 'bg-emerald-100' },
              { label: 'Pending', count: notifStats.PENDING, color: 'bg-amber-400', track: 'bg-amber-100' },
              { label: 'Failed', count: notifStats.FAILED, color: 'bg-rose-500', track: 'bg-rose-100' },
            ].map(({ label, count, color, track }) => {
              const pct = notifications.length ? Math.round((count / notifications.length) * 100) : 0;

              return (
                <div key={label}>
                  <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                    <span>{label}</span>
                    <span>{count} <span className="text-gray-400 font-medium">({pct}%)</span></span>
                  </div>
                  <div className={`w-full h-2 rounded-full ${track}`}>
                    <div className={`h-2 rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}

            {notifications.length === 0 && (
              <p className="text-sm text-gray-400 font-medium text-center py-4">No notifications yet.</p>
            )}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section
          title="Recent Audit Events"
          subtitle="Last 5 recorded actions"
          action={
            <button onClick={() => onNavigate('audit')} className="text-xs font-bold text-indigo-600 hover:underline">
              View all
            </button>
          }
        >
          {recentLogs.length === 0 ? (
            <p className="p-6 text-sm text-gray-400 font-medium text-center">No audit records yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentLogs.map(log => (
                <li key={log.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 mr-4">
                    <p className="text-sm font-bold text-gray-900 truncate">{log.userEmail || log.userId || '-'}</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {log.tenantId} - {log.purposeName || 'No purpose'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <ActionBadge type={log.actionType} />
                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section
          title="Onboarded Companies"
          subtitle={`${companies.length} active fiduciar${companies.length === 1 ? 'y' : 'ies'}`}
          action={
            <button onClick={() => onNavigate('companies')} className="text-xs font-bold text-indigo-600 hover:underline">
              Manage
            </button>
          }
        >
          {companies.length === 0 ? (
            <p className="p-6 text-sm text-gray-400 font-medium text-center">No companies onboarded yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {companies.map(company => (
                <li key={company.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold shrink-0">
                    {(company.name || company.id || 'C').charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{company.name}</p>
                    <p className="text-xs text-gray-400 font-medium">ID #{company.id}</p>
                  </div>
                  <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    Active
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
