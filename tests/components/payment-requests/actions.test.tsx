import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Outlet, Routes, Route } from 'react-router';
import en from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/payment-actions.en-US.js';
import { ActionForm } from '../../../client/pages/payment-requests/action-dialog.js';
import type { PaymentDetail } from '../../../client/pages/payment-requests/types.js';
import type { OfferedAction } from '@nocobase/app-plugin-approval/client';
const { api, close, picker } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  close: vi.fn(),
  picker: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('../../../client/components/use-route-overlay.js', () => ({
  useRouteOverlay: () => ({ close }),
}));
vi.mock('../../../client/components/approval-recipient-picker.js', () => ({
  ApprovalRecipientPicker: (props: {
    id: string;
    onChange: (v: string) => void;
    target: unknown;
    focusRef: (node: HTMLInputElement | null) => void;
  }) => {
    picker(props);
    return (
      <input
        ref={props.focusRef}
        id={props.id}
        onChange={(e) => props.onChange(e.target.value)}
      />
    );
  },
}));
vi.mock('../../../client/pages/payment-requests/attachments.js', () => ({
  PaymentAttachmentEditor: ({
    onChange,
    purpose,
  }: {
    onChange: (v: string[]) => void;
    purpose: string;
  }) => (
    <button
      type='button'
      onClick={() => {
        expect(purpose).toBe('voucher');
        onChange(['voucher-file']);
      }}
    >
      Add voucher evidence
    </button>
  ),
}));
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: {
      ...en,
      paymentRequests: { ...en.paymentRequests, ...copy },
    },
  },
});
const detail = {
  record: {
    id: 'r1',
    number: 'R-1',
    amountCents: 10000,
    lifecycleVersion: 3,
    lines: [
      {
        id: 'line-1',
        date: '2026-10-10',
        category: 'office',
        invoiceNumber: 'INV',
        amountCents: 10000,
      },
    ],
  },
  users: [],
  view: { available: [] },
  runs: [],
  taskActions: [],
  runActions: [],
} as unknown as PaymentDetail;
function offered(
  name: string,
  target: { taskId: string } | { runId: string } = { taskId: 't1' },
): OfferedAction {
  return {
    name,
    target,
    task: { id: 't1', subject: 'line-1', stage: 'finance' },
    run: null,
    options: {},
    contentHash: 'full-submitted-run-hash',
    reasonRequired: false,
    key: name,
    primary: true,
    tone: 'normal',
    onBehalfOf: null,
  } as unknown as OfferedAction;
}
function show(name: string, action?: OfferedAction, current = detail) {
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={['/action']}>
        <Routes>
          <Route
            element={
              <Outlet
                context={{
                  reload: vi.fn(),
                  reloadDetail: vi.fn(),
                  applyRecord: vi.fn(),
                }}
              />
            }
          >
            <Route
              path='/action'
              element={
                <>
                  <ActionForm
                    detail={current}
                    name={name}
                    targetId={
                      action
                        ? 'taskId' in action.target
                          ? action.target.taskId
                          : action.target.runId
                        : 'r1'
                    }
                    action={action}
                    allowed
                    onBusy={vi.fn()}
                    onDirty={vi.fn()}
                    onComplete={vi.fn()}
                    reload={vi.fn()}
                  />
                  <button type='submit' form='payment-action'>
                    Apply
                  </button>
                </>
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  api.request.mockResolvedValue({ data: { record: detail.record } });
  close.mockResolvedValue(undefined);
});
it('submits from the action form without a second confirmation and prevents duplicate writes', async () => {
  let finish!: (value: unknown) => void;
  api.request.mockImplementationOnce(
    () => new Promise((resolve) => (finish = resolve)),
  );
  show('submit', undefined, {
    ...detail,
    view: { available: [{ name: 'submit', allowed: true }] },
  } as unknown as PaymentDetail);
  expect(screen.getByText(copy.actionForm.submitConsequence)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(api.request).toHaveBeenCalledOnce());
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(api.request).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      path: 'paymentRequests/r1/transition',
      json: {
        transition: 'submit',
        version: 3,
        input: {},
        requestId: expect.any(String),
      },
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(screen.getByLabelText('Opinion or reason')).toBeDisabled();
  finish({ data: {} });
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).toHaveBeenCalledOnce();
});
it('sends an ordinary finance decision with empty input and the full offered run hash', async () => {
  show('approve', offered('approve'));
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'paymentRequests/r1/action',
        json: expect.objectContaining({
          target: { taskId: 't1' },
          action: 'approve',
          input: {},
          contentHash: 'full-submitted-run-hash',
        }),
      }),
    ),
  );
  expect(close).toHaveBeenCalledOnce();
});
it('requires a voucher and records the exact cashier complete contract after confirmation', async () => {
  const action = {
    ...offered('complete'),
    task: { ...offered('complete').task, stage: 'cashier' },
  } as OfferedAction;
  show('complete', action);
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await screen.findAllByText('Complete this field.');
  expect(api.request).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Payment voucher number *'), {
    target: { value: 'VOUCHER-1' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Add voucher evidence' }));
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Confirm payment' }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          input: {
            voucherNumber: 'VOUCHER-1',
            voucherAttachments: ['voucher-file'],
          },
          target: { taskId: 't1' },
        }),
      }),
    ),
  );
});
it('forces the actual run only after the exact payment amount and a reason, without fabricating a voucher', async () => {
  const action = {
    ...offered('forceComplete', { runId: 'run1' }),
    task: null,
    reasonRequired: true,
  };
  show('forceComplete', action);
  fireEvent.change(screen.getByLabelText('Opinion or reason *'), {
    target: { value: 'Verified settlement' },
  });
  for (const [label, value] of [['Confirm exact payment amount *', '99.99']])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await screen.findByText('Enter the exact amount shown above.');
  expect(api.request).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Confirm exact payment amount *'), {
    target: { value: '100.00' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Administrative settlement' }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          target: { runId: 'run1' },
          comment: 'Verified settlement',
          input: {
            voucherNumber: null,
            confirmedCents: 10000,
          },
        }),
      }),
    ),
  );
});
it('keeps the run target for cc recipient lookup and sends only the selected offered run', async () => {
  const action = { ...offered('cc', { runId: 'run1' }), task: null };
  show('cc', action);
  expect(picker).toHaveBeenCalledWith(
    expect.objectContaining({ target: { runId: 'run1' }, action: 'cc' }),
  );
  fireEvent.change(screen.getByLabelText('Recipient *'), {
    target: { value: 'eligible-person' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          target: { runId: 'run1' },
          input: { to: 'eligible-person' },
        }),
      }),
    ),
  );
});
it('keeps a rejection reason after conflict and requires a latest read before retry', async () => {
  api.request.mockRejectedValue(
    new ApiClientError('secret', {
      status: 409,
      method: 'POST',
      url: 'action',
    }),
  );
  show('reject', { ...offered('reject'), reasonRequired: true });
  fireEvent.change(screen.getByLabelText('Opinion or reason *'), {
    target: { value: 'Evidence unclear' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Reject' }));
  await screen.findByRole('button', { name: 'Read latest version' });
  expect(screen.getByLabelText('Opinion or reason *')).toHaveValue(
    'Evidence unclear',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).toHaveBeenCalledOnce();
  expect(screen.queryByText('secret')).toBeNull();
});
it('uses a reasoned business transition for a closed-run forced exception, never an approval action', async () => {
  const current = {
    ...detail,
    view: { available: [{ name: 'forcePayException', allowed: true }] },
  } as unknown as PaymentDetail;
  show('forcePayException', undefined, current);
  fireEvent.change(screen.getByLabelText('Opinion or reason *'), {
    target: { value: 'Confirmed outside banking' },
  });
  for (const [label, value] of [['Confirm exact payment amount *', '100.00']])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Record exceptional settlement',
    }),
  );
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'paymentRequests/r1/transition',
        json: expect.objectContaining({
          transition: 'forcePayException',
          version: 3,
          input: {
            reason: 'Confirmed outside banking',
            voucherNumber: null,
            confirmedCents: 10000,
          },
        }),
      }),
    ),
  );
});
it('freezes uncertain writes and replays exactly the original body and idempotency key', async () => {
  api.request
    .mockRejectedValueOnce(new TypeError('network'))
    .mockResolvedValueOnce({ data: { record: detail.record } });
  show('comment', offered('comment'));
  fireEvent.change(screen.getByLabelText('Opinion or reason'), {
    target: { value: 'Do not duplicate this comment' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await screen.findByRole('button', { name: 'Retry identical operation' });
  expect(screen.getByLabelText('Opinion or reason')).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).toHaveBeenCalledOnce();
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry identical operation' }),
  );
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2));
  expect(api.request.mock.calls[1][0].json).toEqual(
    api.request.mock.calls[0][0].json,
  );
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
});

it('disables assign when the native offer provides no candidates', () => {
  show('assign', offered('assign'));
  expect(
    screen.getByText(
      'This action needs an input contract that this page does not support.',
    ),
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).not.toHaveBeenCalled();
});
it('does not issue an incompatible run candidate lookup for transfer', () => {
  show('transfer', offered('transfer', { runId: 'run1' }));
  expect(picker).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).not.toHaveBeenCalled();
});

it('uses the public run target for appoint recipient lookup', async () => {
  const action = { ...offered('appoint', { runId: 'run1' }), task: null };
  show('appoint', action);
  expect(picker).toHaveBeenCalledWith(
    expect.objectContaining({ target: { runId: 'run1' }, action: 'appoint' }),
  );
  fireEvent.change(screen.getByLabelText('Recipient *'), {
    target: { value: 'eligible-person' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          target: { runId: 'run1' },
          input: { to: 'eligible-person' },
        }),
      }),
    ),
  );
});

it('focuses the recipient when the selected action has no recipient', async () => {
  show('transfer', offered('transfer'));
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByLabelText('Recipient *')),
  );
  expect(api.request).not.toHaveBeenCalled();
});
