import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Building,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { formatCurrency } from '../../lib/currency.ts';
import { exportToCSV } from '../../lib/pdf.ts';

type ReportType = 'pnl' | 'revenue_customer' | 'expense_category' | 'aging' | 'tax';

export const FinancialReports: React.FC = () => {
  const { currentOrg, invoices, expenses, customers, vendors } = useOrg();
  const [activeReport, setActiveReport] = useState<ReportType>('pnl');
  const [period, setPeriod] = useState<'all' | 'year' | 'quarter'>('all');

  const currency = currentOrg?.currency || 'USD';

  // Calculations for P&L
  const pnlData = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => (i.status !== 'cancelled' ? s + i.totalAmount : s), 0);
    const collectedRevenue = invoices.reduce((s, i) => (i.status !== 'cancelled' ? s + (i.paidAmount || 0) : s), 0);
    const totalExpenses = expenses.reduce((s, e) => (e.status !== 'rejected' ? s + e.amount : s), 0);
    const netIncome = collectedRevenue - totalExpenses;
    const profitMargin = collectedRevenue > 0 ? (netIncome / collectedRevenue) * 100 : 0;

    // Expense breakdown by category
    const categoryBreakdown: Record<string, number> = {};
    expenses.forEach((e) => {
      if (e.status !== 'rejected') {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      }
    });

    return {
      totalInvoiced,
      collectedRevenue,
      totalExpenses,
      netIncome,
      profitMargin,
      categoryBreakdown,
    };
  }, [invoices, expenses]);

  // Calculations for Customer Revenue
  const customerRevenue = useMemo(() => {
    return customers.map((c) => {
      const custInvoices = invoices.filter((i) => i.customerId === c.id && i.status !== 'cancelled');
      const invoiced = custInvoices.reduce((s, i) => s + i.totalAmount, 0);
      const paid = custInvoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
      const balance = custInvoices.reduce((s, i) => s + (i.balanceDue || 0), 0);
      return {
        id: c.id,
        name: c.name,
        company: c.company,
        invoiceCount: custInvoices.length,
        invoiced,
        paid,
        balance,
      };
    }).sort((a, b) => b.invoiced - a.invoiced);
  }, [customers, invoices]);

  // Calculations for Aging Receivables
  const agingData = useMemo(() => {
    const today = new Date();
    let current = 0;
    let days1To30 = 0;
    let days31To60 = 0;
    let days60Plus = 0;

    invoices.forEach((inv) => {
      if (inv.balanceDue > 0 && inv.status !== 'cancelled') {
        const dueDate = new Date(inv.dueDate);
        const diffDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        if (diffDays <= 0) {
          current += inv.balanceDue;
        } else if (diffDays <= 30) {
          days1To30 += inv.balanceDue;
        } else if (diffDays <= 60) {
          days31To60 += inv.balanceDue;
        } else {
          days60Plus += inv.balanceDue;
        }
      }
    });

    return {
      current,
      days1To30,
      days31To60,
      days60Plus,
      totalOutstanding: current + days1To30 + days31To60 + days60Plus,
    };
  }, [invoices]);

  // Calculations for Tax Report
  const taxData = useMemo(() => {
    const salesTaxCollected = invoices.reduce((s, i) => (i.status !== 'cancelled' ? s + (i.taxAmount || 0) : s), 0);
    const purchaseTaxPaid = expenses.reduce((s, e) => (e.status !== 'rejected' ? s + (e.taxAmount || 0) : s), 0);
    const netTaxLiability = salesTaxCollected - purchaseTaxPaid;
    return {
      salesTaxCollected,
      purchaseTaxPaid,
      netTaxLiability,
    };
  }, [invoices, expenses]);

  // Export current active report to CSV
  const handleExportCSV = () => {
    const orgName = currentOrg?.name || 'Workspace';
    const date = new Date().toISOString().split('T')[0];

    if (activeReport === 'pnl') {
      const rows = [
        ['Profit & Loss Statement for', orgName],
        ['Generated Date', date],
        ['Metric', 'Amount (' + currency + ')'],
        ['Total Invoiced', pnlData.totalInvoiced],
        ['Collected Cash Revenue', pnlData.collectedRevenue],
        ['Total Operating Expenses', pnlData.totalExpenses],
        ['Net Operating Income', pnlData.netIncome],
        ['Profit Margin %', pnlData.profitMargin.toFixed(1) + '%'],
        ['--- Category Expenses Breakdown ---', '---'],
        ...Object.entries(pnlData.categoryBreakdown).map(([cat, amt]) => [cat, amt]),
      ];
      exportToCSV(`PnL_Report_${orgName}_${date}.csv`, rows);
    } else if (activeReport === 'revenue_customer') {
      const headers = ['Customer', 'Company', 'Invoices Count', 'Invoiced Amount', 'Paid Amount', 'Outstanding Balance'];
      const rows = customerRevenue.map((c) => [c.name, c.company || '', c.invoiceCount, c.invoiced, c.paid, c.balance]);
      exportToCSV(`Customer_Revenue_${orgName}_${date}.csv`, [headers, ...rows]);
    } else if (activeReport === 'aging') {
      const rows = [
        ['Accounts Receivable Aging Report', orgName],
        ['Current (Not Due)', agingData.current],
        ['1 - 30 Days Overdue', agingData.days1To30],
        ['31 - 60 Days Overdue', agingData.days31To60],
        ['60+ Days Overdue', agingData.days60Plus],
        ['Total Receivables', agingData.totalOutstanding],
      ];
      exportToCSV(`Aging_Report_${orgName}_${date}.csv`, rows);
    } else if (activeReport === 'tax') {
      const rows = [
        ['Tax Summary Report', orgName],
        ['Sales Tax Collected (Invoices)', taxData.salesTaxCollected],
        ['Purchase Tax Paid (Expenses)', taxData.purchaseTaxPaid],
        ['Net Tax Liability', taxData.netTaxLiability],
      ];
      exportToCSV(`Tax_Report_${orgName}_${date}.csv`, rows);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner and Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Financial Reports &amp; Intelligence</h2>
          <p className="text-xs text-slate-500">Mathematical aggregations calculated from real invoice, payment, and expense ledgers</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Report to CSV</span>
        </button>
      </div>

      {/* Report Switcher Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-1 text-xs">
        <button
          onClick={() => setActiveReport('pnl')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-colors ${
            activeReport === 'pnl' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profit &amp; Loss (P&amp;L)
        </button>
        <button
          onClick={() => setActiveReport('revenue_customer')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-colors ${
            activeReport === 'revenue_customer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Revenue by Customer
        </button>
        <button
          onClick={() => setActiveReport('aging')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-colors ${
            activeReport === 'aging' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Receivables Aging
        </button>
        <button
          onClick={() => setActiveReport('tax')}
          className={`px-3.5 py-2 rounded-xl font-semibold transition-colors ${
            activeReport === 'tax' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tax Summary
        </button>
      </div>

      {/* P&L View */}
      {activeReport === 'pnl' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Collected Cash Revenue</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {formatCurrency(pnlData.collectedRevenue, currency)}
              </p>
              <p className="text-xs text-slate-400 mt-1">From settled customer payments</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operating Expenses</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {formatCurrency(pnlData.totalExpenses, currency)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Verified business receipts</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Profit / Margin</span>
              <p className={`text-2xl font-bold mt-1 ${pnlData.netIncome >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                {formatCurrency(pnlData.netIncome, currency)}
              </p>
              <p className="text-xs text-blue-600 font-semibold mt-1">
                {pnlData.profitMargin.toFixed(1)}% Net Margin
              </p>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">Expenses by Category</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3">Expense Category</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(pnlData.categoryBreakdown).map(([cat, amt]) => {
                    const pct = pnlData.totalExpenses > 0 ? (amt / pnlData.totalExpenses) * 100 : 0;
                    return (
                      <tr key={cat}>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 capitalize">{cat}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatCurrency(amt, currency)}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">{pct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Revenue View */}
      {activeReport === 'revenue_customer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">Customer</th>
                  <th className="py-3 px-4 font-semibold">Company</th>
                  <th className="py-3 px-4 font-semibold text-right">Invoices</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Invoiced</th>
                  <th className="py-3 px-4 font-semibold text-right">Total Paid</th>
                  <th className="py-3 px-4 font-semibold text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerRevenue.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{c.company || '—'}</td>
                    <td className="py-3.5 px-4 text-right text-slate-700">{c.invoiceCount}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatCurrency(c.invoiced, currency)}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">{formatCurrency(c.paid, currency)}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-600">{formatCurrency(c.balance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Accounts Receivable Aging View */}
      {activeReport === 'aging' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Current (Not Due)</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(agingData.current, currency)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">1 - 30 Days Overdue</span>
              <p className="text-xl font-bold text-amber-800 mt-1">{formatCurrency(agingData.days1To30, currency)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">31 - 60 Days Overdue</span>
              <p className="text-xl font-bold text-orange-800 mt-1">{formatCurrency(agingData.days31To60, currency)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">60+ Days Overdue</span>
              <p className="text-xl font-bold text-rose-800 mt-1">{formatCurrency(agingData.days60Plus, currency)}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500">Total Unpaid Accounts Receivable</span>
              <p className="text-2xl font-bold text-rose-600 mt-0.5">{formatCurrency(agingData.totalOutstanding, currency)}</p>
            </div>
            <span className="text-xs text-slate-400">Aging buckets calculated relative to invoice due dates</span>
          </div>
        </div>
      )}

      {/* Tax Report View */}
      {activeReport === 'tax' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-base text-slate-900">Tax Liability Summary</h3>
          <p className="text-xs text-slate-500">
            Computed sales tax collected on client invoices versus purchase tax recognized on operating expenses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Output Tax Collected</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(taxData.salesTaxCollected, currency)}</p>
              <p className="text-[10px] text-slate-400 mt-1">From invoiced sales</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Input Tax Paid</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(taxData.purchaseTaxPaid, currency)}</p>
              <p className="text-[10px] text-slate-400 mt-1">From operating expenses</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider">Net Tax Remittance</span>
              <p className="text-xl font-bold text-blue-900 mt-1">{formatCurrency(taxData.netTaxLiability, currency)}</p>
              <p className="text-[10px] text-blue-700 mt-1">Net liability due to tax authority</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
