import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import enUS from '../../../client/locales/en-US.js';
import { PaymentAccountSection } from '../../../client/pages/reimbursement-requests/payment-account.js';
import type { ReimbursementRecord } from '../../../client/pages/reimbursement-requests/types.js';
const { api, identity } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  identity: { id: 'owner', can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: identity.id } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: identity.can, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const record = {
  id: 'r1',
  applicantId: 'owner',
  createdById: 'owner',
  status: 'exception',
  lifecycleVersion: 7,
} as ReimbursementRecord;
const content = () => (
  <TestI18nProvider runtime={runtime}>
    <MemoryRouter>
      <PaymentAccountSection record={record} refreshKey={0} canWrite />
    </MemoryRouter>
  </TestI18nProvider>
);
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  identity.id = 'owner';
  identity.can = true;
});
it('clears the previous viewer account synchronously and keeps a domain refusal local', async () => {
  api.request.mockResolvedValueOnce({
    data: {
      requestId: 'r1',
      bankName: 'Private Bank',
      bankAccount: 'Sensitive 123',
      bankAccountName: 'Owner',
      version: 3,
    },
  });
  const result = render(content());
  await screen.findByText('Sensitive 123');
  identity.id = 'manager';
  let rejectRead!: (error: unknown) => void;
  api.request.mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        rejectRead = reject;
      }),
  );
  result.rerender(content());
  expect(screen.queryByText('Sensitive 123')).not.toBeInTheDocument();
  await waitFor(() => expect(rejectRead).toBeDefined());
  rejectRead(
    new ApiClientError('Denied', {
      status: 403,
      method: 'GET',
      url: '/api/reimbursementRequests/r1/paymentAccount',
    } as ConstructorParameters<typeof ApiClientError>[1]),
  );
  await screen.findByText('Payment account access is denied.');
  expect(
    screen.queryByRole('button', { name: 'Correct payment account' }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Sensitive 123')).not.toBeInTheDocument();
});
it('does not invent a payee version or offer correction when no private row exists', async () => {
  api.request.mockResolvedValue({ data: null });
  render(content());
  await screen.findByText('No saved payment account.');
  expect(
    screen.queryByRole('button', { name: 'Correct payment account' }),
  ).not.toBeInTheDocument();
  expect(
    api.request.mock.calls.every(([input]) => input.method !== 'PATCH'),
  ).toBe(true);
});
