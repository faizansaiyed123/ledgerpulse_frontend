import { jsPDF } from 'jspdf';
import { Invoice, Organization, Customer } from '../types/index.ts';
import { formatCurrency } from './currency.ts';

export function generateInvoicePDF(
  invoice: Invoice,
  organization: Organization,
  customer?: Customer
): jsPDF {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  let y = margin;

  // Header Background Accent bar (Navy/Slate gradient aesthetic)
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Company Brand Box with Initials
  doc.setFillColor(37, 99, 235); // blue-600
  doc.roundedRect(margin, y + 2, 10, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  const orgInitials = (organization.name || 'LP').slice(0, 2).toUpperCase();
  doc.text(orgInitials, margin + 5, y + 8.5, { align: 'center' });

  // Company Legal Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(organization.name || 'Company Name', margin + 14, y + 9);

  // INVOICE title right-aligned
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.text('INVOICE', pageWidth - margin, y + 9, { align: 'right' });

  y += 18;

  // Company details left
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139); // slate-500
  if (organization.taxId) {
    doc.text(`Tax ID / VAT: ${organization.taxId}`, margin, y);
    y += 4.5;
  }
  if (organization.email) {
    doc.text(organization.email, margin, y);
    y += 4.5;
  }
  if (organization.phone) {
    doc.text(organization.phone, margin, y);
    y += 4.5;
  }
  if (organization.address) {
    doc.text(`${organization.address}${organization.city ? `, ${organization.city}` : ''}`, margin, y);
    y += 4.5;
  }

  // Invoice Meta Box right
  const metaBoxX = pageWidth - margin - 65;
  let metaY = margin + 18;
  doc.setFontSize(8.5);
  
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice Number:', metaBoxX, metaY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.invoiceNumber, pageWidth - margin, metaY, { align: 'right' });

  metaY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Issue Date:', metaBoxX, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.issueDate, pageWidth - margin, metaY, { align: 'right' });

  metaY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Due Date:', metaBoxX, metaY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.dueDate, pageWidth - margin, metaY, { align: 'right' });

  metaY += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Status:', metaBoxX, metaY);
  doc.setFont('helvetica', 'bold');
  const statusUpper = invoice.status.toUpperCase().replace('_', ' ');
  if (invoice.status === 'paid') {
    doc.setTextColor(16, 185, 129); // green
  } else if (invoice.status === 'overdue') {
    doc.setTextColor(239, 68, 68); // red
  } else if (invoice.status === 'partially_paid') {
    doc.setTextColor(37, 99, 235); // blue
  } else {
    doc.setTextColor(100, 116, 139); // slate
  }
  doc.text(statusUpper, pageWidth - margin, metaY, { align: 'right' });

  y = Math.max(y, metaY) + 8;

  // Divider line
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 7;

  // Bill To Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('BILLED TO', margin, y);
  y += 5.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customerName || customer?.name || 'Valued Customer', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  if (customer?.company && customer.company !== customer.name) {
    doc.text(customer.company, margin, y);
    y += 4.5;
  }
  if (customer?.email || invoice.customerEmail) {
    doc.text(customer?.email || invoice.customerEmail || '', margin, y);
    y += 4.5;
  }
  if (customer?.billingAddress) {
    doc.text(customer.billingAddress, margin, y);
    y += 4.5;
  }
  if (customer?.taxId) {
    doc.text(`Tax ID: ${customer.taxId}`, margin, y);
    y += 4.5;
  }

  y += 6;

  // Line Items Table Header
  const colDesc = margin + 2;
  const colQty = margin + 92;
  const colUnit = margin + 116;
  const colTax = margin + 140;
  const colTotal = pageWidth - margin - 2;

  doc.setFillColor(241, 245, 249); // slate-100
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 7, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', colDesc, y + 4.8);
  doc.text('QTY', colQty, y + 4.8, { align: 'right' });
  doc.text('UNIT PRICE', colUnit, y + 4.8, { align: 'right' });
  doc.text('TAX', colTax, y + 4.8, { align: 'right' });
  doc.text('AMOUNT', colTotal, y + 4.8, { align: 'right' });

  y += 9;

  // Line items
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  invoice.items.forEach((item, index) => {
    // Check if new page is needed
    if (y > pageHeight - 75) {
      doc.addPage();
      y = margin;
    }

    const rowBg = index % 2 === 1;
    if (rowBg) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3.5, pageWidth - (margin * 2), 7, 'F');
    }

    doc.text(item.description, colDesc, y + 1.2, { maxWidth: 82 });
    doc.text(String(item.quantity), colQty, y + 1.2, { align: 'right' });
    doc.text(formatCurrency(item.unitPrice, invoice.currency), colUnit, y + 1.2, { align: 'right' });
    doc.text(item.taxRatePercent ? `${item.taxRatePercent}%` : '0%', colTax, y + 1.2, { align: 'right' });
    doc.text(formatCurrency(item.amount, invoice.currency), colTotal, y + 1.2, { align: 'right' });

    y += 7;
  });

  // Table bottom border
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Calculation summary box right-aligned
  const summaryBoxX = pageWidth - margin - 75;
  const summaryValX = pageWidth - margin;

  doc.setFontSize(8.5);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', summaryBoxX, y);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), summaryValX, y, { align: 'right' });
  y += 5.5;

  // Discount if any
  if (invoice.discountAmount > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(`Discount (${invoice.discountPercent}%):`, summaryBoxX, y);
    doc.setTextColor(239, 68, 68);
    doc.text(`-${formatCurrency(invoice.discountAmount, invoice.currency)}`, summaryValX, y, { align: 'right' });
    y += 5.5;
  }

  // Tax
  if (invoice.taxAmount > 0) {
    doc.setTextColor(100, 116, 139);
    doc.text(`Tax (${invoice.taxPercent}%):`, summaryBoxX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(formatCurrency(invoice.taxAmount, invoice.currency), summaryValX, y, { align: 'right' });
    y += 5.5;
  }

  // Total
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(summaryBoxX - 4, y - 3.5, 80, 9, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Total:', summaryBoxX, y + 2.5);
  doc.text(formatCurrency(invoice.totalAmount, invoice.currency), summaryValX, y + 2.5, { align: 'right' });
  y += 11;

  // Paid amount & Balance Due
  if (invoice.paidAmount > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(16, 185, 129);
    doc.text('Amount Paid:', summaryBoxX, y);
    doc.text(formatCurrency(invoice.paidAmount, invoice.currency), summaryValX, y, { align: 'right' });
    y += 5.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(invoice.balanceDue > 0 ? 220 : 16, invoice.balanceDue > 0 ? 38 : 185, invoice.balanceDue > 0 ? 38 : 129);
  doc.text('Balance Due:', summaryBoxX, y);
  doc.text(formatCurrency(invoice.balanceDue, invoice.currency), summaryValX, y, { align: 'right' });

  // Payment Instructions & Remittance Box left
  const bottomY = Math.max(y + 12, pageHeight - 50);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, bottomY - 3, 100, 30, 1, 1, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, bottomY - 3, 100, 30, 1, 1, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('REMITTANCE ADVICE & TERMS', margin + 3, bottomY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const termsText = invoice.terms || organization.invoiceTerms || `Payment due within ${organization.paymentTermsDays || 30} days.`;
  doc.text(termsText, margin + 3, bottomY + 7, { maxWidth: 94 });

  if (invoice.notes || organization.invoiceNotes) {
    const notesText = invoice.notes || organization.invoiceNotes || '';
    doc.text(notesText, margin + 3, bottomY + 13, { maxWidth: 94 });
  }

  // Authorized Signature line right
  const sigX = pageWidth - margin - 60;
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, bottomY + 20, pageWidth - margin, bottomY + 20);
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Authorized Signature & Date', sigX + 8, bottomY + 24);

  // Footer branding and page indicator
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated with LedgerPulse SaaS Platform • Page 1 of 1', pageWidth / 2, pageHeight - 8, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(
  invoice: Invoice,
  organization: Organization,
  customer?: Customer
) {
  const doc = generateInvoicePDF(invoice, organization, customer);
  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function exportToCSV(filename: string, rows: (string | number)[][]) {
  const processRow = (row: (string | number)[]) => {
    return row
      .map((val) => {
        const text = String(val ?? '').replace(/"/g, '""');
        return `"${text}"`;
      })
      .join(',');
  };

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
