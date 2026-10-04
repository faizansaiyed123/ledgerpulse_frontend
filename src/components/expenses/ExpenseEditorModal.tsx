import React, { useState, useEffect } from 'react';
import { Receipt, Upload, X, DollarSign, Calendar, Tag, Check, Image as ImageIcon } from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { Expense, ExpenseCategory, PaymentMethod } from '../../types/index.ts';

interface ExpenseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseToEdit?: Expense | null;
}

export const ExpenseEditorModal: React.FC<ExpenseEditorModalProps> = ({
  isOpen,
  onClose,
  expenseToEdit,
}) => {
  const { currentOrg, vendors, addExpense, updateExpense, addVendor } = useOrg();

  const [description, setDescription] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('software');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(0);
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [isReimbursable, setIsReimbursable] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [notes, setNotes] = useState('');

  // Quick Add Vendor
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setDescription(expenseToEdit.description);
      setVendorId(expenseToEdit.vendorId || '');
      setCategory(expenseToEdit.category);
      setExpenseDate(expenseToEdit.expenseDate);
      setAmount(expenseToEdit.amount);
      setTaxAmount(expenseToEdit.taxAmount || 0);
      setCurrency(expenseToEdit.currency);
      setPaymentMethod(expenseToEdit.paymentMethod);
      setIsReimbursable(expenseToEdit.isReimbursable);
      setReceiptUrl(expenseToEdit.receiptUrl || '');
      setReceiptName(expenseToEdit.receiptName || '');
      setNotes(expenseToEdit.notes || '');
    } else {
      setDescription('');
      setVendorId(vendors[0]?.id || '');
      setCategory('software');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setAmount(0);
      setTaxAmount(0);
      setCurrency(currentOrg?.currency || 'USD');
      setPaymentMethod('credit_card');
      setIsReimbursable(false);
      setReceiptUrl('');
      setReceiptName('');
      setNotes('');
    }
  }, [expenseToEdit, vendors, currentOrg, isOpen]);

  if (!isOpen) return null;

  // Handle simulated receipt file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxBytes = 1_500_000;
      if (file.size > maxBytes) {
        setError('Receipt files must be 1.5 MB or smaller.');
        e.currentTarget.value = '';
        return;
      }
      setError('');
      setReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!description || amount <= 0) {
      setError('Enter a description and an amount greater than zero.');
      return;
    }

    const selectedVendor = vendors.find((v) => v.id === vendorId);

    try {
      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, {
        description,
        vendorId: selectedVendor?.id,
        vendorName: selectedVendor?.name,
        category,
        expenseDate,
        amount: Number(amount),
        taxAmount: Number(taxAmount) || 0,
        currency,
        paymentMethod,
        isReimbursable,
        receiptUrl,
        receiptName,
        notes,
      });
      } else {
        await addExpense({
          description,
          vendorId: selectedVendor?.id,
          vendorName: selectedVendor?.name,
          category,
          expenseDate,
          amount: Number(amount),
          taxAmount: Number(taxAmount) || 0,
          currency,
          paymentMethod,
          isReimbursable,
          status: 'approved',
          receiptUrl,
          receiptName,
          notes,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the expense.');
    }
  };

  const handleCreateVendor = async () => {
    if (!newVendorName) return;
    try {
      const vend = await addVendor({
        name: newVendorName,
        category,
      });
      setVendorId(vend.id);
      setShowAddVendor(false);
      setNewVendorName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the vendor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full my-6 p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {expenseToEdit ? 'Edit Expense' : 'Record Business Expense'}
              </h3>
              <p className="text-[11px] text-slate-500">Log vendor charges, taxes, and receipt documents</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
        </div>

        {error && <div className="mt-3 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">{error}</div>}
        <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs overflow-y-auto flex-1 pr-1">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expense Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. AWS Cloud ECS Clusters & S3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg capitalize focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="software">Software &amp; Subscriptions</option>
                <option value="office">Office &amp; Coworking</option>
                <option value="travel">Travel &amp; Flights</option>
                <option value="meals">Meals &amp; Entertainment</option>
                <option value="advertising">Advertising &amp; Marketing</option>
                <option value="consulting">Professional Consulting</option>
                <option value="equipment">Hardware &amp; Equipment</option>
                <option value="utilities">Utilities &amp; Telecom</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Vendor / Supplier</label>
                <button
                  type="button"
                  onClick={() => setShowAddVendor(!showAddVendor)}
                  className="text-blue-600 hover:underline font-bold text-[10px]"
                >
                  + Add
                </button>
              </div>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">None / Unassigned</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {showAddVendor && (
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex gap-2 items-center">
              <input
                type="text"
                placeholder="New Vendor Name"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                className="flex-1 px-2.5 py-1 bg-white border border-blue-300 rounded text-xs"
              />
              <button
                type="button"
                onClick={handleCreateVendor}
                className="px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-semibold"
              >
                Add
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Total Amount ({currency}) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax Amount Included</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxAmount || ''}
                onChange={(e) => setTaxAmount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg capitalize focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="credit_card">Corporate Credit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="paypal">PayPal</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reimbursable"
              checked={isReimbursable}
              onChange={(e) => setIsReimbursable(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="reimbursable" className="font-semibold text-slate-700 cursor-pointer">
              Employee Reimbursable Expense
            </label>
          </div>

          {/* Receipt Upload / Attachment */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block font-semibold text-slate-700 mb-1">Receipt Attachment</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-semibold text-slate-700 shadow-sm flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Receipt File</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {receiptName && (
                <span className="text-xs text-slate-600 truncate max-w-[200px] flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {receiptName}
                </span>
              )}
            </div>
            {receiptUrl && receiptUrl.startsWith('data:image') && (
              <div className="mt-2 w-20 h-20 rounded-lg border border-slate-300 overflow-hidden">
                <img src={receiptUrl} alt="Receipt thumbnail" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Business Purpose</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. SFO to SEA flight for quarterly client security audit"
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
            >
              {expenseToEdit ? 'Save Changes' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
