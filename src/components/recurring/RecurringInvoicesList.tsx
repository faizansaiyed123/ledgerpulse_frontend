import React, { useState } from 'react';
import { Repeat, Plus, Play, Pause, Trash2, Calendar, CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { RecurringInvoice, RecurringFrequency } from '../../types/index.ts';
import { formatCurrency } from '../../lib/currency.ts';

export const RecurringInvoicesList: React.FC = () => {
  const { currentOrg, recurringInvoices, addRecurringInvoice, updateRecurringInvoice, deleteRecurringInvoice, triggerRecurringBatch, customers, canEditFinancials } = useOrg();
  const [modalOpen, setModalOpen] = useState(false);
  const [runningBatch, setRunningBatch] = useState(false);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);

  // Form states
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextRunDate, setNextRunDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxOccurrences, setMaxOccurrences] = useState<number>(12);
  const [amount, setAmount] = useState<number>(2500);
  const [description, setDescription] = useState('Monthly Retainer & Cloud Support Services');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    await addRecurringInvoice({
      templateInvoiceNumber: `REC-${Date.now().toString().slice(-4)}`,
      customerId: cust.id,
      customerName: cust.name,
      frequency,
      nextRunDate,
      occurrences: 0,
      maxOccurrences: Number(maxOccurrences) || undefined,
      status: 'active',
      currency: currentOrg?.currency || 'USD',
      totalAmount: Number(amount),
      subtotal: Number(amount),
      taxAmount: 0,
      discountAmount: 0,
      items: [
        {
          id: `rec_item_${Date.now()}`,
          description,
          quantity: 1,
          unitPrice: Number(amount),
          amount: Number(amount),
        },
      ],
      notes: 'Automated recurring billing schedule',
      terms: 'Net 30 days',
    });

    setModalOpen(false);
  };

  const handleRunBatchNow = async () => {
    setRunningBatch(true);
    setBatchNotice(null);
    try {
      const generatedCount = await triggerRecurringBatch();
      setBatchNotice(
        generatedCount > 0
          ? `✓ Automated background worker executed: Generated ${generatedCount} new invoice(s) from due schedules!`
          : `✓ Checked all recurring schedules: No invoices were currently due for generation.`
      );
    } catch (e) {
      setBatchNotice('Error executing recurring batch.');
    } finally {
      setRunningBatch(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recurring Invoices &amp; Automation</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
              Background Scheduler
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automate monthly client retainers, subscription renewals, and recurring service invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunBatchNow}
            disabled={runningBatch}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-purple-600" />
            <span>{runningBatch ? 'Processing Schedules...' : 'Run Scheduled Batch Now'}</span>
          </button>

          {canEditFinancials && (
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Recurring Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Batch notice banner */}
      {batchNotice && (
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-center justify-between animate-fade-in">
          <span>{batchNotice}</span>
          <button onClick={() => setBatchNotice(null)} className="font-bold text-purple-700 ml-2">✕</button>
        </div>
      )}

      {/* Schedules List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold">Schedule ID</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Frequency</th>
                <th className="py-3 px-4 font-semibold">Next Run</th>
                <th className="py-3 px-4 font-semibold">Amount</th>
                <th className="py-3 px-4 font-semibold">Occurrences</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recurringInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Repeat className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No recurring schedules configured yet.
                  </td>
                </tr>
              ) : (
                recurringInvoices.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{rec.templateInvoiceNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{rec.customerName}</td>
                    <td className="py-3.5 px-4 capitalize">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                        {rec.frequency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{rec.nextRunDate}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(rec.totalAmount, rec.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {rec.occurrences} {rec.maxOccurrences ? `/ ${rec.maxOccurrences}` : 'runs'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          rec.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'paused'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rec.status === 'active' ? (
                          <button
                            onClick={() => updateRecurringInvoice(rec.id, { status: 'paused' })}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-amber-600"
                            title="Pause Schedule"
                          >
                            <Pause className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => updateRecurringInvoice(rec.id, { status: 'active' })}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-emerald-600"
                            title="Resume Schedule"
                          >
                            <Play className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('Delete this recurring schedule?')) {
                              deleteRecurringInvoice(rec.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                          title="Delete Schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* New Recurring Schedule Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Create Recurring Invoice Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automate recurring client billing at scheduled intervals</p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company ? `(${c.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Billing Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg capitalize focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First / Next Run Date</label>
                  <input
                    type="date"
                    required
                    value={nextRunDate}
                    onChange={(e) => setNextRunDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recurring Amount ({currentOrg?.currency || 'USD'})</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Occurrences (e.g. 12)</label>
                  <input
                    type="number"
                    min="1"
                    value={maxOccurrences}
                    onChange={(e) => setMaxOccurrences(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service / Line Item Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
