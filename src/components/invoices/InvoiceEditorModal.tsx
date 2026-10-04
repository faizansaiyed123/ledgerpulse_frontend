import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Calculator, Calendar, User, FileText, Check } from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { Invoice, InvoiceItem, Customer } from '../../types/index.ts';
import { formatCurrency } from '../../lib/currency.ts';

interface InvoiceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceToEdit?: Invoice | null;
}

export const InvoiceEditorModal: React.FC<InvoiceEditorModalProps> = ({
  isOpen,
  onClose,
  invoiceToEdit,
}) => {
  const { currentOrg, customers, invoices, addInvoice, updateInvoice, addCustomer } = useOrg();

  // Basic Details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Line items
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(5);

  // New Customer inline modal
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoiceToEdit) {
      setInvoiceNumber(invoiceToEdit.invoiceNumber);
      setCustomerId(invoiceToEdit.customerId);
      setIssueDate(invoiceToEdit.issueDate);
      setDueDate(invoiceToEdit.dueDate);
      setCurrency(invoiceToEdit.currency);
      setNotes(invoiceToEdit.notes || '');
      setTerms(invoiceToEdit.terms || '');
      setItems(invoiceToEdit.items);
      setDiscountPercent(invoiceToEdit.discountPercent || 0);
      setTaxPercent(invoiceToEdit.taxPercent || 0);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const due = new Date();
      due.setDate(due.getDate() + (currentOrg?.paymentTermsDays || 30));

      const year = new Date().getFullYear();
      const usedNumbers = invoices
        .map((invoice) => invoice.invoiceNumber.match(new RegExp(`^INV-${year}-(\\d+)$`)))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .map((match) => Number(match[1]));
      const nextSequence = (usedNumbers.length ? Math.max(...usedNumbers) : 0) + 1;
      const nextNum = `INV-${year}-${String(nextSequence).padStart(3, '0')}`;

      setInvoiceNumber(nextNum);
      setCustomerId(customers[0]?.id || '');
      setIssueDate(today);
      setDueDate(due.toISOString().split('T')[0]);
      setCurrency(currentOrg?.currency || 'USD');
      setNotes(currentOrg?.invoiceNotes || 'Thank you for your business!');
      setTerms(currentOrg?.invoiceTerms || 'Payment due within 30 days.');
      setDiscountPercent(0);
      setTaxPercent(5);
      setItems([
        {
          id: `item_${Date.now()}`,
          description: 'Consulting & Implementation Services',
          quantity: 1,
          unitPrice: 1500,
          amount: 1500,
        },
      ]);
    }
  }, [invoiceToEdit, currentOrg, customers, invoices.length, isOpen]);

  if (!isOpen) return null;

  // Add Item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
      },
    ]);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Update item row
  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'quantity' || field === 'unitPrice' || field === 'discountPercent') {
          const qty = field === 'quantity' ? Number(value) : Number(it.quantity);
          const price = field === 'unitPrice' ? Number(value) : Number(it.unitPrice);
          const lineDiscountPercent = field === 'discountPercent' ? Number(value) : Number(it.discountPercent || 0);
          const gross = Math.max(0, (qty || 0) * (price || 0));
          updated.amount = Math.max(0, gross - (gross * Math.max(0, Math.min(100, lineDiscountPercent || 0)) / 100));
        }
        return updated;
      })
    );
  };

  // Calculations
  const subtotal = items.reduce((sum, it) => sum + (it.amount || 0), 0);
  const discountAmount = (subtotal * (discountPercent || 0)) / 100;
  const taxableBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableBase * (taxPercent || 0)) / 100;
  const totalAmount = taxableBase + taxAmount;

  // Save Invoice
  const handleSave = async (status: 'draft' | 'sent') => {
    setError('');
    const selectedCustomer = customers.find((c) => c.id === customerId);
    if (!selectedCustomer) {
      alert('Please select or add a customer for this invoice.');
      return;
    }

    if (!items.length || items.some((i) => !i.description.trim())) {
      alert('Please provide descriptions for all line items.');
      return;
    }

    try {
      if (invoiceToEdit) {
        await updateInvoice(invoiceToEdit.id, {
        invoiceNumber,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerEmail: selectedCustomer.email,
        issueDate,
        dueDate,
        currency,
        subtotal,
        discountPercent,
        discountAmount,
        taxPercent,
        taxAmount,
        totalAmount,
        balanceDue: Math.max(0, totalAmount - (invoiceToEdit.paidAmount || 0)),
        notes,
        terms,
        items,
        status: invoiceToEdit.status === 'draft' && status === 'sent' ? 'sent' : invoiceToEdit.status,
      });
      } else {
        await addInvoice({
          invoiceNumber,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email,
          issueDate,
          dueDate,
          currency,
          subtotal,
          discountPercent,
          discountAmount,
          taxPercent,
          taxAmount,
          totalAmount,
          notes,
          terms,
          items,
          status,
        });
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save the invoice.');
    }
  };

  // Quick Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName) return;
    try {
      const created = await addCustomer({
        name: newCustName,
        email: newCustEmail,
        company: newCustCompany,
        currency,
      });
      setCustomerId(created.id);
      setShowAddCustomer(false);
      setNewCustName('');
      setNewCustEmail('');
      setNewCustCompany('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the customer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                {invoiceToEdit ? `Edit Invoice: ${invoiceToEdit.invoiceNumber}` : 'Create New Invoice'}
              </h3>
              <p className="text-xs text-slate-500">Configure client details, terms, and itemized billing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800">{error}</div>}
          {/* Top Row: Invoice #, Customer, Dates, Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-slate-700">Customer</label>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(true)}
                  className="text-blue-600 hover:underline font-bold text-[11px]"
                >
                  + New
                </button>
              </div>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issue Date</label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Inline Add Customer Drawer if opened */}
          {showAddCustomer && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 animate-fade-in">
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-900">Add New Customer</span>
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="text-blue-700 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Customer / Contact Name *"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs"
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleCreateCustomer}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs"
                >
                  Save &amp; Select Customer
                </button>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center pb-1 border-b border-slate-200">
              <h4 className="font-bold text-sm text-slate-800">Itemized Charges</h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="col-span-12 sm:col-span-6">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5 sm:hidden">Description</label>
                    <input
                      type="text"
                      required
                      placeholder="Service or product description..."
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5 sm:hidden">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5 sm:hidden">Unit Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-right font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-1 text-right font-bold text-slate-900 pr-1">
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5 sm:hidden">Total</label>
                    {formatCurrency(item.amount, currency)}
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary & Taxes Bottom Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            {/* Notes & Terms */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes to Customer</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thank you for your business..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Terms &amp; Payment Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Payment due within 30 days..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Calculations Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">{formatCurrency(subtotal, currency)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Discount</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs"
                  />
                  <span>%</span>
                </div>
                <span className="text-rose-600">-{formatCurrency(discountAmount, currency)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span>Tax Rate</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="w-12 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs"
                  />
                  <span>%</span>
                </div>
                <span className="font-medium text-slate-800">+{formatCurrency(taxAmount, currency)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Grand Total</span>
                <span className="text-blue-600">{formatCurrency(totalAmount, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSave('draft')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('sent')}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
          >
            Finalize &amp; Issue Invoice
          </button>
        </div>
      </div>
    </div>
  );
};
