vi.mock('../../shared/external-integrations.js', () => ({
  externalIntegrationsEnabled: true,
}));
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import { FinanceIntegrationSection } from '../../client/components/finance-integration-section.js';
const state = vi.hoisted(() => ({
  read: true,
  send: true,
  user: 'finance',
  revision: 1,
  request: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<object>()),
  useApiClient: () => ({ request: state.request }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: state.user } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: ({ action }: { action: string }) => ({
    can: action === 'read' ? state.read : state.send,
  }),
  useAuthorizationRevision: () => state.revision,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const initial = {
  enabled: true,
  state: 'not_sent',
  voucherNumber: null,
  externalId: null,
  resultCode: null,
  updatedAt: null,
  busy: false,
};
beforeEach(() => {
  Object.assign(state, {
    read: true,
    send: true,
    user: 'finance',
    revision: 1,
  });
  state.request.mockReset().mockResolvedValue({ data: initial });
});
afterEach(cleanup);
function mount(status = 'paid') {
  const cache = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const element = () => (
    <QueryClientProvider client={cache}>
      <TestI18nProvider runtime={runtime}>
        <FinanceIntegrationSection
          kind='reimbursement'
          record={{ id: 'record-one', status }}
        />
      </TestI18nProvider>
    </QueryClientProvider>
  );
  const view = render(element());
  return { ...view, rerenderCurrent: () => view.rerender(element()) };
}
it('does not request finance data without read permission or before payment', () => {
  state.read = false;
  const view = mount();
  expect(screen.queryByRole('region')).not.toBeInTheDocument();
  expect(state.request).not.toHaveBeenCalled();
  view.unmount();
  state.read = true;
  mount('approved');
  expect(state.request).not.toHaveBeenCalled();
});
it('shows deployment configuration guidance without a send action', async () => {
  state.request.mockResolvedValue({ data: { ...initial, enabled: false } });
  mount();
  expect(
    await screen.findByText(/gateway has not been connected/),
  ).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Send to finance system' }),
  ).not.toBeInTheDocument();
});
it('requires confirmation, sends no client facts and distinguishes receipt from posting', async () => {
  state.request.mockImplementation(async ({ path, method }) => ({
    data:
      method !== 'POST'
        ? initial
        : path.endsWith('/send')
          ? { ...initial, state: 'accepted' }
          : { ...initial, state: 'posted', voucherNumber: 'V-42' },
  }));
  mount();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Send to finance system' }),
  );
  expect(state.request).toHaveBeenCalledTimes(1);
  await userEvent.click(
    screen.getByRole('button', { name: 'Send', exact: true }),
  );
  expect(
    await screen.findByText(
      'Received by the finance system; posting not confirmed',
    ),
  ).toBeVisible();
  expect(state.request).toHaveBeenCalledWith({
    path: 'financeIntegration/reimbursement/record-one/send',
    method: 'POST',
    json: {},
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Check external result' }),
  );
  expect(await screen.findByText('External voucher: V-42')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Retry sending' }),
  ).not.toBeInTheDocument();
});
it('discards cached finance facts after a permission revision fails and hides revoked access', async () => {
  state.request.mockResolvedValue({
    data: { ...initial, state: 'posted', voucherNumber: 'PRIVATE-V' },
  });
  const view = mount();
  await screen.findByText('External voucher: PRIVATE-V');
  state.request.mockRejectedValue(new Error('internal permission detail'));
  state.revision++;
  view.rerenderCurrent();
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load the finance status',
  );
  expect(
    screen.queryByText('External voucher: PRIVATE-V'),
  ).not.toBeInTheDocument();
  state.read = false;
  view.rerenderCurrent();
  await waitFor(() =>
    expect(screen.queryByRole('region')).not.toBeInTheDocument(),
  );
});
