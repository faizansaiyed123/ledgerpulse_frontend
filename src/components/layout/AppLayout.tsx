import React, { useState } from 'react';
import {
  FileText,
  LayoutDashboard,
  Receipt,
  Repeat,
  Users,
  Building,
  CreditCard,
  BarChart3,
  Settings,
  Shield,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  Sparkles,
  Menu,
  X,
  ExternalLink,
  Check,
  Briefcase,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useOrg } from '../../context/OrgContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { MemberRole } from '../../types/index.ts';

export type ActiveTab =
  | 'dashboard'
  | 'invoices'
  | 'recurring'
  | 'expenses'
  | 'customers'
  | 'vendors'
  | 'payments'
  | 'reports'
  | 'team'
  | 'settings'
  | 'admin';

interface AppLayoutProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewInvoice: () => void;
  onOpenNewExpense: () => void;
  onOpenNewCustomer: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewInvoice,
  onOpenNewExpense,
  onOpenNewCustomer,
  children,
}) => {
  const { currentUser, signOut, signInAsDemo, isDemo } = useAuth();
  const {
    currentOrg,
    organizations,
    switchOrganization,
    createOrganization,
    loadSampleData,
    userRole,
    invoices,
    expenses,
    canManageOrg,
    canEditFinancials,
    isPlatformAdmin,
  } = useOrg();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [newOrgModalOpen, setNewOrgModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgCurrency, setNewOrgCurrency] = useState('USD');
  const [isSeeding, setIsSeeding] = useState(false);

  const pendingExpensesCount = expenses.filter((e) => e.status === 'pending').length;
  const overdueInvoicesCount = invoices.filter((i) => i.status === 'overdue').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'invoices', label: 'Invoices', icon: FileText, visible: true, badge: overdueInvoicesCount > 0 ? `${overdueInvoicesCount} overdue` : undefined, badgeColor: 'bg-rose-500' },
    { id: 'recurring', label: 'Recurring Billing', icon: Repeat, visible: canEditFinancials || isDemo },
    { id: 'expenses', label: 'Expenses', icon: Receipt, visible: true, badge: pendingExpensesCount > 0 ? `${pendingExpensesCount}` : undefined, badgeColor: 'bg-amber-500' },
    { id: 'customers', label: 'Customers', icon: Users, visible: true },
    { id: 'vendors', label: 'Vendors', icon: Briefcase, visible: true },
    { id: 'payments', label: 'Payments', icon: CreditCard, visible: true },
    { id: 'reports', label: 'Reports & P&L', icon: BarChart3, visible: true },
    { id: 'team', label: 'Team & Roles', icon: Shield, visible: canManageOrg },
    { id: 'settings', label: 'Settings', icon: Settings, visible: canManageOrg },
    { id: 'admin', label: 'Platform Admin', icon: Building, visible: isPlatformAdmin },
  ].filter((item) => item.visible);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    try {
      await createOrganization(newOrgName.trim(), newOrgCurrency);
      setNewOrgModalOpen(false);
      setNewOrgName('');
      setOrgDropdownOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to create workspace.');
    }
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await loadSampleData();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to load sample data.');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSwitchDemoRole = (role: MemberRole) => {
    signInAsDemo(role as 'owner' | 'accountant' | 'staff');
    setRoleSwitcherOpen(false);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-none">LedgerPulse</h1>
              <span className="text-[10px] text-slate-400 font-mono">Invoice &amp; Expense SaaS</span>
            </div>
          </div>
        </div>

        {/* Current Organization Selector */}
        <div className="p-3 border-b border-slate-800 relative">
          <button
            onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
            className="w-full p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-left flex items-center justify-between transition-colors border border-slate-700/60"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                {currentOrg?.name?.charAt(0) || 'O'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{currentOrg?.name || 'Workspace'}</p>
                <p className="text-[10px] text-slate-400 font-mono uppercase">{currentOrg?.currency || 'USD'} • {userRole}</p>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {/* Org Dropdown */}
          {orgDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1.5 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Workspaces</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      switchOrganization(org.id);
                      setOrgDropdownOpen(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                      org.id === currentOrg?.id ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <span className="truncate">{org.name}</span>
                    {org.id === currentOrg?.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-700">
                <button
                  onClick={() => {
                    setNewOrgModalOpen(true);
                    setOrgDropdownOpen(false);
                  }}
                  className="w-full p-1.5 rounded-lg text-xs text-blue-400 hover:bg-slate-700/60 font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold text-white px-1.5 py-0.2 rounded-full ${item.badgeColor || 'bg-blue-500'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer Role & User Preview */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <div className="flex items-center gap-2 truncate">
              <div className="w-8 h-8 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser?.displayName?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{currentUser?.displayName || 'User'}</p>
                <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-400 p-1 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="font-bold text-slate-900 text-sm">LedgerPulse</span>
          </div>

          {/* Left Context Info */}
          <div className="hidden md:flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-900 capitalize tracking-tight">
              {activeTab === 'recurring' ? 'Recurring Billing' : activeTab === 'reports' ? 'Reports & P&L Statement' : activeTab}
            </h2>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              {currentOrg?.name} ({currentOrg?.currency})
            </span>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Seed Sample Data Button */}
            {(canManageOrg || isDemo) && <button
              onClick={handleSeedData}
              disabled={isSeeding}
              title="Populate workspace with complete sample data"
              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">{isSeeding ? 'Seeding...' : 'Load Sample Data'}</span>
            </button>}

            {/* Role Switcher (demo-only permission simulator) */}
            {isDemo && <div className="relative">
              <button
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span className="capitalize">{userRole}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleSwitcherOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Simulate Role</p>
                  <button
                    onClick={() => handleSwitchDemoRole('owner')}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-800 flex items-center justify-between"
                  >
                    <span>👑 Owner</span>
                    {userRole === 'owner' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    onClick={() => handleSwitchDemoRole('accountant')}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-800 flex items-center justify-between"
                  >
                    <span>📊 Accountant</span>
                    {userRole === 'accountant' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                  <button
                    onClick={() => handleSwitchDemoRole('staff')}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100 font-medium text-slate-800 flex items-center justify-between"
                  >
                    <span>💼 Staff</span>
                    {userRole === 'staff' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                  </button>
                </div>
              )}
            </div>}

            {/* Quick Actions Dropdown */}
            <div className="flex items-center gap-1.5">
              {canEditFinancials && <button
                onClick={onOpenNewInvoice}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Invoice</span>
              </button>}
              <button
                onClick={onOpenNewExpense}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Expense</span>
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 relative transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>

              {/* Notification Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No notifications right now
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            n.isRead
                              ? 'bg-white border-slate-100 text-slate-600'
                              : 'bg-blue-50/60 border-blue-200 text-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-900">{n.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 text-slate-300 p-4 border-b border-slate-800 space-y-2 z-40">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as ActiveTab);
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">Signed in as {currentUser?.displayName}</span>
              <button onClick={() => signOut()} className="text-rose-400 font-semibold">Sign Out</button>
            </div>
          </div>
        )}

        {/* Main Body Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* New Organization Modal */}
      {newOrgModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Create New Workspace</h3>
            <p className="text-xs text-slate-500 mt-1">
              Add a new company or client workspace with independent financial records.
            </p>

            <form onSubmit={handleCreateOrg} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Workspace Name</label>
                <input
                  type="text"
                  required
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Acme Holdings Ltd."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Default Base Currency</label>
                <select
                  value={newOrgCurrency}
                  onChange={(e) => setNewOrgCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="USD">USD ($ - US Dollar)</option>
                  <option value="EUR">EUR (€ - Euro)</option>
                  <option value="GBP">GBP (£ - British Pound)</option>
                  <option value="CAD">CAD (CA$ - Canadian Dollar)</option>
                  <option value="AUD">AUD (AU$ - Australian Dollar)</option>
                  <option value="JPY">JPY (¥ - Japanese Yen)</option>
                  <option value="INR">INR (₹ - Indian Rupee)</option>
                  <option value="SGD">SGD (SG$ - Singapore Dollar)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewOrgModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
