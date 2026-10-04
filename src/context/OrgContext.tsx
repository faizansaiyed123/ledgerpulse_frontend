import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.ts';
import { useAuth } from './AuthContext.tsx';
import {
  ActivityLog,
  Customer,
  Expense,
  FinancialSummary,
  Invoice,
  InvoiceItem,
  MemberRole,
  Organization,
  OrganizationMember,
  Payment,
  PaymentMethod,
  RecurringInvoice,
  Vendor,
} from '../types/index.ts';
import { getSampleSeedData } from '../lib/mockSeed.ts';

interface OrgContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  currentMember: OrganizationMember | null;
  userRole: MemberRole;
  isPlatformAdmin: boolean;
  canManageOrg: boolean;
  canEditFinancials: boolean;
  canRecordPayments: boolean;
  canApproveExpenses: boolean;
  customers: Customer[];
  vendors: Vendor[];
  invoices: Invoice[];
  expenses: Expense[];
  payments: Payment[];
  recurringInvoices: RecurringInvoice[];
  activityLogs: ActivityLog[];
  teamMembers: OrganizationMember[];
  financialSummary: FinancialSummary;
  loading: boolean;
  error: string | null;
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (name: string, currency: string) => Promise<Organization>;
  updateOrganization: (updates: Partial<Organization>) => Promise<void>;
  loadSampleData: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'orgId' | 'createdAt' | 'paidAmount' | 'balanceDue'>) => Promise<Invoice>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  duplicateInvoice: (id: string) => Promise<Invoice>;
  recordPayment: (payment: Omit<Payment, 'id' | 'orgId' | 'createdAt'>) => Promise<Payment>;
  recordBatchPayments: (entries: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }[]) => Promise<Payment[]>;
  addExpense: (expense: Omit<Expense, 'id' | 'orgId' | 'createdAt'>) => Promise<Expense>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  approveExpense: (id: string) => Promise<void>;
  rejectExpense: (id: string) => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id' | 'orgId' | 'createdAt' | 'outstandingBalance' | 'totalInvoiced' | 'totalPaid'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addVendor: (vendor: Omit<Vendor, 'id' | 'orgId' | 'createdAt' | 'totalExpenses'>) => Promise<Vendor>;
  updateVendor: (id: string, updates: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addRecurringInvoice: (rec: Omit<RecurringInvoice, 'id' | 'orgId' | 'createdAt'>) => Promise<RecurringInvoice>;
  updateRecurringInvoice: (id: string, updates: Partial<RecurringInvoice>) => Promise<void>;
  deleteRecurringInvoice: (id: string) => Promise<void>;
  triggerRecurringBatch: () => Promise<number>;
  inviteMember: (email: string, role: MemberRole, name?: string) => Promise<{ invitationUrl: string; sent: boolean; message: string }>;
  updateMemberRole: (memberId: string, role: MemberRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  logActivity: (action: string, entityType: ActivityLog['entityType'], entityId: string, details: string) => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

interface DemoData {
  organization: Organization;
  members: OrganizationMember[];
  customers: Customer[];
  vendors: Vendor[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  recurring: RecurringInvoice[];
  activity: ActivityLog[];
}

function safeReadDemoData(key: string): DemoData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as DemoData;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function makeId(prefix: string) {
  const random = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID().replace(/-/g, '')
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}

function nextDemoInvoiceNumber(invoices: Invoice[], year: number): string {
  const pattern = new RegExp(`^INV-${year}-(\\d+)$`);
  const max = invoices.reduce((highest, invoice) => {
    const match = pattern.exec(invoice.invoiceNumber);
    return Math.max(highest, match ? Number(match[1]) : 0);
  }, 0);
  return `INV-${year}-${String(max + 1).padStart(3, '0')}`;
}

function calculateDemoInvoice(invoice: Invoice): Invoice {
  const subtotal = invoice.items.reduce((sum, item) => {
    const lineGross = item.quantity * item.unitPrice;
    const lineDiscount = lineGross * (item.discountPercent || 0) / 100;
    return sum + Math.max(0, lineGross - lineDiscount);
  }, 0);
  const discountAmount = subtotal * (invoice.discountPercent || 0) / 100;
  const taxable = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxable * (invoice.taxPercent || 0) / 100;
  const totalAmount = taxable + taxAmount;
  const paidAmount = Math.min(invoice.paidAmount || 0, totalAmount);
  return {
    ...invoice,
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    paidAmount: Number(paidAmount.toFixed(2)),
    balanceDue: Number(Math.max(0, totalAmount - paidAmount).toFixed(2)),
    status: invoice.status === 'cancelled'
      ? 'cancelled'
      : paidAmount >= totalAmount && totalAmount > 0
        ? 'paid'
        : paidAmount > 0
          ? 'partially_paid'
          : invoice.status,
  };
}

export const OrgProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isDemo } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentMember, setCurrentMember] = useState<OrganizationMember | null>(null);
  const [teamMembers, setTeamMembers] = useState<OrganizationMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  const demoStorageKey = currentUser ? `lp_demo_data_${currentUser.uid}` : null;

  const persistDemoData = (data: DemoData) => {
    if (!demoStorageKey) return;
    localStorage.setItem(demoStorageKey, JSON.stringify(data));
  };

  const applyDemoData = (data: DemoData) => {
    setCurrentOrg(data.organization);
    setOrganizations([data.organization]);
    const member = data.members.find((m) => m.userId === currentUser?.uid) || data.members[0] || null;
    setCurrentMember(member);
    setTeamMembers(data.members);
    setCustomers(data.customers);
    setVendors(data.vendors);
    setInvoices(data.invoices.map(calculateDemoInvoice));
    setExpenses(data.expenses);
    setPayments(data.payments);
    setRecurringInvoices(data.recurring);
    setActivityLogs(data.activity);
  };

  const loadOrgData = async (orgId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [org, members, customerRows, vendorRows, invoiceRows, expenseRows, paymentRows, recurringRows, activityRows] = await Promise.all([
        api.getOrganization(orgId),
        api.getMembers(orgId),
        api.getCustomers(orgId),
        api.getVendors(orgId),
        api.getInvoices(orgId),
        api.getExpenses(orgId),
        api.getPayments(orgId),
        api.getRecurring(orgId),
        api.getActivities(orgId),
      ]);
      setCurrentOrg(org);
      setOrganizations((prev) => prev.some((item) => item.id === org.id) ? prev.map((item) => item.id === org.id ? org : item) : [...prev, org]);
      setTeamMembers(members);
      setCurrentMember(members.find((member) => member.userId === currentUser?.uid) || null);
      setCustomers(customerRows);
      setVendors(vendorRows);
      setInvoices(invoiceRows);
      setExpenses(expenseRows);
      setPayments(paymentRows);
      setRecurringInvoices(recurringRows);
      setActivityLogs(activityRows);
    } catch (err) {
      console.error('Failed to load organization data', err);
      const message = err instanceof Error ? err.message : 'Unable to load organization data.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      if (!currentUser) {
        setCurrentOrg(null);
        setOrganizations([]);
        setCurrentMember(null);
        setTeamMembers([]);
        setCustomers([]);
        setVendors([]);
        setInvoices([]);
        setExpenses([]);
        setPayments([]);
        setRecurringInvoices([]);
        setActivityLogs([]);
        setIsPlatformAdmin(false);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      if (isDemo) {
        const seed = getSampleSeedData(`demo_org_${currentUser.uid}`, currentUser.uid, currentUser.email);
        const persisted = demoStorageKey ? safeReadDemoData(demoStorageKey) : null;
        if (!cancelled) applyDemoData(persisted || seed);
        if (!persisted && demoStorageKey) persistDemoData(seed);
        setIsPlatformAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const session = await api.getMe();
        if (cancelled) return;
        setIsPlatformAdmin(session.isPlatformAdmin);
        setOrganizations(session.organizations);
        setTeamMembers(session.memberships.length ? session.memberships : []);
        const savedOrgId = localStorage.getItem(`lp_active_org_${currentUser.uid}`);
        const selected = session.organizations.find((org) => org.id === savedOrgId) || session.organizations[0] || null;
        if (!selected) throw new Error('Your account is not a member of any organization.');
        setCurrentOrg(selected);
        setCurrentMember(session.memberships.find((member) => member.orgId === selected.id) || null);
        localStorage.setItem(`lp_active_org_${currentUser.uid}`, selected.id);
        await loadOrgData(selected.id);
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to initialize LedgerPulse session', err);
          setError(err instanceof Error ? err.message : 'Unable to initialize your workspace.');
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => { cancelled = true; };
    // demoStorageKey is derived only from the authenticated UID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, isDemo]);

  const updateDemo = (updater: (data: DemoData) => DemoData) => {
    if (!currentOrg || !currentUser || !demoStorageKey) throw new Error('Demo session is not available');
    const current: DemoData = {
      organization: currentOrg,
      members: teamMembers,
      customers,
      vendors,
      invoices,
      payments,
      expenses,
      recurring: recurringInvoices,
      activity: activityLogs,
    };
    const next = updater(current);
    persistDemoData(next);
    applyDemoData(next);
  };

  const switchOrganization = async (orgId: string) => {
    if (isDemo) return;
    const org = organizations.find((item) => item.id === orgId);
    if (!org) throw new Error('You do not have access to that organization.');
    setCurrentOrg(org);
    if (currentUser) localStorage.setItem(`lp_active_org_${currentUser.uid}`, org.id);
    await loadOrgData(org.id);
  };

  const createOrganization = async (name: string, currency: string) => {
    if (!currentUser) throw new Error('Authentication is required.');
    if (isDemo) {
      const org: Organization = {
        id: makeId('demo_org'),
        name: name.trim(),
        currency,
        paymentTermsDays: 30,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
      };
      const member: OrganizationMember = {
        id: makeId('mem'),
        orgId: org.id,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName,
        role: 'owner',
        status: 'active',
        joinedAt: org.createdAt,
      };
      const empty: DemoData = { organization: org, members: [member], customers: [], vendors: [], invoices: [], payments: [], expenses: [], recurring: [], activity: [] };
      persistDemoData(empty);
      applyDemoData(empty);
      return org;
    }
    const org = await api.createOrganization(name, currency);
    const nextOrganizations = [...organizations, org];
    setOrganizations(nextOrganizations);
    setCurrentOrg(org);
    localStorage.setItem(`lp_active_org_${currentUser.uid}`, org.id);
    await loadOrgData(org.id);
    return org;
  };

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!currentOrg) throw new Error('No active organization');
    if (isDemo) {
      updateDemo((data) => ({ ...data, organization: { ...data.organization, ...updates, updatedAt: new Date().toISOString() } }));
      return;
    }
    const updated = await api.updateOrganization(currentOrg.id, updates);
    setCurrentOrg(updated);
    setOrganizations((prev) => prev.map((org) => org.id === updated.id ? updated : org));
    setError(null);
  };

  const loadSampleData = async () => {
    if (!currentOrg || !currentUser) return;
    if (isDemo) {
      const seed = getSampleSeedData(currentOrg.id, currentUser.uid, currentUser.email);
      persistDemoData(seed);
      applyDemoData(seed);
      return;
    }
    await api.loadSampleData(currentOrg.id);
    await loadOrgData(currentOrg.id);
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'orgId' | 'createdAt' | 'paidAmount' | 'balanceDue'>) => {
    if (!currentOrg || !currentUser) throw new Error('No active organization');
    if (!canEditFinancials) throw new Error('You do not have permission to create invoices.');
    if (isDemo) {
      const invoice = calculateDemoInvoice({
        ...invoiceData,
        id: makeId('inv'),
        orgId: currentOrg.id,
        paidAmount: 0,
        balanceDue: invoiceData.totalAmount || 0,
        createdAt: new Date().toISOString(),
      });
      updateDemo((data) => ({ ...data, invoices: [invoice, ...data.invoices], activity: [{
        id: makeId('act'), orgId: currentOrg.id, userId: currentUser.uid, userEmail: currentUser.email, action: `Created Invoice ${invoice.invoiceNumber}`, entityType: 'invoice', entityId: invoice.id, details: `Invoice created for ${invoice.customerName}`, createdAt: new Date().toISOString(),
      }, ...data.activity] }));
      return invoice;
    }
    const invoice = await api.createInvoice({ ...invoiceData, orgId: currentOrg.id });
    setInvoices((prev) => [invoice, ...prev]);
    return invoice;
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    if (!currentOrg || !currentUser) return;
    if (!canEditFinancials) throw new Error('You do not have permission to edit invoices.');
    if (isDemo) {
      updateDemo((data) => ({
        ...data,
        invoices: data.invoices.map((invoice) => invoice.id === id ? calculateDemoInvoice({ ...invoice, ...updates, updatedAt: new Date().toISOString() }) : invoice),
      }));
      return;
    }
    const invoice = await api.updateInvoice(id, updates);
    setInvoices((prev) => prev.map((item) => item.id === invoice.id ? invoice : item));
  };

  const deleteInvoice = async (id: string) => {
    if (!currentOrg) return;
    if (!canManageOrg) throw new Error('You do not have permission to delete invoices.');
    if (isDemo) {
      updateDemo((data) => ({ ...data, invoices: data.invoices.filter((invoice) => invoice.id !== id), payments: data.payments.filter((payment) => payment.invoiceId !== id) }));
      return;
    }
    await api.deleteInvoice(id);
    setInvoices((prev) => prev.filter((invoice) => invoice.id !== id));
    setPayments((prev) => prev.filter((payment) => payment.invoiceId !== id));
  };

  const duplicateInvoice = async (id: string) => {
    if (!canEditFinancials) throw new Error('You do not have permission to duplicate invoices.');
    const original = invoices.find((invoice) => invoice.id === id);
    if (!original) throw new Error('Invoice not found');
    if (!currentOrg || !currentUser) throw new Error('No active organization');
    if (isDemo) {
      const copy = calculateDemoInvoice({
        ...original,
        id: makeId('inv'),
        invoiceNumber: nextDemoInvoiceNumber(invoices, new Date().getFullYear()),
        issueDate: new Date().toISOString().split('T')[0],
        status: 'draft',
        paidAmount: 0,
        balanceDue: original.totalAmount,
        createdAt: new Date().toISOString(),
      });
      updateDemo((data) => ({ ...data, invoices: [copy, ...data.invoices] }));
      return copy;
    }
    const copy = await api.duplicateInvoice(id);
    setInvoices((prev) => [copy, ...prev]);
    return copy;
  };

  const recordPayment = async (paymentData: Omit<Payment, 'id' | 'orgId' | 'createdAt'>) => {
    if (!currentOrg || !currentUser) throw new Error('No active organization');
    if (!canRecordPayments) throw new Error('You do not have permission to record payments.');
    if (isDemo) {
      const invoice = invoices.find((item) => item.id === paymentData.invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      if (paymentData.amount <= 0 || paymentData.amount > invoice.balanceDue) throw new Error('Payment amount exceeds the remaining invoice balance.');
      const payment: Payment = { ...paymentData, id: makeId('pay'), orgId: currentOrg.id, createdAt: new Date().toISOString() };
      updateDemo((data) => ({
        ...data,
        payments: [payment, ...data.payments],
        invoices: data.invoices.map((item) => item.id === invoice.id ? calculateDemoInvoice({ ...item, paidAmount: item.paidAmount + payment.amount }) : item),
      }));
      return payment;
    }
    const payment = await api.recordPayment({ ...paymentData, orgId: currentOrg.id });
    const updatedInvoice = await api.getInvoice(payment.invoiceId);
    setPayments((prev) => [payment, ...prev]);
    setInvoices((prev) => prev.map((invoice) => invoice.id === updatedInvoice.id ? updatedInvoice : invoice));
    return payment;
  };

  const recordBatchPayments = async (entries: { invoiceId: string; amount: number; paymentMethod: PaymentMethod; paymentDate: string; reference?: string; notes?: string }[]) => {
    if (!currentOrg) throw new Error('No active organization');
    if (!canRecordPayments) throw new Error('You do not have permission to record payments.');
    if (!entries.length) throw new Error('Select at least one invoice.');
    if (isDemo) {
      const selected = entries.map((entry) => {
        const invoice = invoices.find((item) => item.id === entry.invoiceId);
        if (!invoice) throw new Error('One or more invoices could not be found.');
        if (entry.amount <= 0 || entry.amount > invoice.balanceDue) throw new Error(`Payment exceeds the remaining balance for ${invoice.invoiceNumber}.`);
        return { invoice, entry };
      });
      const created: Payment[] = selected.map(({ invoice, entry }) => ({ ...entry, id: makeId('pay'), orgId: currentOrg.id, invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, customerId: invoice.customerId, customerName: invoice.customerName, createdAt: new Date().toISOString() }));
      updateDemo((data) => ({
        ...data,
        payments: [...created, ...data.payments],
        invoices: data.invoices.map((invoice) => {
          const added = created.filter((payment) => payment.invoiceId === invoice.id).reduce((sum, payment) => sum + payment.amount, 0);
          return added ? calculateDemoInvoice({ ...invoice, paidAmount: invoice.paidAmount + added }) : invoice;
        }),
      }));
      return created;
    }
    const result = await api.recordBatchPayments(entries);
    const refreshedInvoices = await api.getInvoices(currentOrg.id);
    setPayments((prev) => [...result.payments, ...prev.filter((payment) => !result.payments.some((created) => created.id === payment.id))]);
    setInvoices(refreshedInvoices);
    return result.payments;
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'orgId' | 'createdAt'>) => {
    if (!currentOrg || !currentUser) throw new Error('No active organization');
    if (isDemo) {
      const expense: Expense = { ...expenseData, id: makeId('exp'), orgId: currentOrg.id, createdAt: new Date().toISOString() };
      if (currentMember?.role === 'staff') expense.status = 'pending';
      updateDemo((data) => ({ ...data, expenses: [expense, ...data.expenses] }));
      return expense;
    }
    const expense = await api.createExpense({ ...expenseData, orgId: currentOrg.id });
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!currentOrg) return;
    if (isDemo) {
      updateDemo((data) => ({ ...data, expenses: data.expenses.map((expense) => expense.id === id ? { ...expense, ...updates } : expense) }));
      return;
    }
    const expense = await api.updateExpense(id, updates);
    setExpenses((prev) => prev.map((item) => item.id === expense.id ? expense : item));
  };

  const deleteExpense = async (id: string) => {
    if (!currentOrg) return;
    if (isDemo) {
      updateDemo((data) => ({ ...data, expenses: data.expenses.filter((expense) => expense.id !== id) }));
      return;
    }
    await api.deleteExpense(id);
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const setExpenseStatus = async (id: string, status: Expense['status']) => {
    if (!currentOrg) return;
    if (isDemo) {
      updateDemo((data) => ({ ...data, expenses: data.expenses.map((expense) => expense.id === id ? { ...expense, status } : expense) }));
      return;
    }
    const expense = await api.setExpenseStatus(id, status);
    setExpenses((prev) => prev.map((item) => item.id === expense.id ? expense : item));
  };

  const approveExpense = (id: string) => setExpenseStatus(id, 'approved');
  const rejectExpense = (id: string) => setExpenseStatus(id, 'rejected');

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'orgId' | 'createdAt' | 'outstandingBalance' | 'totalInvoiced' | 'totalPaid'>) => {
    if (!currentOrg || !currentUser) throw new Error('No active organization');
    if (!canEditFinancials) throw new Error('You do not have permission to create customers.');
    if (isDemo) {
      const customer: Customer = { ...customerData, id: makeId('cust'), orgId: currentOrg.id, outstandingBalance: 0, totalInvoiced: 0, totalPaid: 0, createdAt: new Date().toISOString() };
      updateDemo((data) => ({ ...data, customers: [customer, ...data.customers] }));
      return customer;
    }
    const customer = await api.createCustomer({ ...customerData, orgId: currentOrg.id });
    setCustomers((prev) => [customer, ...prev]);
    return customer;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    if (!currentOrg) return;
    if (!canEditFinancials) throw new Error('You do not have permission to edit customers.');
    if (isDemo) {
      updateDemo((data) => ({ ...data, customers: data.customers.map((customer) => customer.id === id ? { ...customer, ...updates, updatedAt: new Date().toISOString() } : customer) }));
      return;
    }
    const customer = await api.updateCustomer(id, updates);
    setCustomers((prev) => prev.map((item) => item.id === customer.id ? customer : item));
  };

  const deleteCustomer = async (id: string) => {
    if (!currentOrg) return;
    if (!canManageOrg) throw new Error('You do not have permission to delete customers.');
    const hasInvoices = invoices.some((invoice) => invoice.customerId === id);
    if (hasInvoices) throw new Error('Customers with invoices cannot be deleted. Remove or reassign their invoices first.');
    if (isDemo) {
      updateDemo((data) => ({ ...data, customers: data.customers.filter((customer) => customer.id !== id) }));
      return;
    }
    await api.deleteCustomer(id);
    setCustomers((prev) => prev.filter((customer) => customer.id !== id));
  };

  const addVendor = async (vendorData: Omit<Vendor, 'id' | 'orgId' | 'createdAt' | 'totalExpenses'>) => {
    if (!currentOrg || !currentUser) throw new Error('No active organization');
    if (!canEditFinancials) throw new Error('You do not have permission to create vendors.');
    if (isDemo) {
      const vendor: Vendor = { ...vendorData, id: makeId('vend'), orgId: currentOrg.id, totalExpenses: 0, createdAt: new Date().toISOString() };
      updateDemo((data) => ({ ...data, vendors: [vendor, ...data.vendors] }));
      return vendor;
    }
    const vendor = await api.createVendor({ ...vendorData, orgId: currentOrg.id });
    setVendors((prev) => [vendor, ...prev]);
    return vendor;
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    if (!currentOrg) return;
    if (!canEditFinancials) throw new Error('You do not have permission to edit vendors.');
    if (isDemo) {
      updateDemo((data) => ({ ...data, vendors: data.vendors.map((vendor) => vendor.id === id ? { ...vendor, ...updates, updatedAt: new Date().toISOString() } : vendor) }));
      return;
    }
    const vendor = await api.updateVendor(id, updates);
    setVendors((prev) => prev.map((item) => item.id === vendor.id ? vendor : item));
  };

  const deleteVendor = async (id: string) => {
    if (!currentOrg) return;
    if (!canManageOrg) throw new Error('You do not have permission to delete vendors.');
    if (expenses.some((expense) => expense.vendorId === id)) throw new Error('Vendors with linked expenses cannot be deleted.');
    if (isDemo) {
      updateDemo((data) => ({ ...data, vendors: data.vendors.filter((vendor) => vendor.id !== id) }));
      return;
    }
    await api.deleteVendor(id);
    setVendors((prev) => prev.filter((vendor) => vendor.id !== id));
  };

  const addRecurringInvoice = async (recData: Omit<RecurringInvoice, 'id' | 'orgId' | 'createdAt'>) => {
    if (!currentOrg || !currentUser) throw new Error('No active organization');
    if (!canEditFinancials) throw new Error('You do not have permission to create recurring invoices.');
    if (isDemo) {
      const record: RecurringInvoice = { ...recData, id: makeId('rec'), orgId: currentOrg.id, createdAt: new Date().toISOString() };
      updateDemo((data) => ({ ...data, recurring: [record, ...data.recurring] }));
      return record;
    }
    const record = await api.createRecurring({ ...recData, orgId: currentOrg.id });
    setRecurringInvoices((prev) => [record, ...prev]);
    return record;
  };

  const updateRecurringInvoice = async (id: string, updates: Partial<RecurringInvoice>) => {
    if (!currentOrg) return;
    if (!canEditFinancials) throw new Error('You do not have permission to edit recurring invoices.');
    if (isDemo) {
      updateDemo((data) => ({ ...data, recurring: data.recurring.map((record) => record.id === id ? { ...record, ...updates } : record) }));
      return;
    }
    const record = await api.updateRecurring(id, updates);
    setRecurringInvoices((prev) => prev.map((item) => item.id === record.id ? record : item));
  };

  const deleteRecurringInvoice = async (id: string) => {
    if (!currentOrg) return;
    if (!canManageOrg) throw new Error('You do not have permission to delete recurring invoices.');
    if (isDemo) {
      updateDemo((data) => ({ ...data, recurring: data.recurring.filter((record) => record.id !== id) }));
      return;
    }
    await api.deleteRecurring(id);
    setRecurringInvoices((prev) => prev.filter((record) => record.id !== id));
  };

  const triggerRecurringBatch = async () => {
    if (!currentOrg || !currentUser) return 0;
    if (!canEditFinancials) throw new Error('You do not have permission to run recurring billing.');
    if (isDemo) {
      const due = recurringInvoices.filter((record) => record.status === 'active' && record.nextRunDate <= new Date().toISOString().split('T')[0]);
      for (const record of due) {
        if (record.maxOccurrences && record.occurrences >= record.maxOccurrences) continue;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + currentOrg.paymentTermsDays);
        const invoice = await addInvoice({
          invoiceNumber: nextDemoInvoiceNumber(invoices, new Date().getFullYear()),
          customerId: record.customerId,
          customerName: record.customerName,
          customerEmail: customers.find((customer) => customer.id === record.customerId)?.email,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'sent',
          currency: record.currency,
          subtotal: record.subtotal,
          discountPercent: 0,
          discountAmount: record.discountAmount,
          taxPercent: record.subtotal ? (record.taxAmount / Math.max(0.01, record.subtotal - record.discountAmount)) * 100 : 0,
          taxAmount: record.taxAmount,
          totalAmount: record.totalAmount,
          notes: record.notes,
          terms: record.terms,
          items: record.items,
          recurringId: record.id,
        });
        const nextDate = new Date(record.nextRunDate);
        if (record.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (record.frequency === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
        else if (record.frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (record.frequency === 'quarterly') nextDate.setMonth(nextDate.getMonth() + 3);
        else nextDate.setFullYear(nextDate.getFullYear() + 1);
        await updateRecurringInvoice(record.id, { occurrences: record.occurrences + 1, lastRunDate: invoice.issueDate, nextRunDate: nextDate.toISOString().split('T')[0], status: record.maxOccurrences && record.occurrences + 1 >= record.maxOccurrences ? 'completed' : 'active' });
      }
      return due.length;
    }
    const result = await api.runRecurring(currentOrg.id);
    if (result.invoices.length) setInvoices((prev) => [...result.invoices, ...prev]);
    const refreshedRecurring = await api.getRecurring(currentOrg.id);
    setRecurringInvoices(refreshedRecurring);
    return result.count;
  };

  const inviteMember = async (email: string, role: MemberRole, name?: string) => {
    if (!currentOrg || !currentUser) throw new Error('No active organization');
    if (!['owner', 'admin'].includes(userRole)) throw new Error('You do not have permission to invite members.');
    if (isDemo) {
      const member: OrganizationMember = { id: makeId('mem'), orgId: currentOrg.id, userId: '', userEmail: email, userName: name || email.split('@')[0], role, status: 'invited', joinedAt: new Date().toISOString() };
      updateDemo((data) => ({ ...data, members: [...data.members, member] }));
      return { invitationUrl: `${window.location.origin}/?invite=demo`, sent: false, message: 'Demo invitation created locally.' };
    }
    const result = await api.inviteMember(currentOrg.id, email, role, name);
    setTeamMembers((prev) => [...prev, result.member]);
    return { invitationUrl: result.invitationUrl, sent: result.sent, message: result.message };
  };

  const updateMemberRole = async (memberId: string, role: MemberRole) => {
    if (!currentOrg) return;
    if (isDemo) {
      updateDemo((data) => ({ ...data, members: data.members.map((member) => member.id === memberId ? { ...member, role } : member) }));
      return;
    }
    const member = await api.updateMember(currentOrg.id, memberId, role);
    setTeamMembers((prev) => prev.map((item) => item.id === member.id ? member : item));
    if (member.userId === currentUser?.uid) setCurrentMember(member);
  };

  const removeMember = async (memberId: string) => {
    if (!currentOrg || !currentUser) return;
    if (memberId === currentMember?.id) throw new Error('You cannot remove your own active membership.');
    if (isDemo) {
      updateDemo((data) => ({ ...data, members: data.members.filter((member) => member.id !== memberId) }));
      return;
    }
    await api.removeMember(currentOrg.id, memberId);
    setTeamMembers((prev) => prev.filter((member) => member.id !== memberId));
  };

  const logActivity = async (action: string, entityType: ActivityLog['entityType'], entityId: string, details: string) => {
    if (!currentOrg || !currentUser) return;
    if (isDemo) {
      const activity: ActivityLog = { id: makeId('act'), orgId: currentOrg.id, userId: currentUser.uid, userEmail: currentUser.email, action, entityType, entityId, details, createdAt: new Date().toISOString() };
      updateDemo((data) => ({ ...data, activity: [activity, ...data.activity] }));
      return;
    }
    const activity = await api.createActivity({ orgId: currentOrg.id, action, entityType, entityId, details });
    setActivityLogs((prev) => [activity, ...prev]);
  };

  const financialSummary = useMemo<FinancialSummary>(() => {
    const today = new Date().toISOString().split('T')[0];
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalOverdue = 0;
    let paidInvoiceCount = 0;
    let unpaidInvoiceCount = 0;
    let overdueInvoiceCount = 0;

    for (const invoice of invoices) {
      if (invoice.status === 'cancelled') continue;
      totalInvoiced += invoice.totalAmount;
      totalPaid += invoice.paidAmount;
      totalUnpaid += invoice.balanceDue;
      if (invoice.status === 'paid') paidInvoiceCount += 1;
      else if ((invoice.status === 'overdue' || invoice.dueDate < today) && invoice.balanceDue > 0) {
        totalOverdue += invoice.balanceDue;
        overdueInvoiceCount += 1;
      } else unpaidInvoiceCount += 1;
    }

    const totalExpenses = expenses.reduce((sum, expense) => expense.status === 'rejected' ? sum : sum + expense.amount, 0);
    return {
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalUnpaid: Number(totalUnpaid.toFixed(2)),
      totalOverdue: Number(totalOverdue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      netIncome: Number((totalPaid - totalExpenses).toFixed(2)),
      invoiceCount: invoices.length,
      paidInvoiceCount,
      unpaidInvoiceCount,
      overdueInvoiceCount,
      expenseCount: expenses.length,
    };
  }, [invoices, expenses]);

  const userRole = currentMember?.role || 'staff';
  const canManageOrg = userRole === 'owner' || userRole === 'admin';
  const canEditFinancials = canManageOrg || userRole === 'accountant';
  const canRecordPayments = canEditFinancials;
  const canApproveExpenses = canEditFinancials;

  return (
    <OrgContext.Provider value={{
      currentOrg,
      organizations,
      currentMember,
      userRole,
      isPlatformAdmin,
      canManageOrg,
      canEditFinancials,
      canRecordPayments,
      canApproveExpenses,
      customers,
      vendors,
      invoices,
      expenses,
      payments,
      recurringInvoices,
      activityLogs,
      teamMembers,
      financialSummary,
      loading,
      error,
      switchOrganization,
      createOrganization,
      updateOrganization,
      loadSampleData,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      duplicateInvoice,
      recordPayment,
      recordBatchPayments,
      addExpense,
      updateExpense,
      deleteExpense,
      approveExpense,
      rejectExpense,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addVendor,
      updateVendor,
      deleteVendor,
      addRecurringInvoice,
      updateRecurringInvoice,
      deleteRecurringInvoice,
      triggerRecurringBatch,
      inviteMember,
      updateMemberRole,
      removeMember,
      logActivity,
    }}>
      {children}
    </OrgContext.Provider>
  );
};

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) throw new Error('useOrg must be used within an OrgProvider');
  return context;
};
