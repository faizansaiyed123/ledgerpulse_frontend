# LedgerPulse interactive demo

The `demo` branch keeps the existing browser-local LedgerPulse simulation and makes its external-communication paths explicit simulations too.

## Launch

```bash
npm ci
npm run dev
```

Open the Vite URL and choose **Launch Interactive Demo** on the public landing page. No Firebase project, API server, PostgreSQL database, SMTP account, or backend deployment is required.

## What is simulated

The browser demo loads the seeded Apex Cloud Solutions workspace and supports the existing local workflows: invoices and invoice calculations, customers, vendors, expenses and approvals, payments and batch payments, recurring invoices, financial reports, activity history, team membership and roles, organization settings, invoice PDF generation, and notifications.

Changes made in the demo are kept in browser-local storage for the demo profile. They do not write to the production API or to `main` data.

Invoice email is a local simulation. The PDF is generated in the browser, the invoice state can move to sent, and the UI explicitly says that no email was transmitted. The public contact form is also staged locally and explicitly says that no inquiry was delivered.

## Optional standalone backend simulator

The companion `ledgerpulse_backend` repository has its own `demo` branch. Its Flask simulator can be run independently for API exploration and tests, but the frontend demo does not connect to or require it.

See the backend repository's `DEMO.md` for startup and safety notes.