import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Plus,
  Download,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  DollarSign,
  Tag,
  Building,
  Image as ImageIcon,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { Expense, ExpenseCategory } from '../../types/index.ts';
import { formatCurrency } from '../../lib/currency.ts';
import { exportToCSV } from '../../lib/pdf.ts';

interface ExpensesListProps {
  onOpenNewExpense: () => void;
  onEditExpense: (expense: Expense) => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({
  onOpenNewExpense,
  onEditExpense,
}) => {
  const { currentOrg, expenses, approveExpense, rejectExpense, deleteExpense, canApproveExpenses, canManageOrg } = useOrg();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [activeReceiptUrl, setActiveReceiptUrl] = useState<string | null>(null);

  const currency = currentOrg?.currency || 'USD';

  // Category totals
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
        const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
        const matchesSearch =
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (e.vendorName && e.vendorName.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'date_desc') return b.expenseDate.localeCompare(a.expenseDate);
        if (sortBy === 'date_asc') return a.expenseDate.localeCompare(b.expenseDate);
        if (sortBy === 'amount_desc') return b.amount - a.amount;
        if (sortBy === 'amount_asc') return a.amount - b.amount;
        return 0;
      });
  }, [expenses, categoryFilter, statusFilter, searchQuery, sortBy]);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleExportCSV = () => {
    const headers = ['Description', 'Vendor', 'Category', 'Date', 'Amount', 'Tax', 'Payment Method', 'Reimbursable', 'Status'];
    const rows = filteredExpenses.map((e) => [
      e.description,
      e.vendorName || '',
      e.category,
      e.expenseDate,
      e.amount,
      e.taxAmount || 0,
      e.paymentMethod,
      e.isReimbursable ? 'Yes' : 'No',
      e.status,
    ]);
    exportToCSV(`Expenses_${currentOrg?.name || 'Workspace'}_${new Date().toISOString().split('T')[0]}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Expense Management &amp; Receipts</h2>
          <p className="text-xs text-slate-500">
            Total of <span className="font-semibold text-slate-800">{formatCurrency(totalFiltered, currency)}</span> in filtered expenses
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
          <button
            onClick={onOpenNewExpense}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Category Sparkline Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {['software', 'office', 'travel', 'meals'].map((cat) => (
          <div
            key={cat}
            onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              categoryFilter === cat
                ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{cat}</span>
            <p className="text-base font-bold text-slate-900 mt-1">
              {formatCurrency(categoryTotals[cat] || 0, currency)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search expenses by description or vendor..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg capitalize font-semibold focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="software">Software</option>
            <option value="office">Office</option>
            <option value="travel">Travel</option>
            <option value="meals">Meals</option>
            <option value="advertising">Advertising</option>
            <option value="consulting">Consulting</option>
            <option value="equipment">Equipment</option>
            <option value="utilities">Utilities</option>
            <option value="other">Other</option>
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {['all', 'approved', 'pending', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[11px] capitalize font-semibold transition-colors ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold focus:outline-none"
          >
            <option value="date_desc">Newest Date</option>
            <option value="date_asc">Oldest Date</option>
            <option value="amount_desc">Highest Amount</option>
            <option value="amount_asc">Lowest Amount</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Vendor</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Receipt</th>
                <th className="py-3 px-4 font-semibold">Approval</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No expenses match your search or filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[220px] truncate">
                      {exp.description}
                      {exp.isReimbursable && (
                        <span className="ml-2 text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700">
                          Reimbursable
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{exp.vendorName || '—'}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{exp.expenseDate}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(exp.amount, exp.currency)}
                    </td>
                    <td className="py-3.5 px-4">
                      {exp.receiptUrl ? (
                        <button
                          onClick={() => setActiveReceiptUrl(exp.receiptUrl!)}
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[10px] flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No receipt</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            exp.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : exp.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {exp.status}
                        </span>

                        {exp.status === 'pending' && canApproveExpenses && (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => approveExpense(exp.id)}
                              className="p-1 rounded bg-emerald-50 hover:bg-emerald-200 text-emerald-700"
                              title="Approve"
                            >
                              <CheckCircle className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => rejectExpense(exp.id)}
                              className="p-1 rounded bg-rose-50 hover:bg-rose-200 text-rose-700"
                              title="Reject"
                            >
                              <XCircle className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {canManageOrg && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this expense?')) {
                                deleteExpense(exp.id);
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

      {/* Receipt Lightbox Modal */}
      {activeReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 shadow-2xl relative">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 mb-3">
              <span className="font-bold text-slate-900 text-xs">Receipt Document Preview</span>
              <button
                onClick={() => setActiveReceiptUrl(null)}
                className="text-slate-500 hover:text-slate-800 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center max-h-[70vh]">
              <img
                src={activeReceiptUrl}
                alt="Receipt Full Preview"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
