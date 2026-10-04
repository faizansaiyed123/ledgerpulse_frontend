import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Download,
  Calendar,
  CheckCircle,
  Building,
  DollarSign,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { PaymentMethod, Payment } from '../../types/index.ts';
import { formatCurrency } from '../../lib/currency.ts';
import { exportToCSV } from '../../lib/pdf.ts';
import { BatchPaymentModal } from './BatchPaymentModal.tsx';

export const PaymentsLedger: React.FC = () => {
  const { currentOrg, payments, canEditFinancials } = useOrg();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchSuccessNotice, setBatchSuccessNotice] = useState<{ count: number; total: number } | null>(null);

  const currency = currentOrg?.currency || 'USD';

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        const matchesMethod = methodFilter === 'all' || p.paymentMethod === methodFilter;
        const matchesSearch =
          p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.reference && p.reference.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesMethod && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.paymentDate.localeCompare(a.paymentDate);
        if (sortBy === 'date_asc') return a.paymentDate.localeCompare(b.paymentDate);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [payments, methodFilter, searchQuery, sortBy]);

  const totalCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const avgPayment = filteredPayments.length ? totalCollected / filteredPayments.length : 0;

  const handleExportCSV = () => {
    const headers = ['Date', 'Invoice #', 'Customer', 'Amount', 'Payment Method', 'Reference', 'Notes'];
    const rows = filteredPayments.map((p) => [
      p.paymentDate,
      p.invoiceNumber,
      p.customerName,
      p.amount,
      p.paymentMethod,
      p.reference || '',
      p.notes || '',
    ]);
    exportToCSV(`Payments_${currentOrg?.name || 'Workspace'}_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Payment Reconciliation &amp; Ledger</h2>
          <p className="text-xs text-slate-500">Audit trail of all inbound customer cash collections and payment methods</p>
        </div>

        <div className="flex items-center gap-2">
          {canEditFinancials && (
            <button
              onClick={() => setBatchModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Record Batch Payments</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Payments CSV</span>
          </button>
        </div>
      </div>

      {/* Batch Payment Success Alert */}
      {batchSuccessNotice && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Batch Payments Recorded!</strong> Successfully settled{' '}
              {batchSuccessNotice.count} invoice{batchSuccessNotice.count === 1 ? '' : 's'} totaling{' '}
              <strong className="text-emerald-700">{formatCurrency(batchSuccessNotice.total, currency)}</strong>.
            </span>
          </div>
          <button
            onClick={() => setBatchSuccessNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Received</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(totalCollected, currency)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transactions Count</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{filteredPayments.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Average Transaction</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(avgPayment, currency)}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, customer, invoice #..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg capitalize font-semibold focus:outline-none"
          >
            <option value="all">All Payment Methods</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="credit_card">Credit Card</option>
            <option value="stripe_test">Stripe</option>
            <option value="paypal">PayPal</option>
            <option value="check">Check</option>
            <option value="cash">Cash</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:outline-none"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Payment Date</th>
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Payment Method</th>
                <th className="py-3 px-4 font-semibold">Reference / Txn ID</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No payments found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-700">{p.paymentDate}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{p.customerName}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px] border border-emerald-200">
                        {p.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{p.reference || '—'}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 text-sm">
                      +{formatCurrency(p.amount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-right max-w-[200px] truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Batch Payment Processing Modal */}
      <BatchPaymentModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onBatchCompleted={(created) => {
          const total = created.reduce((s, p) => s + p.amount, 0);
          setBatchSuccessNotice({ count: created.length, total });
          setTimeout(() => setBatchSuccessNotice(null), 8000);
        }}
      />
    </div>
  );
};
