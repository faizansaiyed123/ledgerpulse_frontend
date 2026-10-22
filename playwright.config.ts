import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/playwright-report.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_E2E_TEST_MODE: 'true',
      VITE_E2E_TEST_USER_ID: 'test-user',
      VITE_E2E_TEST_USER_EMAIL: 'test-user@example.test',
      VITE_E2E_TEST_USER_NAME: 'LedgerPulse E2E Owner',
      VITE_FIREBASE_API_KEY: 'e2e-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'e2e.local',
      VITE_FIREBASE_PROJECT_ID: 'e2e-ledgerpulse',
      VITE_FIREBASE_STORAGE_BUCKET: 'e2e.local',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
      VITE_FIREBASE_APP_ID: '1:000000000000:web:e2e',
    },
  },
});
