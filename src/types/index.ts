export type MemberRole = 'owner' | 'admin' | 'accountant' | 'staff';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  activeOrgId?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  taxId?: string;
  currency: string;
  paymentTermsDays: number;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  invoiceNotes?: string;
  invoiceTerms?: string;
  createdBy: string;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  orgId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  role: MemberRole;
  status?: 'active' | 'invited';
  joinedAt: string;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  currency?: string;
  paymentTermsDays?: number;
  billingAddress?: string;
  city?: string;
  country?: string;
  notes?: string;
  outstandingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Vendor {
  id: string;
  orgId: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  category: ExpenseCategory;
  address?: string;
  notes?: string;
  totalExpenses: number;
  createdAt: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxRatePercent?: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  orgId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  recurringId?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}

export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'paypal' | 'cash' | 'check' | 'stripe_test';

export interface Payment {
  id: string;
  orgId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export type ExpenseCategory =
  | 'travel'
  | 'meals'
  | 'software'
  | 'office'
  | 'advertising'
  | 'utilities'
  | 'consulting'
  | 'equipment'
  | 'other';

export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Expense {
  id: string;
  orgId: string;
  vendorId?: string;
  vendorName?: string;
  category: ExpenseCategory;
  description: string;
  expenseDate: string;
  amount: number;
  taxAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  isReimbursable: boolean;
  status: ExpenseStatus;
  receiptUrl?: string;
  receiptName?: string;
  notes?: string;
  isRecurring?: boolean;
  recurringInterval?: 'monthly' | 'yearly';
  createdAt: string;
  createdBy?: string;
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringInvoice {
  id: string;
  orgId: string;
  templateInvoiceNumber: string;
  customerId: string;
  customerName: string;
  frequency: RecurringFrequency;
  nextRunDate: string;
  lastRunDate?: string;
  occurrences: number;
  maxOccurrences?: number;
  status: 'active' | 'paused' | 'completed';
  currency: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  orgId: string;
  userId?: string;
  title: string;
  message: string;
  type: 'invoice_due' | 'invoice_overdue' | 'payment_received' | 'expense_approval' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  orgId: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: 'invoice' | 'expense' | 'payment' | 'customer' | 'vendor' | 'organization' | 'team';
  entityId: string;
  details: string;
  createdAt: string;
}

export interface FinancialSummary {
  totalInvoiced: number;
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  totalExpenses: number;
  netIncome: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  unpaidInvoiceCount: number;
  overdueInvoiceCount: number;
  expenseCount: number;
}
