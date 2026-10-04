import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Layers,
  ArrowRight,
  DollarSign,
  Calendar,
  X,
  Sparkles,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Invoice, PaymentMethod, Payment } from '../../types/index.ts';
import { formatCurrency } from '../../lib/currency.ts';

interface BatchPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchCompleted?: (payments: Payment[]) => void;
}

interface BatchRowItem {
  invoiceId: string;
  selected: boolean;
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  notes: string;
}

export const BatchPaymentModal: React.FC<BatchPaymentModalProps> = ({
  isOpen,
  onClose,
  onBatchCompleted,
}) => {
  const { currentOrg, invoices, recordBatchPayments } = useOrg();
  const { addNotification } = useNotifications();

  const currency = currentOrg?.currency || 'USD';
  const today = new Date().toISOString().split('T')[0];

  // Global batch defaults
  const [defaultDate, setDefaultDate] = useState<string>(today);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod>('bank_transfer');
  const [defaultRef, setDefaultRef] = useState<string>(`BATCH-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}`);
  const [defaultNote, setDefaultNote] = useState<string>('Batch payment reconciliation');

  // Search and filter inside the modal
  const [searchQuery, setSearchQuery] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Status
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPayments, setProcessedPayments] = useState<Payment[] | null>(null);

  // Filter invoices that have an outstanding balance due
  const payableInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.balanceDue > 0 && inv.status !== 'cancelled');
  }, [invoices]);

  // Maintain row state keyed by invoiceId
  const [rows, setRows] = useState<Record<string, BatchRowItem>>({});

  // Initialize row items when modal opens or invoices change
  React.useEffect(() => {
    if (isOpen) {
      const initialRows: Record<string, BatchRowItem> = {};
      payableInvoices.forEach((inv) => {
        initialRows[inv.id] = {
          invoiceId: inv.id,
          selected: false,
          amount: inv.balanceDue,
          paymentMethod: defaultMethod,
          reference: defaultRef,
          notes: defaultNote,
        };
      });
      setRows(initialRows);
      setProcessedPayments(null);
    }
  }, [isOpen, payableInvoices.length]);

  if (!isOpen) return null;

  // Filtered view of payable invoices
  const filteredPayableInvoices = payableInvoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.customerEmail && inv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()));

    const isOverdue = inv.status === 'overdue' || (inv.dueDate < today && inv.balanceDue > 0);
    const matchesOverdue = overdueOnly ? isOverdue : true;

    return matchesSearch && matchesOverdue;
  });

  const selectedInvoices = payableInvoices.filter((inv) => rows[inv.id]?.selected);
  const totalBatchAmount = selectedInvoices.reduce((sum, inv) => sum + (rows[inv.id]?.amount || 0), 0);

  // Toggle single row selection
  const toggleRow = (invoiceId: string) => {
    setRows((prev) => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        selected: !prev[invoiceId]?.selected,
      },
    }));
  };

  // Select all currently visible invoices
  const selectAllVisible = () => {
    setRows((prev) => {
      const next = { ...prev };
      filteredPayableInvoices.forEach((inv) => {
        if (next[inv.id]) {
          next[inv.id] = { ...next[inv.id], selected: true };
        }
      });
      return next;
    });
  };

  // Clear all selections
  const clearSelection = () => {
    setRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        next[k] = { ...next[k], selected: false };
      });
      return next;
    });
  };

  // Select only overdue
  const selectOverdue = () => {
    setRows((prev) => {
      const next = { ...prev };
      payableInvoices.forEach((inv) => {
        const isOverdue = inv.status === 'overdue' || (inv.dueDate < today && inv.balanceDue > 0);
        if (next[inv.id]) {
          next[inv.id] = { ...next[inv.id], selected: isOverdue };
        }
      });
      return next;
    });
  };

  // Apply defaults to all selected rows
  const applyDefaultsToSelected = () => {
    setRows((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (next[id]?.selected) {
          next[id] = {
            ...next[id],
            paymentMethod: defaultMethod,
            reference: defaultRef,
            notes: defaultNote,
          };
        }
      });
      return next;
    });
  };

  // Handle row amount change
  const handleAmountChange = (invoiceId: string, value: number, maxBalance: number) => {
    const validAmount = Math.max(0, Math.min(value, maxBalance));
    setRows((prev) => ({
      ...prev,
      [invoiceId]: {
        ...prev[invoiceId],
        amount: validAmount,
      },
    }));
  };

  // Submit batch processing
  const handleProcessBatch = async () => {
    if (selectedInvoices.length === 0 || totalBatchAmount <= 0) return;

    setIsProcessing(true);
    try {
      const batchEntries = selectedInvoices.map((inv) => {
        const row = rows[inv.id];
        return {
          invoiceId: inv.id,
          amount: row.amount,
          paymentMethod: row.paymentMethod,
          paymentDate: defaultDate,
          reference: row.reference,
          notes: row.notes,
        };
      });

      const paymentsCreated = await recordBatchPayments(batchEntries);
      setProcessedPayments(paymentsCreated);

      addNotification({
        orgId: currentOrg?.id || 'default',
        title: 'Batch Payment Reconciliation Completed',
        message: `Recorded ${paymentsCreated.length} payments totaling ${formatCurrency(totalBatchAmount, currency)}.`,
        type: 'payment_received',
        link: '/payments',
      });

      if (onBatchCompleted) {
        onBatchCompleted(paymentsCreated);
      }
    } catch (err) {
      console.error('Failed to process batch payments:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white tracking-tight">Batch Payment Processing</h3>
              <p className="text-xs text-slate-400">
                Simultaneously record payments across multiple outstanding customer invoices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {processedPayments ? (
          /* Success Screen */
          <div className="p-8 sm:p-12 text-center space-y-5 overflow-y-auto flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-900">Batch Payments Successfully Processed!</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Recorded <span className="font-bold text-slate-900">{processedPayments.length}</span> payment transactions
                totaling <span className="font-bold text-emerald-600">{formatCurrency(totalBatchAmount, currency)}</span> in the Payments Ledger.
              </p>
            </div>

            {/* Breakdown summary */}
            <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs">
              <div className="font-bold text-slate-800 text-left mb-2 flex items-center justify-between">
                <span>Transactions Audit Summary</span>
                <span className="text-[10px] font-mono text-slate-500">{new Date().toLocaleTimeString()}</span>
              </div>
              <div className="divide-y divide-slate-200 max-h-56 overflow-y-auto pr-1">
                {processedPayments.map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between text-left">
                    <div>
                      <span className="font-mono font-bold text-blue-600 mr-2">{p.invoiceNumber}</span>
                      <span className="font-semibold text-slate-800">{p.customerName}</span>
                      <span className="text-slate-400 ml-2 capitalize">({p.paymentMethod.replace('_', ' ')})</span>
                    </div>
                    <span className="font-bold text-emerald-600">+{formatCurrency(p.amount, currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-colors"
              >
                Return to Payments Ledger
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Batch Workspace */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Global Batch Preset Controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Global Batch Defaults (Applied to Selected Rows)
                </span>
                <button
                  type="button"
                  onClick={applyDefaultsToSelected}
                  disabled={selectedInvoices.length === 0}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-40 transition-colors"
                >
                  Apply Defaults to Selected ({selectedInvoices.length})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Batch Date</label>
                  <input
                    type="date"
                    value={defaultDate}
                    onChange={(e) => setDefaultDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Payment Method</label>
                  <select
                    value={defaultMethod}
                    onChange={(e) => setDefaultMethod(e.target.value as PaymentMethod)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="bank_transfer">Bank Transfer / ACH</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="stripe_test">Stripe</option>
                    <option value="paypal">PayPal</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Batch Reference</label>
                  <input
                    type="text"
                    value={defaultRef}
                    onChange={(e) => setDefaultRef(e.target.value)}
                    placeholder="e.g. WIRE-SEPT-01"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Common Note</label>
                  <input
                    type="text"
                    value={defaultNote}
                    onChange={(e) => setDefaultNote(e.target.value)}
                    placeholder="Batch notes"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Filter and Selection Header */}
            <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
                <div className="relative w-full">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by customer, invoice #..."
                    className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOverdueOnly(!overdueOnly)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                    overdueOnly
                      ? 'bg-rose-50 border-rose-300 text-rose-700'
                      : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {overdueOnly ? 'Showing Overdue Only' : 'Filter Overdue'}
                </button>

                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                >
                  Select All Visible
                </button>

                <button
                  type="button"
                  onClick={selectOverdue}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                >
                  Select Overdue
                </button>

                {selectedInvoices.length > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Clear ({selectedInvoices.length})
                  </button>
                )}
              </div>
            </div>

            {/* Invoices List Table */}
            <div className="overflow-y-auto flex-1 p-3">
              {filteredPayableInvoices.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">All invoices are settled!</p>
                  <p className="text-xs text-slate-400 mt-1">There are no open or overdue balances matching your filter.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 border-b border-slate-200">
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredPayableInvoices.length > 0 &&
                              filteredPayableInvoices.every((inv) => rows[inv.id]?.selected)
                            }
                            onChange={(e) => {
                              if (e.target.checked) selectAllVisible();
                              else clearSelection();
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </th>
                        <th className="py-2.5 px-3">Invoice #</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                        <th className="py-2.5 px-3 text-right">Balance Due</th>
                        <th className="py-2.5 px-3 text-right w-36">Payment Amount</th>
                        <th className="py-2.5 px-3 w-40">Payment Method</th>
                        <th className="py-2.5 px-3 w-36">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPayableInvoices.map((inv) => {
                        const row = rows[inv.id] || {
                          invoiceId: inv.id,
                          selected: false,
                          amount: inv.balanceDue,
                          paymentMethod: defaultMethod,
                          reference: defaultRef,
                          notes: defaultNote,
                        };
                        const isOverdue = inv.status === 'overdue' || (inv.dueDate < today && inv.balanceDue > 0);

                        return (
                          <tr
                            key={inv.id}
                            className={`transition-colors ${
                              row.selected ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="checkbox"
                                checked={row.selected}
                                onChange={() => toggleRow(inv.id)}
                                className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {inv.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              <div>{inv.customerName}</div>
                              {inv.customerEmail && (
                                <div className="text-[10px] text-slate-400">{inv.customerEmail}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">
                              <span className={isOverdue ? 'text-rose-600 font-bold' : ''}>
                                {inv.dueDate}
                              </span>
                              {isOverdue && (
                                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-rose-100 text-rose-800 font-bold uppercase">
                                  Overdue
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500">
                              {formatCurrency(inv.totalAmount, currency)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                              {formatCurrency(inv.balanceDue, currency)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-slate-400 font-semibold text-[11px]">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  max={inv.balanceDue}
                                  disabled={!row.selected}
                                  value={row.amount}
                                  onChange={(e) =>
                                    handleAmountChange(inv.id, parseFloat(e.target.value) || 0, inv.balanceDue)
                                  }
                                  className={`w-full pl-5 pr-2 py-1 bg-white border rounded text-right text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                    row.selected ? 'border-slate-300 text-slate-900' : 'border-slate-200 text-slate-400 bg-slate-50'
                                  }`}
                                />
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <select
                                disabled={!row.selected}
                                value={row.paymentMethod}
                                onChange={(e) =>
                                  setRows((prev) => ({
                                    ...prev,
                                    [inv.id]: { ...prev[inv.id], paymentMethod: e.target.value as PaymentMethod },
                                  }))
                                }
                                className={`w-full px-2 py-1 bg-white border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  row.selected ? 'border-slate-300 text-slate-900' : 'border-slate-200 text-slate-400 bg-slate-50'
                                }`}
                              >
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="stripe_test">Stripe</option>
                                <option value="paypal">PayPal</option>
                                <option value="check">Check</option>
                                <option value="cash">Cash</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                disabled={!row.selected}
                                value={row.reference}
                                onChange={(e) =>
                                  setRows((prev) => ({
                                    ...prev,
                                    [inv.id]: { ...prev[inv.id], reference: e.target.value },
                                  }))
                                }
                                placeholder="Ref / Txn ID"
                                className={`w-full px-2 py-1 bg-white border rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                  row.selected ? 'border-slate-300 text-slate-900' : 'border-slate-200 text-slate-400 bg-slate-50'
                                }`}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bottom Summary & Process Action Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500">Selected Invoices: </span>
                  <span className="font-bold text-slate-900">{selectedInvoices.length} of {payableInvoices.length}</span>
                </div>
                <div className="h-4 w-px bg-slate-300" />
                <div>
                  <span className="text-slate-500">Total Batch Collection: </span>
                  <span className="font-bold text-emerald-600 text-sm">{formatCurrency(totalBatchAmount, currency)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing || selectedInvoices.length === 0 || totalBatchAmount <= 0}
                  onClick={handleProcessBatch}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                >
                  <CreditCard className={`w-3.5 h-3.5 ${isProcessing ? 'animate-pulse' : ''}`} />
                  <span>
                    {isProcessing
                      ? 'Processing Batch Payments...'
                      : `Record Batch Payments (${selectedInvoices.length})`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
