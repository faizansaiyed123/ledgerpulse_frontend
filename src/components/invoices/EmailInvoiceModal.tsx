import React, { useState } from 'react';
import { Mail, Send, Paperclip, CheckCircle, AlertCircle, Eye, Sparkles, X } from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { useNotifications } from '../../context/NotificationContext.tsx';
import { Invoice, Customer } from '../../types/index.ts';
import { generateInvoiceEmailTemplate, sendInvoiceEmail, EmailSendResult } from '../../lib/emailService.ts';
import { formatCurrency } from '../../lib/currency.ts';

interface EmailInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  customer?: Customer;
  onEmailSentSuccess?: (result: EmailSendResult) => void;
}

export const EmailInvoiceModal: React.FC<EmailInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  customer,
  onEmailSentSuccess,
}) => {
  const { currentOrg, updateInvoice } = useOrg();
  const { addNotification } = useNotifications();

  const org = currentOrg || {
    id: invoice.orgId,
    name: 'Apex Cloud Solutions Inc.',
    currency: invoice.currency,
    paymentTermsDays: 30,
    createdBy: '',
    createdAt: '',
  };

  const initialRecipient = customer?.email || invoice.customerEmail || 'client@example.com';
  const [recipientEmail, setRecipientEmail] = useState(initialRecipient);
  const [customNote, setCustomNote] = useState('');
  const [viewTab, setViewTab] = useState<'compose' | 'preview'>('compose');
  const [isSending, setIsSending] = useState(false);
  const [sentResult, setSentResult] = useState<EmailSendResult | null>(null);
  const [sendError, setSendError] = useState('');

  if (!isOpen) return null;

  const emailTemplate = generateInvoiceEmailTemplate(invoice, org, customer, customNote);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) return;

    setSendError('');
    setIsSending(true);
    try {
      const result = await sendInvoiceEmail(invoice, org, customer, customNote, recipientEmail);
      setSentResult(result);

      // If invoice was in draft, transition it to 'sent'
      if (invoice.status === 'draft') {
        await updateInvoice(invoice.id, { status: 'sent' });
      }

      // Add in-app notification
      addNotification({
        orgId: org.id,
        title: `Invoice ${invoice.invoiceNumber} Emailed`,
        message: `Successfully dispatched invoice with PDF attachment to ${result.recipientEmail} (ID: ${result.messageId}).`,
        type: 'system',
        link: `/invoices`,
      });

      if (onEmailSentSuccess) {
        onEmailSentSuccess(result);
      }
    } catch (err) {
      console.error('Failed to send invoice email:', err);
      setSendError(err instanceof Error ? err.message : 'The invoice email could not be sent.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full my-6 p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Email Invoice to Client</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {invoice.invoiceNumber} • {formatCurrency(invoice.totalAmount, invoice.currency)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
        </div>

        {sentResult ? (
          /* Success Screen */
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-slate-900">Invoice submitted for email delivery</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                Invoice PDF <strong>{sentResult.attachedFilename}</strong> was submitted to the configured mail server for
                <span className="font-semibold text-slate-900">{sentResult.recipientEmail}</span>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 max-w-md mx-auto space-y-1 font-mono text-left">
              <div><span className="text-slate-400">Message ID:</span> {sentResult.messageId}</div>
              <div><span className="text-slate-400">Timestamp:</span> {new Date(sentResult.sentAt).toLocaleString()}</div>
              <div><span className="text-slate-400">Attachment:</span> {sentResult.attachedFilename} (Vector PDF)</div>
              <div><span className="text-slate-400">Status:</span> Accepted by configured SMTP server</div>
            </div>

            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm transition-colors"
              >
                Back to Invoice
              </button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div className="mt-4 flex flex-col flex-1 overflow-hidden space-y-3.5 text-xs">
            {/* View Switcher: Compose vs HTML Preview */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewTab('compose')}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    viewTab === 'compose' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Compose Email
                </button>
                <button
                  type="button"
                  onClick={() => setViewTab('preview')}
                  className={`px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                    viewTab === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview Branded Email</span>
                </button>
              </div>

              <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <Paperclip className="w-3.5 h-3.5" />
                <span>PDF Auto-Attached</span>
              </div>
            </div>

            {viewTab === 'compose' ? (
              <form onSubmit={handleSend} className="space-y-3 overflow-y-auto flex-1 pr-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recipient Client Email *</label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pre-filled from {customer?.name || invoice.customerName}'s registered record
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    disabled
                    value={emailTemplate.subject}
                    className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs font-medium cursor-not-allowed"
                  />
                </div>

                {/* Attachment badge */}
                <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-indigo-950">{emailTemplate.attachedFilename}</p>
                      <p className="text-[10px] text-indigo-700">Client-ready vector PDF formatted invoice</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    Ready
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Custom Note to Client (Optional)</label>
                  <textarea
                    rows={3}
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Hi Jane, thank you for your partnership! Please remit to our updated wire instructions..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                  />
                </div>

                {sendError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{sendError}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-1.5 rounded-lg font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !recipientEmail}
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-pulse' : ''}`} />
                    <span>{isSending ? 'Sending Email & PDF...' : 'Send Invoice Email'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* HTML Preview Tab */
              <div className="overflow-y-auto flex-1 border border-slate-200 rounded-xl bg-slate-50 p-4 space-y-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <p className="text-[11px] text-slate-500"><strong>Subject:</strong> {emailTemplate.subject}</p>
                    <p className="text-[11px] text-slate-500"><strong>To:</strong> {recipientEmail}</p>
                    <p className="text-[11px] text-slate-500"><strong>Attachment:</strong> {emailTemplate.attachedFilename}</p>
                  </div>
                  <div className="text-xs text-slate-700 space-y-2 leading-relaxed whitespace-pre-line font-sans">
                    {emailTemplate.bodyText}
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setViewTab('compose')}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold text-xs"
                  >
                    Return to Send Options
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
