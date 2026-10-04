import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { OrgProvider, useOrg } from './context/OrgContext.tsx';
import { NotificationProvider } from './context/NotificationContext.tsx';
import { PublicWebsite } from './components/public/PublicWebsite.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import { AppLayout, ActiveTab } from './components/layout/AppLayout.tsx';
import { Dashboard } from './components/dashboard/Dashboard.tsx';
import { InvoicesList } from './components/invoices/InvoicesList.tsx';
import { InvoiceEditorModal } from './components/invoices/InvoiceEditorModal.tsx';
import { InvoiceDetailModal } from './components/invoices/InvoiceDetailModal.tsx';
import { RecordPaymentModal } from './components/invoices/RecordPaymentModal.tsx';
import { RecurringInvoicesList } from './components/recurring/RecurringInvoicesList.tsx';
import { ExpensesList } from './components/expenses/ExpensesList.tsx';
import { ExpenseEditorModal } from './components/expenses/ExpenseEditorModal.tsx';
import { ContactsView } from './components/contacts/ContactsView.tsx';
import { PaymentsLedger } from './components/payments/PaymentsLedger.tsx';
import { FinancialReports } from './components/reports/FinancialReports.tsx';
import { TeamAndSettings } from './components/settings/TeamAndSettings.tsx';
import { AdminPortal } from './components/admin/AdminPortal.tsx';
import { Expense, Invoice } from './types/index.ts';
import { api, ApiError } from './lib/api.ts';

