import { test, expect } from '@playwright/test';

test.describe('public website and demo experience', () => {
  test('landing page, pricing, FAQ, legal, contact failure and interactive demo', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !/Failed to load resource|net::ERR_/.test(message.text())) {
        errors.push(message.text());
      }
    });

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Financial Clarity');
    await expect(page.getByText('Custom Invoice Builder')).toBeVisible();
    await expect(page.getByText('Smart Expense Tracking')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recurring Automation' })).toBeVisible();
    await expect(page.getByText('Financial Reports & Exports')).toBeVisible();

    await page.screenshot({ path: 'test-results/visuals/01-public-landing.png', fullPage: true });

    const annual = page.getByRole('button', { name: /Annual Billing/ });
    await annual.click();
    await expect(page.getByText('$15').first()).toBeVisible();
    await expect(page.getByText('$39').first()).toBeVisible();
    await expect(page.getByText('$79').first()).toBeVisible();

    const faq = page.getByRole('button').filter({ hasText: /How does LedgerPulse keep my financial data secure/i }).first();
    if (await faq.count()) {
      await faq.click();
      await expect(page.getByText(/tenant|organization/i).last()).toBeVisible();
    }

    await page.getByRole('button', { name: 'Privacy Policy' }).last().click();
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();

    const form = page.locator('form').last();
    await form.getByPlaceholder('Jane Doe').fill('E2E Contact');
    await form.getByPlaceholder('jane@company.com').fill('e2e-contact@example.test');
    await form.getByPlaceholder('Enterprise Migration or Custom Integration').fill('E2E delivery configuration');
    await form.getByPlaceholder('Tell us about your team size, expected invoice volume, and required capabilities...').fill('Testing the public contact flow without SMTP credentials.');
    await form.getByRole('button', { name: /Send Inquiry/ }).click();
    await expect(page.getByText('Inquiry Submitted')).toHaveCount(0);
    await expect(page.getByText(/SMTP|email|delivery|configured/i).last()).toBeVisible();
    await page.screenshot({ path: 'test-results/visuals/02-public-contact-error.png' });

    await page.getByRole('button', { name: 'Launch Interactive Demo' }).click();
    await expect(page.getByRole('heading', { name: 'Executive Financial Dashboard' })).toBeVisible();
    await expect(page.getByRole('main').getByText('Apex Cloud Solutions Inc.', { exact: true })).toBeVisible();
    await page.screenshot({ path: 'test-results/visuals/03-demo-dashboard.png' });

    const roleSwitcher = page.getByRole('button', { name: /owner/i }).first();
    await expect(roleSwitcher).toBeVisible();
    await roleSwitcher.click();
    await page.getByRole('button', { name: /Accountant/ }).click();
    await expect(page.getByRole('button', { name: /Accountant/ }).first()).toBeVisible();

    await expect(errors).toEqual([]);
  });
});
