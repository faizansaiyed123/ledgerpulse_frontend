import React, { useState } from 'react';
import { CreditCard, DollarSign, Calendar, Check, AlertCircle } from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { Invoice, PaymentMethod } from '../../types/index.ts';
import { formatCurrency } from '../../lib/currency.ts';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  const { currentOrg, recordPayment } = useOrg();
  const [amount, setAmount] = useState<number>(invoice?.balanceDue || 0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;
    setSubmitting(true);
    try {
      await recordPayment({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        amount: Number(amount),
        paymentDate,
        paymentMethod,
        reference,
        notes,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const remainingAfter = Math.max(0, invoice.balanceDue - (amount || 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Record Payment</h3>
              <p className="text-[11px] text-slate-500 font-mono">{invoice.invoiceNumber} • {invoice.customerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
        </div>

        {/* Invoice Summary Pill */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
          <div>
            <p className="text-slate-500">Invoice Balance Due</p>
            <p className="font-bold text-base text-slate-900">{formatCurrency(invoice.balanceDue, invoice.currency)}</p>
          </div>
          <button
            type="button"
            onClick={() => setAmount(invoice.balanceDue)}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-[10px] font-semibold text-slate-700 shadow-sm"
          >
            Pay Full Balance
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Amount ({invoice.currency})</label>
            <input
              type="number"
              step="0.01"
              max={invoice.balanceDue}
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg capitalize focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="bank_transfer">Bank Transfer (ACH / Wire)</option>
                <option value="credit_card">Credit Card</option>
                <option value="stripe_test">Stripe Online</option>
                <option value="paypal">PayPal</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transaction Reference / Check #</label>
            <input
              type="text"
              placeholder="e.g. WIRE-892144 or CHK-1049"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
            <input
              type="text"
              placeholder="e.g. Verified in Chase Commercial checking"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Real-time remaining preview */}
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex justify-between items-center text-[11px]">
            <span>Remaining Balance After Payment:</span>
            <span className="font-bold">{formatCurrency(remainingAfter, invoice.currency)}</span>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              Confirm &amp; Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
