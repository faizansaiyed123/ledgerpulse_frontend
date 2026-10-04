import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Download,
  Trash2,
  Copy,
  Eye,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  ExternalLink,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { Invoice, InvoiceStatus } from '../../types/index.ts';
import { formatCurrency } from '../../lib/currency.ts';
import { downloadInvoicePDF, exportToCSV } from '../../lib/pdf.ts';

interface InvoicesListProps {
  onOpenNewInvoice: () => void;
  onViewInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({
  onOpenNewInvoice,
  onViewInvoice,
  onEditInvoice,
  onRecordPayment,
}) => {
  const { currentOrg, invoices, deleteInvoice, duplicateInvoice, userRole, canEditFinancials, canManageOrg } = useOrg();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
        const matchesSearch =
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.customerEmail && inv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.issueDate.localeCompare(a.issueDate);
        if (sortBy === 'date_asc') return a.issueDate.localeCompare(b.issueDate);
        if (sortBy === 'amount_desc') return b.totalAmount - a.totalAmount;
        if (sortBy === 'amount_asc') return a.totalAmount - b.totalAmount;
        return 0;
      });
  }, [invoices, statusFilter, searchQuery, sortBy]);

  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Customer Name', 'Issue Date', 'Due Date', 'Status', 'Currency', 'Subtotal', 'Tax', 'Total Amount', 'Paid Amount', 'Balance Due'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.customerName,
      inv.issueDate,
      inv.dueDate,
      inv.status,
      inv.currency,
      inv.subtotal,
      inv.taxAmount,
      inv.totalAmount,
      inv.paidAmount,
      inv.balanceDue,
    ]);
    exportToCSV(`Invoices_${currentOrg?.name || 'Workspace'}_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">PAID</span>;
      case 'partially_paid':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">PARTIAL</span>;
      case 'overdue':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">OVERDUE</span>;
      case 'sent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">SENT</span>;
      case 'cancelled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">CANCELLED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">DRAFT</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Invoice Management</h2>
          <p className="text-xs text-slate-500">
            {filteredInvoices.length} of {invoices.length} total invoices shown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {canEditFinancials && (
            <button
              onClick={onOpenNewInvoice}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice #, customer name, email..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-1 w-full md:w-auto">
          {['all', 'draft', 'sent', 'partially_paid', 'paid', 'overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg capitalize font-semibold transition-colors ${
                statusFilter === st ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-slate-400 font-medium">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Invoice #</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Issue Date</th>
                <th className="py-3 px-4 font-semibold">Due Date</th>
                <th className="py-3 px-4 font-semibold">Total Amount</th>
                <th className="py-3 px-4 font-semibold">Balance Due</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No invoices match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <button
                        onClick={() => onViewInvoice(inv)}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        {inv.invoiceNumber}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      <div>{inv.customerName}</div>
                      {inv.customerEmail && <div className="text-[10px] text-slate-400">{inv.customerEmail}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.issueDate}</td>
                    <td className="py-3.5 px-4 text-slate-500">{inv.dueDate}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold">
                      {inv.balanceDue > 0 ? (
                        <span className="text-rose-600">{formatCurrency(inv.balanceDue, inv.currency)}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold">$0.00</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(inv.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                          title="View Invoice"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {inv.balanceDue > 0 && canEditFinancials && (
                          <button
                            onClick={() => onRecordPayment(inv)}
                            className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] transition-colors"
                          >
                            Pay
                          </button>
                        )}
                        <button
                          onClick={() => currentOrg && downloadInvoicePDF(inv, currentOrg)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {canEditFinancials && (
                          <button
                            onClick={() => duplicateInvoice(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canManageOrg && (
                          <button
                            onClick={() => {
                              if (confirm(`Delete invoice ${inv.invoiceNumber}?`)) {
                                deleteInvoice(inv.id);
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
