import React, { useState } from 'react';
import {
  Users,
  Shield,
  Building,
  Mail,
  Plus,
  Trash2,
  Check,
  Save,
  Globe,
  DollarSign,
  FileText,
  Clock,
  Activity,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { MemberRole } from '../../types/index.ts';

export const TeamAndSettings: React.FC<{ initialTab?: 'team' | 'settings' }> = ({
  initialTab = 'team',
}) => {
  const {
    currentOrg,
    teamMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    updateOrganization,
    activityLogs,
    canManageOrg,
  } = useOrg();

  const [activeTab, setActiveTab] = useState<'team' | 'settings' | 'audit'>(initialTab);

  // Business profile form
  const [name, setName] = useState(currentOrg?.name || '');
  const [taxId, setTaxId] = useState(currentOrg?.taxId || '');
  const [currency, setCurrency] = useState(currentOrg?.currency || 'USD');
  const [paymentTermsDays, setPaymentTermsDays] = useState(currentOrg?.paymentTermsDays || 30);
  const [email, setEmail] = useState(currentOrg?.email || '');
  const [phone, setPhone] = useState(currentOrg?.phone || '');
  const [address, setAddress] = useState(currentOrg?.address || '');
  const [city, setCity] = useState(currentOrg?.city || '');
  const [state, setState] = useState(currentOrg?.state || '');
  const [country, setCountry] = useState(currentOrg?.country || '');
  const [invoiceNotes, setInvoiceNotes] = useState(currentOrg?.invoiceNotes || '');
  const [invoiceTerms, setInvoiceTerms] = useState(currentOrg?.invoiceTerms || '');
  const [saveSavedNotice, setSaveNotice] = useState(false);
  const [error, setError] = useState('');
  const [invitationUrl, setInvitationUrl] = useState('');

  // Invite member form
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<MemberRole>('accountant');

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateOrganization({
        name,
        taxId,
        currency,
        paymentTermsDays: Number(paymentTermsDays),
        email,
        phone,
        address,
        city,
        state,
        country,
        invoiceNotes,
        invoiceTerms,
      });
      setSaveNotice(true);
      setTimeout(() => setSaveNotice(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save organization settings.');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setError('');
    try {
      const result = await inviteMember(inviteEmail, inviteRole, inviteName);
      setInvitationUrl(result.invitationUrl);
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create the invitation.');
    }
  };

  if (!canManageOrg) {
    return (
      <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-sm">
        You do not have permission to manage organization settings or team members.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Organization &amp; Team Settings</h2>
          <p className="text-xs text-slate-500">Configure business identity, manage member roles, and audit workspace changes</p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'team' && canManageOrg && (
            <button
              onClick={() => setInviteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs">{error}</div>
      )}
      {invitationUrl && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs space-y-2">
          <div className="font-semibold">Invitation created. Share this link with the invited person.</div>
          <div className="break-all font-mono bg-white/70 rounded-lg p-2">{invitationUrl}</div>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(invitationUrl)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >Copy invitation link</button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex gap-1 text-xs">
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'team' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Members ({teamMembers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'settings' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Business Profile &amp; Invoicing</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-1.5 transition-colors ${
            activeTab === 'audit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Activity Audit Log</span>
        </button>
      </div>

      {/* Team View */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Joined At</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div>{member.userName || member.userEmail.split('@')[0]}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{member.userEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {canManageOrg && member.role !== 'owner' ? (
                          <select
                            value={member.role}
                            onChange={(e) => updateMemberRole(member.id, e.target.value as MemberRole)}
                            className="px-2 py-1 bg-slate-50 border border-slate-300 rounded font-semibold capitalize text-xs"
                          >
                            <option value="admin">Admin</option>
                            <option value="accountant">Accountant</option>
                            <option value="staff">Staff</option>
                          </select>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200">
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{member.joinedAt.split('T')[0]}</td>
                      <td className="py-3.5 px-4 text-right">
                        {canManageOrg && member.role !== 'owner' && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${member.userEmail} from this organization?`)) {
                                removeMember(member.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remove Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Permissions Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">Permission / Capability</th>
                    <th className="py-2.5 px-3 text-center">Owner</th>
                    <th className="py-2.5 px-3 text-center">Admin</th>
                    <th className="py-2.5 px-3 text-center">Accountant</th>
                    <th className="py-2.5 px-3 text-center">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Create &amp; Finalize Invoices</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Record Invoice Payments</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Approve &amp; Reject Expenses</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Submit Draft Expenses &amp; Upload Receipts</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Invite Members &amp; Assign Roles</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-slate-300">—</td>
                    <td className="text-center text-slate-300">—</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-medium">Manage Business Profile &amp; Organization Billing</td>
                    <td className="text-center text-emerald-600 font-bold">✓</td>
                    <td className="text-center text-slate-300">—</td>
                    <td className="text-center text-slate-300">—</td>
                    <td className="text-center text-slate-300">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Business Profile Settings View */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-xs">
          {saveSavedNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Business Profile and Invoicing preferences saved successfully!</span>
            </div>
          )}

          <div>
            <h3 className="font-bold text-sm text-slate-900">Company Identity &amp; Tax Info</h3>
            <p className="text-slate-500 mt-0.5">Printed at the header of all generated invoice PDFs</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Legal Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tax ID / VAT / GST #</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Base Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD (CA$)</option>
                <option value="AUD">AUD (AU$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
                <option value="SGD">SGD (SG$)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Payment Terms (Days)</label>
              <input
                type="number"
                min="0"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Invoice Footer Notes</label>
              <textarea
                rows={3}
                value={invoiceNotes}
                onChange={(e) => setInvoiceNotes(e.target.value)}
                placeholder="Thank you for partnering with us!"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Payment Instructions &amp; Bank Terms</label>
              <textarea
                rows={3}
                value={invoiceTerms}
                onChange={(e) => setInvoiceTerms(e.target.value)}
                placeholder="Please remit payments to: Routing #, Account #..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Business Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Activity Audit Log View */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Immutable Workspace Audit Trail</h3>
              <p className="text-xs text-slate-500">Chronological activity record of invoice, payment, and expense events</p>
            </div>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activityLogs.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">No activity recorded yet.</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-start gap-4">
                  <div>
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">Initiator: {log.userEmail}</p>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Invite Team Member</h3>
            <p className="text-xs text-slate-500 mt-0.5">Send workspace access with tailored role permissions</p>

            <form onSubmit={handleInvite} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Sarah Jenkins"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sarah@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg capitalize focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-semibold"
                >
                  <option value="admin">Administrator (Full team &amp; settings control)</option>
                  <option value="accountant">Accountant (Invoices, Payments &amp; Expense approvals)</option>
                  <option value="staff">Staff (Draft expenses &amp; read-only invoices)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
