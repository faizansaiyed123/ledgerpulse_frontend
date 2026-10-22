# LedgerPulse — End-to-End Visual Walkthrough

> Curated screenshots are captured only after their corresponding browser assertions pass. Failure screenshots and traces remain in CI artifacts.

**Browser:** Chromium controlled by Playwright  
**Viewport:** 1280 × 720  
**Backend:** Flask API using disposable SQLite in CI  
**Authentication:** isolated CI test identity; no production Firebase credentials are used

## Coverage

Public website, pricing/FAQ/legal, contact failure handling, interactive demo and role switching, authenticated dashboard bootstrap, sample-data loading, invoices, payments, expenses, customers, vendors, recurring billing, reports, team management, organization settings, notifications, platform administration, tenant isolation, authorization failures, financial validation and API error handling.

## Evidence

![01-public-landing](visuals/01-public-landing.png)

![02-public-contact-error](visuals/02-public-contact-error.png)

![03-demo-dashboard](visuals/03-demo-dashboard.png)

![04-dashboard-seeded](visuals/04-dashboard-seeded.png)

![05-invoices-list](visuals/05-invoices-list.png)

![06-invoice-management-success](visuals/06-invoice-management-success.png)

![07-payment-ledger](visuals/07-payment-ledger.png)

![08-expense-lifecycle](visuals/08-expense-lifecycle.png)

![09-contacts-directory](visuals/09-contacts-directory.png)

![10-recurring-billing](visuals/10-recurring-billing.png)

![11-financial-reports](visuals/11-financial-reports.png)

![12-team-settings-and-admin](visuals/12-team-settings-and-admin.png)

![13-final-success](visuals/13-final-success.png)

## Verification note

Each published image is emitted only after its workflow checkpoint passes. API assertions independently verify persistence, authorization, tenant ownership and validation behavior.
