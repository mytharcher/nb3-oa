import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import en from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/payment-requests-form.en-US.js';
import { AccountForm } from '../../../client/pages/payment-requests/payment-account.js';
const { api, close, reload } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  close: vi.fn(),
  reload: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('react-router', async (original) => ({
  ...(await original<typeof import('react-router')>()),
  useOutletContext: () => ({
    detail: { record: { id: 'r1', status: 'exception', lifecycleVersion: 7 } },
    reload,
    reloadDetail: reload,
  }),
}));
vi.mock('../../../client/components/use-route-overlay.js', () => ({
  useRouteOverlay: () => ({ close }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...en, ...copy } },
});
const account = {
  requestId: 'r1',
  bankName: 'Old Bank',
  bankAccount: 'OLD',
  bankAccountName: 'Payee',
  version: 3,
};
function show() {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <AccountForm
          account={account}
          loading={false}
          onBusy={vi.fn()}
          onDirty={vi.fn()}
          reloadAccount={reload}
        />
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
it('reconciles an uncertain PATCH with GET and never blindly repeats the bank write', async () => {
  api.request.mockImplementation(({ method, path }) =>
    method === 'PATCH'
      ? Promise.reject(new TypeError('Network'))
      : Promise.resolve({
          data: path.endsWith('/paymentAccount')
            ? { ...account, bankAccount: 'NEW', version: 4 }
            : {
                record: { id: 'r1', status: 'exception', lifecycleVersion: 8 },
              },
        }),
  );
  show();
  fireEvent.change(screen.getByLabelText('Account number *'), {
    target: { value: 'NEW' },
  });
  fireEvent.change(screen.getByLabelText('Correction reason *'), {
    target: { value: 'Correct error' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText(/write result is unconfirmed/);
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  fireEvent.click(screen.getAllByRole('button', { name: 'Load latest' })[0]);
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(
    api.request.mock.calls.filter(([v]) => v.method === 'PATCH'),
  ).toHaveLength(1);
  expect(api.request.mock.calls[0][0].json).toMatchObject({
    lifecycleVersion: 7,
    payeeVersion: 3,
    reason: 'Correct error',
    account: { bankAccount: 'NEW' },
  });
});
it('retains edited account text on conflict and uses freshly read dual versions only after explicit resubmission', async () => {
  let first = true;
  api.request.mockImplementation(({ method, path }) => {
    if (method === 'PATCH' && first) {
      first = false;
      return Promise.reject(new TypeError('Uncertain'));
    }
    if (method === 'PATCH') return Promise.resolve({ data: { version: 5 } });
    return Promise.resolve({
      data: path.endsWith('/paymentAccount')
        ? { ...account, version: 4 }
        : { record: { id: 'r1', status: 'exception', lifecycleVersion: 9 } },
    });
  });
  show();
  fireEvent.change(screen.getByLabelText('Account number *'), {
    target: { value: 'EDITED' },
  });
  fireEvent.change(screen.getByLabelText('Correction reason *'), {
    target: { value: 'Check account' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await screen.findByText(/write result is unconfirmed/);
  fireEvent.click(screen.getAllByRole('button', { name: 'Load latest' })[0]);
  await screen.findByText(/Latest facts loaded/);
  expect(screen.getByLabelText('Account number *')).toHaveValue('EDITED');
  expect(
    api.request.mock.calls.filter(([v]) => v.method === 'PATCH'),
  ).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(
    api.request.mock.calls.filter(([v]) => v.method === 'PATCH')[1][0].json,
  ).toMatchObject({
    lifecycleVersion: 9,
    payeeVersion: 4,
    account: { bankAccount: 'EDITED' },
  });
});
it('maps a server account field error, focuses the first field and preserves the correction draft', async () => {
  api.request.mockRejectedValue(
    new ApiClientError('Invalid', {
      status: 400,
      method: 'PATCH',
      url: '/paymentRequests/r1/paymentAccount',
      payload: {
        error: {
          fieldViolations: [
            { field: 'account.bankAccount', description: 'Invalid account' },
            { field: 'reason', description: 'Check reason' },
          ],
        },
      },
    } as ConstructorParameters<typeof ApiClientError>[1]),
  );
  show();
  fireEvent.change(screen.getByLabelText('Account number *'), {
    target: { value: 'KEEP' },
  });
  fireEvent.change(screen.getByLabelText('Correction reason *'), {
    target: { value: 'Keep reason' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Account number *')).toHaveFocus(),
  );
  expect(screen.getByLabelText('Account number *')).toHaveValue('KEEP');
  expect(screen.getByLabelText('Account number *')).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(screen.getAllByText('Check this field.')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
});
