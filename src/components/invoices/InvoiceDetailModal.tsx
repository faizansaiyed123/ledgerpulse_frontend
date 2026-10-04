import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CreditCard,
  Copy,
  Mail,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  Edit,
  Globe,
  Send,
} from 'lucide-react';
import { useOrg } from '../../context/OrgContext.tsx';
import { Invoice } from '../../types/index.ts';
import { formatCurrency, convertCurrency, getExchangeRate, SUPPORTED_CURRENCIES } from '../../lib/currency.ts';
import { downloadInvoicePDF } from '../../lib/pdf.ts';
import { EmailInvoiceModal } from './EmailInvoiceModal.tsx';
import { EmailSendResult } from '../../lib/emailService.ts';

interface InvoiceDetailModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordPayment: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onRecordPayment,
  onEdit,
}) => {
  const { currentOrg, customers, payments, duplicateInvoice, canEditFinancials } = useOrg();
  const [copiedLink, setCopiedLink] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailSentResult, setEmailSentResult] = useState<EmailSendResult | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState(false);
  const [fxCurrency, setFxCurrency] = useState<string>('EUR');

  if (!isOpen || !invoice) return null;

  const customer = customers.find((c) => c.id === invoice.customerId);
  const relatedPayments = payments.filter((p) => p.invoiceId === invoice.id);

  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      // Ensure organization fallback object so PDF download never fails
      const orgFallback = currentOrg || {
        id: invoice.orgId,
        name: 'Apex Cloud Solutions Inc.',
        currency: invoice.currency,
        paymentTermsDays: 30,
        createdBy: '',
        createdAt: '',
      };
      await new Promise((resolve) => setTimeout(resolve, 200)); // slight pause for responsive UI feel
      downloadInvoicePDF(invoice, orgFallback, customer);
      setPdfSuccessMessage(true);
      setTimeout(() => setPdfSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?invoice=${encodeURIComponent(invoice.id)}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSendEmail = () => {
    setEmailModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-6 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-blue-400">{invoice.invoiceNumber}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                invoice.status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : invoice.status === 'overdue'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'bg-blue-500/20 text-blue-300'
              }`}
            >
              {invoice.status.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            {invoice.balanceDue > 0 && canEditFinancials && (
              <button
                onClick={() => onRecordPayment(invoice)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
              title="Download formatted PDF invoice"
            >
              <Download className={`w-3.5 h-3.5 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={() => setEmailModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              title="Send invoice PDF directly to client's registered email"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Invoice</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors flex items-center gap-1"
            >
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>

            {canEditFinancials && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(invoice);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                title="Edit Invoice"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PDF Download success alert */}
        {pdfSuccessMessage && (
          <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-2.5 flex items-center justify-between border-b border-emerald-200 animate-fade-in">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Vector PDF generated and downloaded as <strong>{invoice.invoiceNumber}.pdf</strong>!
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Ready</span>
          </div>
        )}

        {/* Email sent notice banner */}
        {emailSentResult && (
          <div className="bg-indigo-50 text-indigo-900 text-xs px-4 py-2.5 flex items-center justify-between border-b border-indigo-200 animate-fade-in">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              Invoice PDF dispatched to <strong>{emailSentResult.recipientEmail}</strong> (Ref: {emailSentResult.messageId})
            </span>
            <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">Dispatched</span>
          </div>
        )}

        {/* Invoice Printable View */}
        <div className="p-6 sm:p-10 overflow-y-auto space-y-6 flex-1 bg-white font-sans text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{currentOrg?.name}</h2>
              <p className="text-slate-500 mt-1">{currentOrg?.address} {currentOrg?.city && `, ${currentOrg.city}`}</p>
              {currentOrg?.taxId && <p className="text-slate-500">Tax ID: {currentOrg.taxId}</p>}
              {currentOrg?.email && <p className="text-slate-500">{currentOrg.email}</p>}
            </div>

            <div className="text-right">
              <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">INVOICE</h1>
              <p className="font-mono font-bold text-slate-800 text-sm mt-1">{invoice.invoiceNumber}</p>
              <div className="mt-2 space-y-1 text-slate-600">
                <p>Issue Date: <span className="font-semibold text-slate-900">{invoice.issueDate}</span></p>
                <p>Due Date: <span className="font-semibold text-slate-900">{invoice.dueDate}</span></p>
              </div>
            </div>
          </div>

          {/* Billed To */}
          <div className="py-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Billed To</p>
            <h4 className="text-sm font-bold text-slate-900">{invoice.customerName}</h4>
            {customer?.company && customer.company !== customer.name && (
              <p className="text-slate-600">{customer.company}</p>
            )}
            <p className="text-slate-600">{invoice.customerEmail || customer?.email}</p>
            {customer?.billingAddress && <p className="text-slate-600 mt-0.5">{customer.billingAddress}</p>}
            {customer?.taxId && <p className="text-slate-500 mt-0.5">Tax ID: {customer.taxId}</p>}
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3 text-right">Qty</th>
                  <th className="py-2 px-3 text-right">Unit Price</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-3 px-3 font-medium text-slate-800">{it.description}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{it.quantity}</td>
                    <td className="py-3 px-3 text-right text-slate-600">{formatCurrency(it.unitPrice, invoice.currency)}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(it.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Breakdown with Multi-Currency Live FX Converter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200 items-start">
            {/* Multi-Currency Conversion Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  Multi-Currency Live FX Preview
                </span>
                <select
                  value={fxCurrency}
                  onChange={(e) => setFxCurrency(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-300 rounded font-bold text-slate-700 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                >
                  {Object.keys(SUPPORTED_CURRENCIES).map((cur) => (
                    <option key={cur} value={cur}>
                      {cur} ({SUPPORTED_CURRENCIES[cur].symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 pt-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Converted Total ({fxCurrency}):</span>
                  <span className="font-bold text-slate-900">
                    {formatCurrency(convertCurrency(invoice.totalAmount, invoice.currency, fxCurrency), fxCurrency)}
                  </span>
                </div>
                {invoice.balanceDue > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Converted Balance Due:</span>
                    <span className="font-bold text-rose-600">
                      {formatCurrency(convertCurrency(invoice.balanceDue, invoice.currency, fxCurrency), fxCurrency)}
                    </span>
                  </div>
                )}
                <div className="pt-1.5 border-t border-slate-200 text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Reference FX Rate:</span>
                  <span>1 {invoice.currency} = {getExchangeRate(invoice.currency, fxCurrency).toFixed(4)} {fxCurrency}</span>
                </div>
              </div>
            </div>

            {/* Official Summary Calculation Box */}
            <div className="space-y-2 sm:pl-6">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Discount ({invoice.discountPercent}%):</span>
                  <span>-{formatCurrency(invoice.discountAmount, invoice.currency)}</span>
                </div>
              )}
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Tax ({invoice.taxPercent}%):</span>
                  <span>+{formatCurrency(invoice.taxAmount, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(invoice.totalAmount, invoice.currency)}</span>
              </div>

              {invoice.paidAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold pt-1">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Balance Due:</span>
                <span className={invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {formatCurrency(invoice.balanceDue, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment History if any */}
          {relatedPayments.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h5 className="font-bold text-slate-900 mb-2">Recorded Payments</h5>
              <div className="space-y-1.5">
                {relatedPayments.map((p) => (
                  <div key={p.id} className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-emerald-950">{p.paymentDate}</span>
                      <span className="text-slate-500 ml-2 capitalize">via {p.paymentMethod.replace('_', ' ')}</span>
                      {p.reference && <span className="text-slate-400 font-mono ml-2">({p.reference})</span>}
                    </div>
                    <span className="font-bold text-emerald-700">{formatCurrency(p.amount, invoice.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes and Terms Footer */}
          {(invoice.notes || invoice.terms) && (
            <div className="pt-6 border-t border-slate-200 space-y-2 text-[11px] text-slate-500">
              {invoice.notes && <p><strong>Notes:</strong> {invoice.notes}</p>}
              {invoice.terms && <p><strong>Terms:</strong> {invoice.terms}</p>}
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Invoice Status: <span className="font-bold text-slate-800 uppercase">{invoice.status.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={() => setEmailModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Invoice</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Template-Based Email Invoice Dialog */}
      <EmailInvoiceModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        invoice={invoice}
        customer={customer}
        onEmailSentSuccess={(res) => setEmailSentResult(res)}
      />
    </div>
  );
};
