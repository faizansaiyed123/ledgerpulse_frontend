import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Building,
  CheckCircle,
  Database,
  DollarSign,
  FileText,
  RefreshCw,
  Server,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { api, ApiError } from '../../lib/api.ts';
import { formatCurrency } from '../../lib/currency.ts';

type AdminOverview = Awaited<ReturnType<typeof api.getAdminOverview>>;
type HealthDetails = Awaited<ReturnType<typeof api.getHealthDetails>>;

export const AdminPortal: React.FC = () => {
  const { currentOrg, isPlatformAdmin } = useOrg();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [health, setHealth] = useState<HealthDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    if (!isPlatformAdmin) return;
    setLoading(true);
    setError('');
    try {
      const [nextOverview, nextHealth] = await Promise.all([api.getAdminOverview(), api.getHealthDetails()]);
      setOverview(nextOverview);
      setHealth(nextHealth);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to load platform administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [isPlatformAdmin]);

  const totals = useMemo(() => {
    if (!overview) return { invoices: 0, payments: 0, expenses: 0 };
    return {
      invoices: overview.counts.invoices || 0,
      payments: overview.counts.payments || 0,
      expenses: overview.counts.expenses || 0,
    };
  }, [overview]);

  if (!isPlatformAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Platform Admin Console
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {loading ? 'Loading platform health…' : health?.connected ? 'Database healthy' : 'Database unavailable'}
            </span>
          </div>
          <h2 className="text-xl font-bold mt-1">Platform Operations &amp; Multi-Tenant Control</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Platform-wide tenant metrics, persistence health, and operational visibility.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 text-xs font-semibold flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          ['Organizations', overview?.counts.organizations || 0, Building],
          ['Active Members', overview?.counts.activeMembers || 0, Users],
          ['Customers', overview?.counts.customers || 0, Users],
          ['Invoices', totals.invoices, FileText],
          ['Payments', totals.payments, DollarSign],
        ].map(([label, value, Icon]) => (
          <div key={String(label)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>{label}</span>
              <Icon className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          Infrastructure Health
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">PostgreSQL</span>
              {health?.connected ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
            </div>
            <p className="text-slate-500 mt-1">{health?.connected ? 'Connected' : 'Unavailable'}</p>
            {health?.postgres_version && <p className="text-[10px] text-slate-400 font-mono mt-1 truncate">{health.postgres_version}</p>}
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">API Service</span>
              {health?.status === 'healthy' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />}
            </div>
            <p className="text-slate-500 mt-1">Status: {health?.status || 'unknown'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">Authorization</span>
              <Shield className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-slate-500 mt-1">Firebase token verification + server-side RBAC</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Tenant Workspaces Directory</h3>
            <p className="text-xs text-slate-500">All organizations visible to the platform administrator.</p>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            {overview?.counts.expenses || 0} expenses
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Workspace</th>
                <th className="py-3 px-4 font-semibold">ID</th>
                <th className="py-3 px-4 font-semibold">Currency</th>
                <th className="py-3 px-4 font-semibold">Members</th>
                <th className="py-3 px-4 font-semibold">Invoices</th>
                <th className="py-3 px-4 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(overview?.organizations || []).map((org) => (
                <tr key={org.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-blue-600" />
                    <span>{org.name}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">{org.id}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{org.currency}</td>
                  <td className="py-3.5 px-4">{org.activeMemberCount}</td>
                  <td className="py-3.5 px-4">{org.invoiceCount}</td>
                  <td className="py-3.5 px-4 text-slate-500">{org.createdAt ? org.createdAt.split('T')[0] : '—'}</td>
                </tr>
              ))}
              {!loading && overview?.organizations.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-400">No organizations found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {currentOrg && (
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          Current operator workspace: {currentOrg.name} ({currentOrg.currency})
        </div>
      )}
    </div>
  );
};
