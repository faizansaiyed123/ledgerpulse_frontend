import React, { useState } from 'react';
import {
  FileText,
  CreditCard,
  PieChart,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle,
  Users,
  Globe,
  Receipt,
  Download,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Building,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../lib/api.ts';

interface PublicWebsiteProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onExploreDemo: (role?: 'owner' | 'accountant' | 'staff') => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ onOpenAuth, onExploreDemo }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState('');
  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message || contactSubmitting) return;
    setContactError('');
    setContactSubmitting(true);
    try {
      await api.sendContact(contactForm);
      setContactSubmitted(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'The inquiry could not be delivered. Please try again.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How does LedgerPulse isolate data across different organizations?',
      a: 'LedgerPulse enforces multi-tenant data isolation. Each organization has its own isolated records for customers, vendors, invoices, expenses, and payments. Role-Based Access Control (RBAC) ensures users only access resources permitted by their active organization membership.',
    },
    {
      q: 'Can I generate PDF invoices and print them directly?',
      a: 'Yes! Every invoice can be previewed in real-time, downloaded as an enterprise-grade vector PDF using client-side generation, or printed with clean print styles.',
    },
    {
      q: 'Does LedgerPulse support recurring invoices and background automation?',
      a: 'Yes. You can schedule weekly, bi-weekly, monthly, quarterly, or yearly recurring billing profiles. The provided backend scheduler checks due profiles every five minutes and generates invoices automatically.',
    },
    {
      q: 'What roles are available for team collaboration?',
      a: 'LedgerPulse provides four distinct roles: Owner (full workspace control & billing), Admin (team management & configuration), Accountant (invoice creation, payment recording, and expense approval), and Staff (read-only and draft submissions).',
    },
    {
      q: 'Can I export financial reports to CSV or PDF?',
      a: 'Yes! The Reports module supports instant generation and one-click CSV and PDF exports for Profit & Loss (P&L), Revenue by Customer, Expense Category Breakdowns, and Accounts Receivable Aging.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">LedgerPulse</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                SaaS v2.4
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#invoices" className="hover:text-blue-600 transition-colors">Invoicing</a>
            <a href="#expenses" className="hover:text-blue-600 transition-colors">Expenses</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#about" className="hover:text-blue-600 transition-colors">About</a>
            <a href="#contact" className="hover:text-blue-600 transition-colors">Contact</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onExploreDemo('owner')}
              className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Live Demo</span>
            </button>
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/60 via-slate-50 to-slate-50 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in">
            <Zap className="w-3.5 h-3.5" /> Complete Invoice & Expense SaaS Operating System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Scale Your Business With <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Zero-Friction Billing</span> & Financial Clarity
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Create professional invoices, automate recurring subscriptions, track expense receipts, reconcile multi-currency payments, and run real-time P&L reporting.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onExploreDemo('owner')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-base border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Explore Interactive Demo</span>
            </button>
          </div>

          <p className="mt-3 text-xs text-slate-500 flex items-center justify-center gap-3">
            <span>✓ No credit card required</span>
            <span>•</span>
            <span>✓ Multi-tenant data isolation</span>
            <span>•</span>
            <span>✓ Instant PDF generation</span>
          </p>

          {/* Hero Mockup Preview Card */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl bg-white p-3 sm:p-5 shadow-2xl border border-slate-200/80">
            <div className="rounded-xl bg-slate-900 p-4 sm:p-6 text-white text-left overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">https://app.ledgerpulse.io/dashboard</span>
                </div>
                <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Enterprise Workspace
                </div>
              </div>

              {/* Sample Dashboard Preview stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-medium">Total Invoiced</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mt-1">$45,864.00</p>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +18.4% vs last month
                  </p>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-medium">Collected Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">$36,235.00</p>
                  <p className="text-xs text-slate-400 mt-1">79% collection rate</p>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-medium">Total Expenses</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-300 mt-1">$10,640.00</p>
                  <p className="text-xs text-slate-400 mt-1">12 receipts verified</p>
                </div>
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <p className="text-xs text-slate-400 font-medium">Net Operating Margin</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-400 mt-1">+$25,595.00</p>
                  <p className="text-xs text-blue-300 mt-1">70.6% net margin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section id="features" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Platform Capabilities</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Speed, Precision, and Control
            </p>
            <p className="mt-4 text-base text-slate-600">
              Everything high-growth businesses, agencies, and finance teams need to run invoice lifecycles without friction.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Custom Invoice Builder</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Add line items, discount codes, multi-tier tax percentages, client-specific currencies, and terms. Real-time balance calculations with instantaneous previews.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Smart Expense Tracking</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Log vendor bills, attach receipts with instant preview, tag reimbursable costs, and approve or reject expenses with formal audit logs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Recurring Automation</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Automate recurring client retainers across weekly, monthly, and annual schedules. A background scheduler processes due invoices automatically when the provided scheduler service is running.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Partial & Full Payments</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Record payments across Bank Transfers, Credit Cards, PayPal, and Checks. Automatic calculation of outstanding balances and invoice status updates.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                <PieChart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Financial Reports & Exports</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Generate instant Profit & Loss (P&L) statements, Revenue by Customer breakdown, Accounts Receivable Aging (30/60/90 days), and download one-click CSV & PDF reports.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Granular Role Permissions</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Invite team members with tailored roles: Owner, Administrator, Accountant, and Staff. Strict zero-trust rules prevent unauthorized data alterations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Invoicing Deep Dive */}
      <section id="invoices" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Invoice Management</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Get Paid Faster with Vector PDFs and Transparent Calculations
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Eliminate invoice disputes before they happen. LedgerPulse produces crisp, branded invoices with unambiguous line item subtotals, itemized taxes, payment terms, and clear bank instructions.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Client-side high-resolution vector PDF export with company branding</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Dynamic line item editing with quantity, discounts, and tax rates</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Automatic status transitions: Draft → Sent → Partially Paid → Paid → Overdue</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">One-click invoice duplication for recurring engagements</span>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => onExploreDemo('accountant')}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Try Invoice Creator in Demo</span>
                </button>
              </div>
            </div>

            {/* Visual Invoice Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200">
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Preview</span>
                  <h4 className="text-xl font-bold text-slate-900 mt-1">Apex Cloud Solutions</h4>
                  <p className="text-xs text-slate-500">Tax ID: US-94-3829104</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    PAID
                  </span>
                  <p className="text-xs font-mono text-slate-500 mt-1">INV-2026-001</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
                <div>
                  <p className="text-slate-400 font-medium">Billed To</p>
                  <p className="font-semibold text-slate-800 mt-0.5">Starlight Media Group</p>
                  <p className="text-slate-500">accounts@starlightmedia.com</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-medium">Due Date</p>
                  <p className="font-semibold text-slate-800 mt-0.5">Net 30 Days</p>
                </div>
              </div>

              <div className="py-4 space-y-2 text-xs">
                <div className="flex justify-between font-medium text-slate-700">
                  <span>Cloud Infrastructure Architecture (60 hrs)</span>
                  <span>$9,000.00</span>
                </div>
                <div className="flex justify-between font-medium text-slate-700">
                  <span>High-Availability Database Clustering (20 hrs)</span>
                  <span>$3,000.00</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-xs border border-slate-200">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>$12,000.00</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (10%)</span>
                  <span>$1,140.00</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-blue-600">$12,540.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expense Management Deep Dive */}
      <section id="expenses" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 bg-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <h4 className="font-semibold text-sm text-slate-300">Expense Log & Receipt Verification</h4>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded-full font-mono">
                  Multi-Category
                </span>
              </div>

              <div className="space-y-3 mt-4">
                <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">Amazon Web Services</span>
                    <p className="text-slate-400">Software & Cloud Hosting</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-300 text-sm">$2,450.00</span>
                    <p className="text-emerald-400">✓ Approved</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">Delta Air Lines</span>
                    <p className="text-slate-400">Client Onsite Travel</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-300 text-sm">$680.00</span>
                    <p className="text-emerald-400">✓ Reimbursable</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white">Team Dinner - Wayfare</span>
                    <p className="text-slate-400">Quarterly Meals & Entertainment</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-amber-300 text-sm">$340.00</span>
                    <p className="text-amber-400 font-medium">⏳ Pending Review</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Expense Governance</span>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                Control Burn Rates With Built-in Approvals & Receipts
              </h2>
              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Prevent rogue expenses and missing tax receipts. Staff can upload receipts with immediate thumbnail preview, while Accountants and Administrators maintain sole authorization to approve reimbursements.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Receipt image upload with instant lightbox preview & storage</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Categorization across Travel, Software, Office, Advertising, and Consulting</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">Reimbursable expense tracking for employee compensation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Transparent Plans</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Simple Pricing for Teams of Any Size
            </p>
            <p className="mt-4 text-base text-slate-600">
              Start with our 14-day free trial. Upgrade or cancel anytime with zero lock-in.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-slate-200 border border-slate-300">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annual Billing <span className="text-emerald-600 font-bold ml-1">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-slate-900">Starter</h3>
              <p className="text-xs text-slate-500 mt-1">For freelancers & solo founders</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  ${billingCycle === 'annual' ? '15' : '19'}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">✓ Up to 25 Active Invoices / mo</li>
                <li className="flex items-center gap-2">✓ PDF Generation & Downloads</li>
                <li className="flex items-center gap-2">✓ Basic Expense Tracking</li>
                <li className="flex items-center gap-2">✓ 1 Workspace Organization</li>
                <li className="flex items-center gap-2">✓ Standard Support</li>
              </ul>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Growth - Featured */}
            <div className="bg-white rounded-2xl p-8 border-2 border-blue-600 shadow-xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase rounded-full tracking-wider">
                Most Popular
              </div>
              <h3 className="text-lg font-bold text-slate-900">Growth</h3>
              <p className="text-xs text-slate-500 mt-1">For growing teams & agencies</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  ${billingCycle === 'annual' ? '39' : '49'}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2 font-semibold text-slate-900">✓ Unlimited Invoices & Expenses</li>
                <li className="flex items-center gap-2">✓ Automated Recurring Invoicing</li>
                <li className="flex items-center gap-2">✓ Team Roles (Owner, Accountant, Staff)</li>
                <li className="flex items-center gap-2">✓ Profit & Loss & Aging Reports</li>
                <li className="flex items-center gap-2">✓ CSV & PDF Financial Exports</li>
                <li className="flex items-center gap-2">✓ Receipt Photo Storage</li>
              </ul>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white shadow-md transition-colors"
              >
                Start 14-Day Trial
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-slate-900">Enterprise</h3>
              <p className="text-xs text-slate-500 mt-1">For multi-entity businesses</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  ${billingCycle === 'annual' ? '79' : '99'}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ month</span>
              </div>
              <ul className="mt-6 space-y-3 text-xs text-slate-600">
                <li className="flex items-center gap-2">✓ Multiple Organizations & Workspaces</li>
                <li className="flex items-center gap-2">✓ Multi-Currency & Global Tax Rules</li>
                <li className="flex items-center gap-2">✓ Dedicated Audit Trail & Activity Logs</li>
                <li className="flex items-center gap-2">✓ Custom Invoice Branding & Terms</li>
                <li className="flex items-center gap-2">✓ 24/7 Priority Financial Support</li>
              </ul>
              <button
                onClick={() => onOpenAuth('register')}
                className="mt-8 w-full py-2.5 rounded-xl border border-slate-300 font-semibold text-xs text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About & Trust Section */}
      <section id="about" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Built for Reliability</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Financial Integrity is Our Non-Negotiable Core
            </h2>
            <p className="mt-4 text-base text-slate-600 leading-relaxed">
              LedgerPulse was founded to rid modern founders of spreadsheets, disconnected billing plugins, and unreliable invoice totals. Our system architecture treats mathematical correctness and tenant data separation as primary directives.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <ShieldCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-900">Tenant Isolation</h4>
              <p className="text-xs text-slate-600 mt-1">Strict multi-organization boundaries</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <Globe className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-900">Global Precision</h4>
              <p className="text-xs text-slate-600 mt-1">Multi-currency formatting & tax rules</p>
            </div>
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-900">Instant PDF Rendering</h4>
              <p className="text-xs text-slate-600 mt-1">Zero server wait-times for exports</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest">Common Inquiries</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">Frequently Asked Questions</p>
          </div>

          <div className="mt-10 space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between font-semibold text-slate-900 text-sm hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Us Form */}
      <section id="contact" className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Connect With Us</span>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">Have Questions or Need Enterprise Support?</h2>
            <p className="mt-3 text-sm text-slate-600">
              Our team will follow up using the contact email you provide.
            </p>
          </div>

          <div className="mt-10 bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {contactSubmitted ? (
              <div className="text-center py-10">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-900">Inquiry Submitted</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Thank you for reaching out. A specialist from our team will contact you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="jane@company.com"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Subject</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="Enterprise Migration or Custom Integration"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell us about your team size, expected invoice volume, and required capabilities..."
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {contactError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{contactError}</div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{contactSubmitting ? 'Sending…' : 'Send Inquiry'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-white font-bold text-base mb-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>LedgerPulse</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Enterprise-grade Invoicing and Expense Management SaaS platform for growing companies.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white uppercase tracking-wider mb-3">Product</p>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">Invoicing Engine</a></li>
                <li><a href="#expenses" className="hover:text-white transition-colors">Receipt & Expense Audit</a></li>
                <li><a href="#features" className="hover:text-white transition-colors">Recurring Automation</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white uppercase tracking-wider mb-3">Company</p>
              <ul className="space-y-2">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><button onClick={() => setShowLegalModal('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
                <li><button onClick={() => setShowLegalModal('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white uppercase tracking-wider mb-3">Demo & Evaluation</p>
              <p className="mb-3 text-slate-400">Instantly test the SaaS with pre-seeded sample data.</p>
              <button
                onClick={() => onExploreDemo('owner')}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch Interactive Demo</span>
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500">
            <p>© {new Date().getFullYear()} LedgerPulse Technologies Inc. All rights reserved.</p>
            <div className="flex gap-4 mt-3 sm:mt-0">
              <button onClick={() => setShowLegalModal('privacy')} className="hover:text-slate-300">Privacy Policy</button>
              <span>•</span>
              <button onClick={() => setShowLegalModal('terms')} className="hover:text-slate-300">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      {showLegalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">
                {showLegalModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                onClick={() => setShowLegalModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
              {showLegalModal === 'privacy' ? (
                <>
                  <p><strong>1. Data Collection:</strong> LedgerPulse collects business information necessary for generating invoices and maintaining expense records, including contact information and transaction logs.</p>
                  <p><strong>2. Data Isolation:</strong> All records belong strictly to the registered organization workspace. Zero-trust security guards prevent cross-organization exposure.</p>
                  <p><strong>3. Document Security:</strong> Invoice PDFs and uploaded receipts are handled with standard cryptographic protections.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Subscription Terms:</strong> Services are provided on a subscription basis according to the selected plan tier.</p>
                  <p><strong>2. Compliance & Taxation:</strong> Customers are solely responsible for setting appropriate regional tax percentages on generated invoices.</p>
                  <p><strong>3. Data Retention:</strong> Account owners may export all invoice and payment data via CSV or PDF at any time.</p>
                </>
              )}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={() => setShowLegalModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
