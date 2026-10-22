import { request } from '@playwright/test';

export default async function globalSetup() {
  const api = await request.newContext({ baseURL: 'http://127.0.0.1:5000' });
  const headers = {
    'X-Test-User-Id': 'test-user',
    'X-Test-User-Email': 'test-user@example.test',
    'X-Test-User-Name': 'LedgerPulse E2E Owner',
  };
  const response = await api.post('/api/auth/bootstrap', { headers });
  if (![200, 201].includes(response.status())) {
    throw new Error(`E2E bootstrap failed: ${response.status()} ${await response.text()}`);
  }
  await api.dispose();
}
