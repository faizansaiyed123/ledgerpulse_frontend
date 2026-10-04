import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Receipt,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronRight,
  Download,
  CreditCard,
  Building,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { formatCurrency } from '../../lib/currency.ts';
import { Invoice, Expense } from '../../types/index.ts';
import { downloadInvoicePDF } from '../../lib/pdf.ts';

interface DashboardProps {
  onOpenNewInvoice: () => void;
  onOpenNewExpense: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onNavigateTab: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenNewInvoice,
  onOpenNewExpense,
  onViewInvoice,
  onRecordPayment,
  onNavigateTab,
}) => {
  const { currentOrg, invoices, expenses, customers, activityLogs, financialSummary } = useOrg();
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'quarter' | 'year'>('all');

  const currency = currentOrg?.currency || 'USD';

  // Filtered invoices and expenses according to selected date range
  const filteredData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const matchesFilter = (dateStr: string) => {
      if (dateFilter === 'all') return true;
      const d = new Date(dateStr);
      if (dateFilter === 'this_month') {
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      }
      if (dateFilter === 'last_month') {
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const year = currentMonth === 0 ? currentYear - 1 : currentYear;
        return d.getFullYear() === year && d.getMonth() === lastMonth;
      }
      if (dateFilter === 'year') {
        return d.getFullYear() === currentYear;
      }
      if (dateFilter === 'quarter') {
        const currentQuarter = Math.floor(currentMonth / 3);
        const itemQuarter = Math.floor(d.getMonth() / 3);
        return d.getFullYear() === currentYear && currentQuarter === itemQuarter;
      }
      return true;
    };

    const invs = invoices.filter((i) => matchesFilter(i.issueDate));
    const exps = expenses.filter((e) => matchesFilter(e.expenseDate));

    const totalInvoiced = invs.reduce((sum, i) => (i.status !== 'cancelled' ? sum + i.totalAmount : sum), 0);
    const totalCollected = invs.reduce((sum, i) => (i.status !== 'cancelled' ? sum + (i.paidAmount || 0) : sum), 0);
    const totalOutstanding = invs.reduce((sum, i) => (i.status !== 'cancelled' ? sum + (i.balanceDue || 0) : sum), 0);
    const totalExp = exps.reduce((sum, e) => (e.status !== 'rejected' ? sum + e.amount : sum), 0);
    const netIncome = totalCollected - totalExp;

    return {
      invoices: invs,
      expenses: exps,
      totalInvoiced,
      totalCollected,
      totalOutstanding,
      totalExp,
      netIncome,
    };
  }, [invoices, expenses, dateFilter]);

  // Upcoming due dates (invoices due in next 14 days)
  const upcomingDueInvoices = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const next14Days = new Date();
    next14Days.setDate(next14Days.getDate() + 14);
    const limitDate = next14Days.toISOString().split('T')[0];

    return invoices
      .filter((i) => i.balanceDue > 0 && i.status !== 'cancelled' && i.dueDate >= today && i.dueDate <= limitDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 4);
  }, [invoices]);

  // Recent Invoices
  const recentInvoices = useMemo(() => {
    return [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [invoices]);

  // Recent Expenses
  const recentExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Top Banner and Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Executive Financial Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cashflow, billing health, and expense ledger for <span className="font-semibold text-slate-800">{currentOrg?.name}</span>
          </p>
        </div>

        {/* Date Filter selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${dateFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${dateFilter === 'this_month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter('last_month')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${dateFilter === 'last_month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDateFilter('quarter')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${dateFilter === 'quarter' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Quarter
            </button>
            <button
              onClick={() => setDateFilter('year')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${dateFilter === 'year' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Invoiced</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(filteredData.totalInvoiced, currency)}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-slate-700">{filteredData.invoices.length} invoices generated</span>
          </div>
        </div>

        {/* Collected Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Collected Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-3">
            {formatCurrency(filteredData.totalCollected, currency)}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>
              {filteredData.totalInvoiced > 0
                ? `${Math.round((filteredData.totalCollected / filteredData.totalInvoiced) * 100)}% realization rate`
                : 'No invoices yet'}
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatCurrency(filteredData.totalExp, currency)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span>{filteredData.expenses.length} expense items recorded</span>
          </div>
        </div>

        {/* Net Operating Income */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Net Operating Income</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${filteredData.netIncome >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-3 ${filteredData.netIncome >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
            {formatCurrency(filteredData.netIncome, currency)}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span>Revenue - Operating Expenses</span>
          </div>
        </div>
      </div>

      {/* Secondary Financial Alerts Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outstanding Receivables Alert */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-4 rounded-2xl border border-blue-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-900">Outstanding Receivables</p>
              <p className="text-lg font-bold text-blue-950 mt-0.5">
                {formatCurrency(filteredData.totalOutstanding, currency)}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('invoices')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm transition-colors"
          >
            Review Invoices →
          </button>
        </div>

        {/* Overdue Alerts */}
        <div className="bg-gradient-to-r from-rose-50 to-orange-50/60 p-4 rounded-2xl border border-rose-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-900">Overdue Invoices</p>
              <p className="text-lg font-bold text-rose-950 mt-0.5">
                {formatCurrency(financialSummary.totalOverdue, currency)} ({financialSummary.overdueInvoiceCount})
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('invoices')}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 bg-white px-3 py-1.5 rounded-lg border border-rose-200 shadow-sm transition-colors"
          >
            Send Reminders →
          </button>
        </div>
      </div>

      {/* Main Grid: Recent Invoices & Upcoming Due / Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Invoices Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Invoices</h3>
              <p className="text-xs text-slate-500">Latest client billing activity</p>
            </div>
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-2 font-semibold">Invoice #</th>
                  <th className="pb-2 font-semibold">Customer</th>
                  <th className="pb-2 font-semibold">Due Date</th>
                  <th className="pb-2 font-semibold">Total</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No invoices recorded yet.{' '}
                      <button onClick={onOpenNewInvoice} className="text-blue-600 underline font-medium">
                        Create your first invoice
                      </button>
                    </td>
                  </tr>
                ) : (
                  recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                      <td className="py-3 font-medium text-slate-700">{inv.customerName}</td>
                      <td className="py-3 text-slate-500">{inv.dueDate}</td>
                      <td className="py-3 font-semibold text-slate-900">{formatCurrency(inv.totalAmount, inv.currency)}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : inv.status === 'partially_paid'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                            title="View Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {inv.balanceDue > 0 && (
                            <button
                              onClick={() => onRecordPayment(inv)}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] transition-colors"
                            >
                              Record Payment
                            </button>
                          )}
                          <button
                            onClick={() => currentOrg && downloadInvoicePDF(inv, currentOrg)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Col: Upcoming Invoices & Recent Expenses */}
        <div className="space-y-6">
          {/* Upcoming Due Invoices */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Upcoming Due Invoices</h3>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>

            {upcomingDueInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No invoices due in the next 14 days</p>
            ) : (
              <div className="space-y-2">
                {upcomingDueInvoices.map((inv) => (
                  <div key={inv.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{inv.customerName}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{inv.invoiceNumber} • Due {inv.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(inv.balanceDue, inv.currency)}</p>
                      <button
                        onClick={() => onRecordPayment(inv)}
                        className="text-[10px] text-emerald-600 hover:underline font-semibold"
                      >
                        Collect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Expenses Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Recent Expenses</h3>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                All
              </button>
            </div>

            <div className="space-y-2">
              {recentExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No expenses logged yet</p>
              ) : (
                recentExpenses.map((exp) => (
                  <div key={exp.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between">
                    <div className="truncate pr-2">
                      <p className="font-semibold text-slate-800 truncate">{exp.description}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{exp.category} • {exp.expenseDate}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-slate-900">{formatCurrency(exp.amount, exp.currency)}</p>
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                          exp.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : exp.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {exp.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
