import React, { useState } from 'react';
import {
  Users,
  Briefcase,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  DollarSign,
  Edit,
  Trash2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { Customer, Vendor, ExpenseCategory } from '../../types/index.ts';
import { formatCurrency } from '../../lib/currency.ts';

interface ContactsViewProps {
  initialTab?: 'customers' | 'vendors';
}

export const ContactsView: React.FC<ContactsViewProps> = ({ initialTab = 'customers' }) => {
  const {
    currentOrg,
    customers,
    vendors,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addVendor,
    updateVendor,
    deleteVendor,
    invoices,
    expenses,
    canEditFinancials,
    canManageOrg,
  } = useOrg();

  const [activeTab, setActiveTab] = useState<'customers' | 'vendors'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  // Customer Modal
  const [custModalOpen, setCustModalOpen] = useState(false);
  const [custToEdit, setCustToEdit] = useState<Customer | null>(null);
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCompany, setCustCompany] = useState('');
  const [custTaxId, setCustTaxId] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custTerms, setCustTerms] = useState(30);

  // Vendor Modal
  const [vendModalOpen, setVendModalOpen] = useState(false);
  const [vendToEdit, setVendToEdit] = useState<Vendor | null>(null);
  const [vendName, setVendName] = useState('');
  const [vendEmail, setVendEmail] = useState('');
  const [vendPhone, setVendPhone] = useState('');
  const [vendCategory, setVendCategory] = useState<ExpenseCategory>('software');
  const [vendTaxId, setVendTaxId] = useState('');
  const [vendAddress, setVendAddress] = useState('');

  // Selected for drawer review
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const currency = currentOrg?.currency || 'USD';

  // Open Customer modal
  const handleOpenCustModal = (cust?: Customer) => {
    if (cust) {
      setCustToEdit(cust);
      setCustName(cust.name);
      setCustEmail(cust.email || '');
      setCustPhone(cust.phone || '');
      setCustCompany(cust.company || '');
      setCustTaxId(cust.taxId || '');
      setCustAddress(cust.billingAddress || '');
      setCustTerms(cust.paymentTermsDays || 30);
    } else {
      setCustToEdit(null);
      setCustName('');
      setCustEmail('');
      setCustPhone('');
      setCustCompany('');
      setCustTaxId('');
      setCustAddress('');
      setCustTerms(currentOrg?.paymentTermsDays || 30);
    }
    setCustModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) return;
    if (custToEdit) {
      await updateCustomer(custToEdit.id, {
        name: custName,
        email: custEmail,
        phone: custPhone,
        company: custCompany,
        taxId: custTaxId,
        billingAddress: custAddress,
        paymentTermsDays: Number(custTerms),
      });
    } else {
      await addCustomer({
        name: custName,
        email: custEmail,
        phone: custPhone,
        company: custCompany,
        taxId: custTaxId,
        billingAddress: custAddress,
        paymentTermsDays: Number(custTerms),
        currency,
      });
    }
    setCustModalOpen(false);
  };

  // Open Vendor modal
  const handleOpenVendModal = (vend?: Vendor) => {
    if (vend) {
      setVendToEdit(vend);
      setVendName(vend.name);
      setVendEmail(vend.email || '');
      setVendPhone(vend.phone || '');
      setVendCategory(vend.category);
      setVendTaxId(vend.taxId || '');
      setVendAddress(vend.address || '');
    } else {
      setVendToEdit(null);
      setVendName('');
      setVendEmail('');
      setVendPhone('');
      setVendCategory('software');
      setVendTaxId('');
      setVendAddress('');
    }
    setVendModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendName) return;
    if (vendToEdit) {
      await updateVendor(vendToEdit.id, {
        name: vendName,
        email: vendEmail,
        phone: vendPhone,
        category: vendCategory,
        taxId: vendTaxId,
        address: vendAddress,
      });
    } else {
      await addVendor({
        name: vendName,
        email: vendEmail,
        phone: vendPhone,
        category: vendCategory,
        taxId: vendTaxId,
        address: vendAddress,
      });
    }
    setVendModalOpen(false);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Clients &amp; Vendors Directory</h2>
          <p className="text-xs text-slate-500">Manage business counter-parties, billing details, and outstanding balances</p>
        </div>

        <div className="flex items-center gap-2">
          {canEditFinancials && activeTab === 'customers' ? (
            <button
              onClick={() => handleOpenCustModal()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </button>
          ) : (
            canEditFinancials && <button
              onClick={() => handleOpenVendModal()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher and Search */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'customers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers ({customers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors ${
              activeTab === 'vendors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Vendors ({vendors.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Customers Table View */}
      {activeTab === 'customers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">Customer / Company</th>
                  <th className="py-3 px-4 font-semibold">Contact Email</th>
                  <th className="py-3 px-4 font-semibold">Payment Terms</th>
                  <th className="py-3 px-4 font-semibold">Total Invoiced</th>
                  <th className="py-3 px-4 font-semibold">Outstanding Balance</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No customer records found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const custInvoices = invoices.filter((i) => i.customerId === cust.id);
                    const totalInv = custInvoices.reduce((s, i) => s + i.totalAmount, 0);
                    const balance = custInvoices.reduce((s, i) => s + (i.balanceDue || 0), 0);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{cust.name}</p>
                          {cust.company && <p className="text-[10px] text-slate-500">{cust.company}</p>}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{cust.email || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-600">Net {cust.paymentTermsDays || 30} days</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {formatCurrency(totalInv, cust.currency || currency)}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          {balance > 0 ? (
                            <span className="text-rose-600">{formatCurrency(balance, cust.currency || currency)}</span>
                          ) : (
                            <span className="text-emerald-600">$0.00</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedCustomer(cust)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[10px]"
                            >
                              Statement
                            </button>
                            {canEditFinancials && (
                              <button
                                onClick={() => handleOpenCustModal(cust)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                                title="Edit Customer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canManageOrg && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete customer ${cust.name}?`)) {
                                    deleteCustomer(cust.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                title="Delete Customer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendors Table View */}
      {activeTab === 'vendors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4 font-semibold">Vendor / Supplier</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Contact Email</th>
                  <th className="py-3 px-4 font-semibold">Tax ID / VAT</th>
                  <th className="py-3 px-4 font-semibold">Lifetime Spend</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No vendor records found.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vend) => {
                    const vendExpenses = expenses.filter((e) => e.vendorId === vend.id);
                    const totalSpend = vendExpenses.reduce((s, e) => s + e.amount, 0);

                    return (
                      <tr key={vend.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{vend.name}</td>
                        <td className="py-3.5 px-4 capitalize">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {vend.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{vend.email || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">{vend.taxId || '—'}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {formatCurrency(totalSpend, currency)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedVendor(vend)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[10px]"
                            >
                              Expenses
                            </button>
                            {canEditFinancials && (
                              <button
                                onClick={() => handleOpenVendModal(vend)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
                                title="Edit Vendor"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canManageOrg && (
                              <button
                                onClick={() => {
                                  if (confirm(`Delete vendor ${vend.name}?`)) {
                                    deleteVendor(vend.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                                title="Delete Vendor"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Statement Drawer Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">Customer Financial History &amp; Open Balances</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="font-bold text-slate-400">✕</button>
            </div>

            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoices Issued</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {invoices.filter((i) => i.customerId === selectedCustomer.id).map((inv) => (
                  <div key={inv.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{inv.invoiceNumber}</span>
                      <p className="text-[10px] text-slate-500">Issued: {inv.issueDate} • Due: {inv.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">{formatCurrency(inv.totalAmount, inv.currency)}</p>
                      <p className="text-[10px] font-semibold text-rose-600">Balance: {formatCurrency(inv.balanceDue, inv.currency)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Form Modal */}
      {custModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900">
              {custToEdit ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Billing contact and address information</p>

            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Customer / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={custCompany}
                  onChange={(e) => setCustCompany(e.target.value)}
                  placeholder="Starlight Media Group Inc."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={custEmail}
                    onChange={(e) => setCustEmail(e.target.value)}
                    placeholder="billing@customer.com"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax ID / VAT #</label>
                  <input
                    type="text"
                    value={custTaxId}
                    onChange={(e) => setCustTaxId(e.target.value)}
                    placeholder="US-12-984712"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={custTerms}
                    onChange={(e) => setCustTerms(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Address</label>
                <textarea
                  rows={2}
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Street, City, State, Zip, Country"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCustModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Form Modal */}
      {vendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900">
              {vendToEdit ? 'Edit Vendor' : 'Add New Vendor'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Supplier details and default expense category</p>

            <form onSubmit={handleSaveVendor} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vendor / Company Name *</label>
                <input
                  type="text"
                  required
                  value={vendName}
                  onChange={(e) => setVendName(e.target.value)}
                  placeholder="Amazon Web Services"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Expense Category</label>
                <select
                  value={vendCategory}
                  onChange={(e) => setVendCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={vendEmail}
                    onChange={(e) => setVendEmail(e.target.value)}
                    placeholder="billing@aws.com"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tax ID / VAT</label>
                  <input
                    type="text"
                    value={vendTaxId}
                    onChange={(e) => setVendTaxId(e.target.value)}
                    placeholder="US-91-164686"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVendModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
