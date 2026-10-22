import { test, expect, request as pwRequest, type Page } from '@playwright/test';

const authHeaders = {
  'X-Test-User-Id': 'test-user',
  'X-Test-User-Email': 'test-user@example.test',
  'X-Test-User-Name': 'LedgerPulse E2E Owner',
};

async function api() {
  return pwRequest.newContext({ baseURL: 'http://127.0.0.1:5000', extraHTTPHeaders: authHeaders });
}

async function currentOrgId(ctx: Awaited<ReturnType<typeof pwRequest.newContext>>) {
  const response = await ctx.get('/api/auth/me');
  expect(response.status()).toBe(200);
  const body = await response.json();
  return body.organizations[0].id as string;
}

async function openApp(page: Page) {
  await page.goto('/app?e2e-auth=1');
  await expect(page.getByRole('heading', { name: 'Executive Financial Dashboard' })).toBeVisible();
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: `test-results/visuals/${name}.png`, fullPage: true });
}

test.describe.serial('LedgerPulse integrated browser journeys', () => {
  test('bootstrap, load real backend seed data and render dashboard', async ({ page }) => {
    const ctx = await api();
    const orgId = await currentOrgId(ctx);
    expect(orgId).toBeTruthy();

    await openApp(page);
    await page.getByRole('button', { name: 'Load Sample Data' }).click();
    await expect(page.getByText('Starlight Media Group')).toBeVisible();

    const customers = await ctx.get(`/api/customers?org_id=${orgId}`);
    expect((await customers.json())).toHaveLength(4);

    const invoices = await ctx.get(`/api/invoices?org_id=${orgId}`);
    expect((await invoices.json())).toHaveLength(4);

    const expenses = await ctx.get(`/api/expenses?org_id=${orgId}`);
    expect((await expenses.json())).toHaveLength(4);

    await capture(page, '04-dashboard-seeded');
    await ctx.dispose();
  });

  test('invoice management creates, edits, finalizes, duplicates, downloads PDF and deletes a draft', async ({ page }) => {
    await openApp(page);
    await page.locator('aside').getByRole('button', { name: /^Invoices/ }).click();
    await expect(page.getByRole('heading', { name: 'Invoice Management' })).toBeVisible();
    await capture(page, '05-invoices-list');

    await page.getByRole('button', { name: 'New Invoice' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Invoice' })).toBeVisible();

    const modal = page.locator('div.fixed.inset-0').last();
    const invoiceNumber = modal.locator('input').first();
    await invoiceNumber.fill('INV-E2E-001');

    const selects = modal.locator('select');
    await selects.first().selectOption({ label: /Starlight Media Group/ });

    await modal.getByPlaceholder('Service or product description...').fill('End-to-end implementation service');
    const numberInputs = modal.locator('input[type="number"]');
    await numberInputs.nth(0).fill('2');
    await numberInputs.nth(1).fill('500');
    await modal.getByRole('button', { name: 'Finalize & Issue Invoice' }).click();

    await expect(page.getByText('INV-E2E-001')).toBeVisible();

    const row = page.locator('tr').filter({ hasText: 'INV-E2E-001' }).first();
    await row.getByTitle('View Invoice').click();
    await expect(page.getByRole('heading', { name: /INVOICE/ })).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTitle('Download formatted PDF invoice').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);

    await page.getByTitle('Edit Invoice').click();
    await expect(page.getByRole('heading', { name: /Edit Invoice: INV-E2E-001/ })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).last().click();

    await row.getByTitle('Duplicate').click();
    await expect(page.locator('tr').filter({ hasText: /INV-E2E-001/ })).toHaveCount(2);

    page.once('dialog', dialog => dialog.accept());
    await page.locator('tr').filter({ hasText: 'INV-E2E-001' }).last().getByTitle('Delete').click();
    await expect(page.locator('tr').filter({ hasText: 'INV-E2E-001' })).toHaveCount(1);

    await capture(page, '06-invoice-management-success');
  });

  test('payment flow updates invoice balance and ledger', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Invoices' }).click();
    const row = page.locator('tr').filter({ hasText: 'INV-2026-003' }).first();
    await expect(row).toBeVisible();
    await row.getByTitle('View Invoice').click();
    await expect(page.getByText('INV-2026-003')).toBeVisible();

    const paymentButton = page.getByRole('button', { name: /Record Payment/ }).first();
    await expect(paymentButton).toBeVisible();
    await paymentButton.click();
    await expect(page.getByText(/Record Payment/).last()).toBeVisible();

    const dialog = page.locator('div.fixed.inset-0').last();
    const amountInput = dialog.locator('input[type="number"]').first();
    await amountInput.fill('500');
    await dialog.getByRole('button', { name: /Record Payment/ }).last().click();

    await expect(page.getByRole('heading', { name: 'Invoice Management' })).toBeVisible();
    const paymentCtx = await api();
    const orgId = await currentOrgId(paymentCtx);
    const payments = await paymentCtx.get(`/api/payments?org_id=${orgId}&invoice_id=inv_103`);
    const paymentRows = await payments.json();
    expect(paymentRows.some((item: { amount: number }) => item.amount === 500)).toBeTruthy();
    await paymentCtx.dispose();

    await page.getByRole('button', { name: 'Payments' }).click();
    await expect(page.getByRole('heading', { name: 'Payment Reconciliation & Ledger' })).toBeVisible();
    await capture(page, '07-payment-ledger');
  });

  test('expense lifecycle creates, edits, approves and deletes a real backend expense', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Expenses' }).click();
    await expect(page.getByRole('heading', { name: 'Expense Management' })).toBeVisible();

    await page.getByRole('button', { name: 'Add Expense' }).click();
    const modal = page.locator('div.fixed.inset-0').last();
    await modal.getByPlaceholder('e.g. AWS Cloud ECS Clusters & S3').fill('E2E cloud tooling');
    const expenseNumbers = modal.locator('input[type="number"]');
    await expenseNumbers.nth(0).fill('125.50');
    await expenseNumbers.nth(1).fill('5.50');
    await modal.getByRole('button', { name: 'Record Expense' }).click();

    await expect(page.getByText('E2E cloud tooling')).toBeVisible();
    const row = page.locator('tr').filter({ hasText: 'E2E cloud tooling' }).first();
    await row.getByTitle('Edit').click();
    const edit = page.locator('div.fixed.inset-0').last();
    await edit.getByPlaceholder('e.g. AWS Cloud ECS Clusters & S3').fill('E2E cloud tooling updated');
    await edit.getByRole('button', { name: 'Save Changes' }).click();

    await expect(page.getByText('E2E cloud tooling updated')).toBeVisible();
    const updatedRow = page.locator('tr').filter({ hasText: 'E2E cloud tooling updated' }).first();
    await updatedRow.getByTitle('Approve').click();
    await expect(page.getByText('E2E cloud tooling updated')).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await updatedRow.getByTitle('Delete').click();
    await expect(page.getByText('E2E cloud tooling updated')).toHaveCount(0);

    await capture(page, '08-expense-lifecycle');
  });

  test('customer and vendor directory supports create, update and delete', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Customers' }).click();
    await expect(page.getByRole('heading', { name: 'Clients & Vendors Directory' })).toBeVisible();

    await page.getByRole('button', { name: /Add Customer/ }).click();
    let modal = page.locator('div.fixed.inset-0').last();
    await modal.getByPlaceholder('Jane Smith').fill('E2E Customer');
    await modal.getByPlaceholder('Starlight Media Group Inc.').fill('E2E Customer Ltd');
    await modal.getByPlaceholder('billing@customer.com').fill('e2e-customer@example.test');
    await modal.getByRole('button', { name: /Save Customer|Create Customer/ }).click();
    await expect(page.getByText('E2E Customer')).toBeVisible();

    await page.getByRole('button', { name: 'Vendors' }).click();
    await expect(page.getByText('Amazon Web Services')).toBeVisible();
    await page.getByRole('button', { name: /Add Vendor/ }).click();
    modal = page.locator('div.fixed.inset-0').last();
    await modal.getByPlaceholder('Amazon Web Services').fill('E2E Vendor');
    await modal.getByRole('button', { name: /Save Vendor|Create Vendor/ }).click();
    await expect(page.getByText('E2E Vendor')).toBeVisible();

    const customerRow = page.locator('tr').filter({ hasText: 'E2E Customer' }).first();
    await customerRow.getByTitle('Edit Customer').click();
    modal = page.locator('div.fixed.inset-0').last();
    await modal.getByPlaceholder('Jane Smith').fill('E2E Customer Updated');
    await modal.getByRole('button', { name: 'Save Customer' }).click();
    await expect(page.getByText('E2E Customer Updated')).toBeVisible();

    page.once('dialog', dialog => dialog.accept());
    await customerRow.getByTitle('Delete Customer').click();

    const vendorRow = page.locator('tr').filter({ hasText: 'E2E Vendor' }).first();
    await vendorRow.getByTitle('Edit Vendor').click();
    modal = page.locator('div.fixed.inset-0').last();
    await modal.getByPlaceholder('Amazon Web Services').fill('E2E Vendor Updated');
    await modal.getByRole('button', { name: 'Save Vendor' }).click();
    await expect(page.getByText('E2E Vendor Updated')).toBeVisible();
    const updatedVendorRow = page.locator('tr').filter({ hasText: 'E2E Vendor Updated' }).first();
    page.once('dialog', dialog => dialog.accept());
    await updatedVendorRow.getByTitle('Delete Vendor').click();
    await expect(page.getByText('E2E Vendor Updated')).toHaveCount(0);

    await capture(page, '09-contacts-directory');
  });

  test('recurring billing creates a schedule and executes due generation', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Recurring Billing' }).click();
    await expect(page.getByRole('heading', { name: 'Recurring Invoices & Automation' })).toBeVisible();
    await page.getByRole('button', { name: /Create Recurring|New Recurring/ }).click();

    const modal = page.locator('div.fixed.inset-0').last();
    await modal.getByRole('combobox').first().selectOption({ label: /Starlight Media Group/ });
    await modal.getByRole('combobox').nth(1).selectOption('monthly');
    await modal.locator('input[type="number"]').first().fill('250');
    await modal.locator('input[type="date"]').first().fill(new Date().toISOString().slice(0,10));
    await modal.locator('input[placeholder*="Service"]').fill('E2E recurring service');
    await modal.getByRole('button', { name: 'Create Schedule' }).click();
    await expect(page.getByText('E2E recurring service')).toBeVisible();

    await page.getByRole('button', { name: 'Run Scheduled Batch Now' }).click();
    await capture(page, '10-recurring-billing');
  });

  test('reports, team settings, notifications and platform admin render with real data', async ({ page }) => {
    await openApp(page);

    const originalWorkspaceName = (await page.locator('aside').getByRole('button').first().innerText()).split('\n')[0];
    await page.locator('aside').getByRole('button').first().click();
    await page.getByRole('button', { name: 'New Workspace' }).click();
    await expect(page.getByRole('heading', { name: 'Create New Workspace' })).toBeVisible();
    const workspaceModal = page.locator('div.fixed.inset-0').last();
    await workspaceModal.getByPlaceholder('Acme Holdings Ltd.').fill('LedgerPulse E2E Secondary Workspace');
    await workspaceModal.locator('select').selectOption('INR');
    await workspaceModal.getByRole('button', { name: 'Create Workspace' }).click();
    await expect(page.locator('aside').getByText('LedgerPulse E2E Secondary Workspace')).toBeVisible();

    await page.locator('aside').getByRole('button').first().click();
    await page.locator('aside').locator('div.absolute').getByRole('button', { name: originalWorkspaceName, exact: true }).click();
    await expect(page.locator('aside').getByText(originalWorkspaceName)).toBeVisible();

    await page.getByRole('button', { name: 'Reports & P&L' }).click();
    await expect(page.getByRole('heading', { name: 'Financial Reports & Intelligence' })).toBeVisible();
    await expect(page.getByText('Expenses by Category')).toBeVisible();
    await capture(page, '11-financial-reports');

    await page.getByRole('button', { name: /Team & Roles/ }).click();
    await expect(page.getByRole('heading', { name: 'Organization & Team Settings' })).toBeVisible();
    await expect(page.getByText(/Team Members/)).toBeVisible();

    await page.getByRole('button', { name: /Invite Team Member/ }).click();
    const invite = page.locator('div.fixed.inset-0').last();
    await invite.getByPlaceholder('Sarah Jenkins').fill('E2E Invitee');
    await invite.getByPlaceholder('sarah@company.com').fill('e2e-invitee@example.test');
    await invite.getByRole('button', { name: 'Send Invitation' }).click();
    await expect(page.getByText(/Invitation|e2e-invitee@example.test|invitation/i).last()).toBeVisible();

    await page.getByRole('button', { name: 'Business Profile & Invoicing' }).click();
    const companyName = page.getByLabel(/Company Legal Name/);
    await companyName.fill('LedgerPulse E2E Holdings');
    await page.getByRole('button', { name: 'Save Business Settings' }).click();
    await expect(page.getByText('Settings saved successfully')).toBeVisible();

    const bell = page.locator('button:has(svg.lucide-bell)').first();
    await bell.click();
    await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible();
    if (await page.getByRole('button', { name: 'Mark all read' }).count()) {
      await page.getByRole('button', { name: 'Mark all read' }).click();
    }
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Platform Admin' }).click();
    await expect(page.getByRole('heading', { name: /Platform Operations & Multi-Tenant Control/ })).toBeVisible();
    await expect(page.getByText('Tenant Workspaces Directory')).toBeVisible();

    await capture(page, '12-team-settings-and-admin');
  });

  test('backend errors, tenant isolation, financial validation and public API failures are enforced', async ({ page }) => {
    const ctx = await api();
    const orgId = await currentOrgId(ctx);

    expect((await ctx.get('/api/does-not-exist')).status()).toBe(404);
    const anon = await pwRequest.newContext({ baseURL: 'http://127.0.0.1:5000' });
    expect((await anon.get('/api/auth/me')).status()).toBe(401);
    await anon.dispose();

    const second = await pwRequest.newContext({
      baseURL: 'http://127.0.0.1:5000',
      extraHTTPHeaders: {
        'X-Test-User-Id': 'other-user',
        'X-Test-User-Email': 'other@example.test',
        'X-Test-User-Name': 'Other User',
      },
    });
    const boot = await second.post('/api/auth/bootstrap');
    expect(boot.status()).toBe(200);
    const otherOrg = (await boot.json()).organizations[0].id;
    expect((await ctx.get(`/api/customers?org_id=${otherOrg}`)).status()).toBe(403);

    const invoiceRows = await (await ctx.get(`/api/invoices?org_id=${orgId}`)).json();
    const targetInvoiceId = invoiceRows[0]?.id;
    expect(targetInvoiceId).toBeTruthy();

    const over = await ctx.post('/api/payments', {
      data: {
        invoiceId: targetInvoiceId,
        amount: 999999,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date().toISOString().slice(0, 10),
      },
    });
    expect(over.status()).toBe(409);

    const missingOrg = await ctx.get('/api/customers');
    expect(missingOrg.status()).toBe(400);

    const contact = await ctx.post('/api/contact', { data: { name: 'E2E', email: 'e2e@example.test', subject: 'SMTP', message: 'No SMTP configured' } });
    expect(contact.status()).toBe(503);

    const admin = await ctx.get('/api/admin/overview');
    expect(admin.status()).toBe(200);

    const activities = await ctx.get(`/api/activities?org_id=${orgId}&limit=200`);
    expect(activities.status()).toBe(200);

    await second.dispose();
    await ctx.dispose();
    await openApp(page);
    await page.screenshot({ path: 'test-results/visuals/13-final-success.png', fullPage: true });
  });
});
