import { auth } from './firebase.ts';
import {
  ActivityLog,
  Customer,
  Expense,
  FinancialSummary,
  Invoice,
  Organization,
  OrganizationMember,
  Payment,
  PaymentMethod,
  RecurringInvoice,
  UserProfile,
  Vendor,
  MemberRole,
} from '../types/index.ts';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface AuthBootstrapResponse {
  user: UserProfile;
  organizations: Organization[];
  memberships: OrganizationMember[];
  isPlatformAdmin: boolean;
  pendingInvitations: Array<{ orgId: string; organizationName: string; role: MemberRole }>;
}

async function request<T>(path: string, options: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');

  if (authenticated) {
    const user = auth.currentUser;
    if (!user) throw new ApiError('Authentication is required.', 401);
    const token = await user.getIdToken();
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  let body: unknown = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }
  }

  if (!response.ok) {
    const record = body && typeof body === 'object' ? body as { error?: string; message?: string } : undefined;
    throw new ApiError(record?.message || record?.error || `Request failed with status ${response.status}.`, response.status, body);
  }

  return body as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const api = {
  async getMe(): Promise<AuthBootstrapResponse> {
    return request<AuthBootstrapResponse>('/auth/me');
  },

  async bootstrap(): Promise<AuthBootstrapResponse> {
    return request<AuthBootstrapResponse>('/auth/bootstrap', json('POST'));
  },

  async getHealth() {
    return request<{ status: string; database: string; connected: boolean }>('/health', {}, false);
  },

  async sendContact(payload: { name: string; email: string; subject?: string; message: string }) {
    return request<{ success: boolean; messageId: string }>('/contact', json('POST', payload), false);
  },

  async getHealthDetails() {
    return request<{
      status: string;
      database?: string;
      postgres_version?: string;
      connected: boolean;
      stats?: Record<string, number>;
    }>('/health/details');
  },

  async getAdminOverview() {
    return request<{
      organizations: Array<Organization & {
        activeMemberCount: number;
        invoiceCount: number;
        customerCount: number;
        paymentCount: number;
        expenseCount: number;
      }>;
      counts: Record<string, number>;
    }>('/admin/overview');
  },

  async createOrganization(name: string, currency: string) {
    return request<Organization>('/organizations', json('POST', { name, currency }));
  },

  async getOrganization(orgId: string) {
    return request<Organization>(`/organizations/${encodeURIComponent(orgId)}`);
  },

  async updateOrganization(orgId: string, updates: Partial<Organization>) {
    return request<Organization>(`/organizations/${encodeURIComponent(orgId)}`, json('PUT', updates));
  },

  async getSummary(orgId: string) {
    return request<FinancialSummary & { totalRevenue?: number; totalCollected?: number; outstandingBalance?: number; netProfit?: number; customerCount?: number; paymentCount?: number }>(`/organizations/${encodeURIComponent(orgId)}/summary`);
  },

  async getMembers(orgId: string) {
    return request<OrganizationMember[]>(`/organizations/${encodeURIComponent(orgId)}/members`);
  },

  async inviteMember(orgId: string, email: string, role: MemberRole, name?: string) {
    return request<{ member: OrganizationMember; invitationUrl: string; sent: boolean; message: string }>(
      `/organizations/${encodeURIComponent(orgId)}/members/invitations`,
      json('POST', { email, role, name }),
    );
  },

  async updateMember(orgId: string, memberId: string, role: MemberRole) {
    return request<OrganizationMember>(
      `/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(memberId)}`,
      json('PUT', { role }),
    );
  },

  async removeMember(orgId: string, memberId: string) {
    return request<{ message: string }>(
      `/organizations/${encodeURIComponent(orgId)}/members/${encodeURIComponent(memberId)}`,
      { method: 'DELETE' },
    );
  },

  async acceptInvitation(orgId: string, token: string) {
    return request<OrganizationMember>(
      `/organizations/${encodeURIComponent(orgId)}/invitations/accept`,
      json('POST', { token }),
    );
  },

  async loadSampleData(orgId: string) {
    return request<Record<string, number>>(`/organizations/${encodeURIComponent(orgId)}/sample-data`, json('POST'));
  },

  async getCustomers(orgId: string) {
    return request<Customer[]>(`/customers?org_id=${encodeURIComponent(orgId)}`);
  },

  async getCustomer(id: string) {
    return request<Customer>(`/customers/${encodeURIComponent(id)}`);
  },

  async createCustomer(customer: Omit<Customer, 'id' | 'orgId' | 'createdAt' | 'outstandingBalance' | 'totalInvoiced' | 'totalPaid'> & { orgId: string }) {
    return request<Customer>('/customers', json('POST', customer));
  },

  async updateCustomer(id: string, updates: Partial<Customer>) {
    return request<Customer>(`/customers/${encodeURIComponent(id)}`, json('PUT', updates));
  },

  async deleteCustomer(id: string) {
    return request<{ message: string }>(`/customers/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getVendors(orgId: string) {
    return request<Vendor[]>(`/vendors?org_id=${encodeURIComponent(orgId)}`);
  },

  async createVendor(vendor: Omit<Vendor, 'id' | 'orgId' | 'createdAt' | 'totalExpenses'> & { orgId: string }) {
    return request<Vendor>('/vendors', json('POST', vendor));
  },

  async updateVendor(id: string, updates: Partial<Vendor>) {
    return request<Vendor>(`/vendors/${encodeURIComponent(id)}`, json('PUT', updates));
  },

  async deleteVendor(id: string) {
    return request<{ message: string }>(`/vendors/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async getInvoices(orgId: string, params: { status?: string; customerId?: string } = {}) {
    const query = new URLSearchParams({ org_id: orgId });
    if (params.status) query.set('status', params.status);
    if (params.customerId) query.set('customer_id', params.customerId);
    return request<Invoice[]>(`/invoices?${query.toString()}`);
  },

  async getInvoice(id: string) {
    return request<Invoice>(`/invoices/${encodeURIComponent(id)}`);
  },

  async createInvoice(invoice: Partial<Invoice> & { orgId: string; customerId: string; items: Invoice['items'] }) {
    return request<Invoice>('/invoices', json('POST', invoice));
  },

  async updateInvoice(id: string, updates: Partial<Invoice>) {
    return request<Invoice>(`/invoices/${encodeURIComponent(id)}`, json('PUT', updates));
  },

  async deleteInvoice(id: string) {
    return request<{ message: string }>(`/invoices/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async duplicateInvoice(id: string) {
    return request<Invoice>(`/invoices/${encodeURIComponent(id)}/duplicate`, json('POST'));
  },

  async sendInvoiceEmail(id: string, payload: {
    recipientEmail: string;
    subject: string;
    bodyText: string;
    customNote?: string;
    attachedFilename: string;
    pdfBase64: string;
  }) {
    return request<{
      success: boolean;
      messageId: string;
      recipientEmail: string;
      sentAt: string;
      attachedFilename: string;
    }>(`/invoices/${encodeURIComponent(id)}/email`, json('POST', payload));
  },

  async getPayments(orgId: string, invoiceId?: string) {
    const query = new URLSearchParams({ org_id: orgId });
    if (invoiceId) query.set('invoice_id', invoiceId);
    return request<Payment[]>(`/payments?${query.toString()}`);
  },

  async recordPayment(payment: Omit<Payment, 'id' | 'orgId' | 'createdAt'> & { invoiceId: string; amount: number; paymentMethod: PaymentMethod; paymentDate: string }) {
    return request<Payment>('/payments', json('POST', payment));
  },

  async recordBatchPayments(entries: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    reference?: string;
    notes?: string;
  }[]) {
    return request<{ message: string; count: number; payments: Payment[] }>('/payments/batch', json('POST', { entries }));
  },

  async getExpenses(orgId: string) {
    return request<Expense[]>(`/expenses?org_id=${encodeURIComponent(orgId)}`);
  },

  async getExpense(id: string) {
    return request<Expense>(`/expenses/${encodeURIComponent(id)}`);
  },

  async createExpense(expense: Omit<Expense, 'id' | 'orgId' | 'createdAt'> & { orgId: string }) {
    return request<Expense>('/expenses', json('POST', expense));
  },

  async updateExpense(id: string, updates: Partial<Expense>) {
    return request<Expense>(`/expenses/${encodeURIComponent(id)}`, json('PUT', updates));
  },

  async deleteExpense(id: string) {
    return request<{ message: string }>(`/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async setExpenseStatus(id: string, status: Expense['status']) {
    return request<Expense>(`/expenses/${encodeURIComponent(id)}/status`, json('POST', { status }));
  },

  async getRecurring(orgId: string) {
    return request<RecurringInvoice[]>(`/recurring?org_id=${encodeURIComponent(orgId)}`);
  },

  async createRecurring(recurring: Omit<RecurringInvoice, 'id' | 'orgId' | 'createdAt'> & { orgId: string }) {
    return request<RecurringInvoice>('/recurring', json('POST', recurring));
  },

  async updateRecurring(id: string, updates: Partial<RecurringInvoice>) {
    return request<RecurringInvoice>(`/recurring/${encodeURIComponent(id)}`, json('PUT', updates));
  },

  async deleteRecurring(id: string) {
    return request<{ message: string }>(`/recurring/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  async runRecurring(orgId: string) {
    return request<{ count: number; invoices: Invoice[] }>('/recurring/run', json('POST', { orgId }));
  },

  async getActivities(orgId: string, limit = 100) {
    return request<ActivityLog[]>(`/activities?org_id=${encodeURIComponent(orgId)}&limit=${limit}`);
  },

  async createActivity(payload: { orgId: string; action: string; entityType?: string; entityId?: string; details?: string }) {
    return request<ActivityLog>('/activities', json('POST', payload));
  },
};
