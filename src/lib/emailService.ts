import { Invoice, Organization, Customer } from '../types/index.ts';
import { formatCurrency } from './currency.ts';
import { generateInvoicePDF } from './pdf.ts';
import { api } from './api.ts';

export interface EmailTemplateData {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  bodyText: string;
  attachedFilename: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId: string;
  recipientEmail: string;
  sentAt: string;
  attachedFilename: string;
}

export function generateInvoiceEmailTemplate(
  invoice: Invoice,
  organization: Organization,
  customer?: Customer,
  customNote?: string,
): EmailTemplateData {
  const recipientName = customer?.name || invoice.customerName || 'Valued Customer';
  const recipientEmail = customer?.email || invoice.customerEmail || '';
  const companyName = organization.name || 'LedgerPulse Workspace';
  const currency = invoice.currency;
  const subject = `Invoice ${invoice.invoiceNumber} from ${companyName} (${formatCurrency(invoice.totalAmount, currency)})`;
  const attachedFilename = `${invoice.invoiceNumber}.pdf`;
  const bodyText = `Dear ${recipientName},\n\nPlease find attached invoice ${invoice.invoiceNumber} for ${formatCurrency(invoice.totalAmount, currency)} from ${companyName}.\n\nInvoice Summary:\n- Invoice Number: ${invoice.invoiceNumber}\n- Issue Date: ${invoice.issueDate}\n- Due Date: ${invoice.dueDate}\n- Total Amount: ${formatCurrency(invoice.totalAmount, currency)}\n- Balance Due: ${formatCurrency(invoice.balanceDue, currency)}\n\n${customNote ? `Note from ${companyName}:\n${customNote}\n\n` : ''}Payment Terms: ${invoice.terms || organization.invoiceTerms || 'Payment due within 30 days.'}\n\nThank you for your business.\n\nSincerely,\n${companyName} Billing Department\n${organization.email || ''}`;
  return { recipientEmail, recipientName, subject, bodyText, attachedFilename };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

export async function sendInvoiceEmail(
  invoice: Invoice,
  organization: Organization,
  customer?: Customer,
  customNote?: string,
  recipientOverride?: string,
): Promise<EmailSendResult> {
  const template = generateInvoiceEmailTemplate(invoice, organization, customer, customNote);
  const targetEmail = recipientOverride?.trim() || template.recipientEmail;
  if (!targetEmail) throw new Error('No recipient email address is available for this customer.');
  const doc = generateInvoicePDF(invoice, organization, customer);
  const pdfBase64 = await blobToBase64(doc.output('blob'));
  return api.sendInvoiceEmail(invoice.id, {
    recipientEmail: targetEmail,
    subject: template.subject,
    bodyText: template.bodyText,
    customNote: customNote || '',
    attachedFilename: template.attachedFilename,
    pdfBase64,
  });
}