const Loader: React.FC<{ message?: string }> = ({ message = 'Loading LedgerPulse Platform...' }) => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-semibold text-slate-400">{message}</p>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { currentUser, loading: authLoading, signInAsDemo, signOut, isDemo } = useAuth();
  const { loading: orgLoading, error: orgError, currentOrg, invoices, canEditFinancials, canRecordPayments, canManageOrg, isPlatformAdmin } = useOrg();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [invoiceEditorOpen, setInvoiceEditorOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [invoiceDetailOpen, setInvoiceDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [expenseEditorOpen, setExpenseEditorOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [invitationError, setInvitationError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    if (!inviteToken || currentUser || isDemo) return;
    setAuthMode('login');
    setAuthModalOpen(true);
  }, [authLoading, currentUser, isDemo]);

  useEffect(() => {
    if (!currentUser || isDemo || authLoading) return;
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    const inviteOrgId = params.get('org');
    if (!inviteToken || !inviteOrgId) return;

    let cancelled = false;
    const accept = async () => {
      try {
        await api.acceptInvitation(inviteOrgId, inviteToken);
        if (!cancelled) {
          params.delete('invite');
          params.delete('org');
          const next = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
          window.history.replaceState({}, document.title, next);
          window.location.reload();
        }
      } catch (err) {
        if (!cancelled) setInvitationError(err instanceof ApiError ? err.message : 'Unable to accept the invitation.');
      }
    };
    void accept();
    return () => { cancelled = true; };
  }, [currentUser, isDemo, authLoading]);

  useEffect(() => {
    if (!currentUser || orgLoading || !invoices.length) return;
    const invoiceId = new URLSearchParams(window.location.search).get('invoice');
    if (!invoiceId) return;
    const invoice = invoices.find((item) => item.id === invoiceId);
    if (!invoice) return;
    setSelectedInvoice(invoice);
    setInvoiceDetailOpen(true);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, [currentUser, orgLoading, invoices]);

  if (authLoading) return <Loader />;

  if (!currentUser) {
    return (
      <>
        <PublicWebsite
          onOpenAuth={(mode) => { setAuthMode(mode); setAuthModalOpen(true); }}
          onExploreDemo={(role = 'owner') => signInAsDemo(role)}
        />
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} initialMode={authMode} />
      </>
    );
  }

  if (orgLoading && !currentOrg) return <Loader message="Loading your workspace..." />;

  if (orgError && !currentOrg) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl border border-rose-200 shadow-sm p-6 text-center">
          <h1 className="font-bold text-lg text-slate-900">Workspace could not be loaded</h1>
          <p className="text-sm text-slate-600 mt-2">{invitationError || orgError}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">Retry</button>
            <button onClick={() => void signOut()} className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold">Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  const navigate = (tab: ActiveTab) => {
    if (tab === 'settings' && !canManageOrg) return;
    if (tab === 'team' && !canManageOrg) return;
    if (tab === 'admin' && !isPlatformAdmin) return;
    setActiveTab(tab);
  };

  const handleOpenNewInvoice = () => {
    if (!canEditFinancials) return;
    setInvoiceToEdit(null);
    setInvoiceEditorOpen(true);
  };
  const handleEditInvoice = (invoice: Invoice) => {
    if (!canEditFinancials) return;
    setInvoiceToEdit(invoice);
    setInvoiceEditorOpen(true);
  };
  const handleViewInvoice = (invoice: Invoice) => { setSelectedInvoice(invoice); setInvoiceDetailOpen(true); };
  const handleOpenRecordPayment = (invoice: Invoice) => {
    if (!canRecordPayments) return;
    setPaymentInvoice(invoice);
    setRecordPaymentOpen(true);
  };
  const handleOpenNewExpense = () => { setExpenseToEdit(null); setExpenseEditorOpen(true); };
  const handleEditExpense = (expense: Expense) => { setExpenseToEdit(expense); setExpenseEditorOpen(true); };

  return (
    <>
      <AppLayout
        activeTab={activeTab}
        setActiveTab={navigate}
        onOpenNewInvoice={handleOpenNewInvoice}
        onOpenNewExpense={handleOpenNewExpense}
        onOpenNewCustomer={() => navigate('customers')}
      >
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenNewInvoice={handleOpenNewInvoice}
            onOpenNewExpense={handleOpenNewExpense}
            onViewInvoice={handleViewInvoice}
            onRecordPayment={handleOpenRecordPayment}
            onNavigateTab={navigate}
          />
        )}
        {activeTab === 'invoices' && <InvoicesList onOpenNewInvoice={handleOpenNewInvoice} onViewInvoice={handleViewInvoice} onEditInvoice={handleEditInvoice} onRecordPayment={handleOpenRecordPayment} />}
        {activeTab === 'recurring' && <RecurringInvoicesList />}
        {activeTab === 'expenses' && <ExpensesList onOpenNewExpense={handleOpenNewExpense} onEditExpense={handleEditExpense} />}
        {activeTab === 'customers' && <ContactsView initialTab="customers" />}
        {activeTab === 'vendors' && <ContactsView initialTab="vendors" />}
        {activeTab === 'payments' && <PaymentsLedger />}
        {activeTab === 'reports' && <FinancialReports />}
        {activeTab === 'team' && canManageOrg && <TeamAndSettings initialTab="team" />}
        {activeTab === 'settings' && canManageOrg && <TeamAndSettings initialTab="settings" />}
        {activeTab === 'admin' && isPlatformAdmin && <AdminPortal />}
      </AppLayout>

      <InvoiceEditorModal isOpen={invoiceEditorOpen} onClose={() => setInvoiceEditorOpen(false)} invoiceToEdit={invoiceToEdit} />
      <InvoiceDetailModal
        isOpen={invoiceDetailOpen}
        onClose={() => setInvoiceDetailOpen(false)}
        invoice={selectedInvoice}
        onRecordPayment={(invoice) => { setInvoiceDetailOpen(false); handleOpenRecordPayment(invoice); }}
        onEdit={(invoice) => { setInvoiceDetailOpen(false); handleEditInvoice(invoice); }}
      />
      <RecordPaymentModal isOpen={recordPaymentOpen} onClose={() => setRecordPaymentOpen(false)} invoice={paymentInvoice} />
      <ExpenseEditorModal isOpen={expenseEditorOpen} onClose={() => setExpenseEditorOpen(false)} expenseToEdit={expenseToEdit} />
      {isDemo && null}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <OrgProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </OrgProvider>
    </AuthProvider>
  );
}
