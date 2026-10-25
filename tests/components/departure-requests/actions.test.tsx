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
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Routes, Route } from 'react-router';
import en from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/departure.en-US.js';
import { ActionForm } from '../../../client/pages/departure-requests/action-dialog.js';
import type { DepartureDetail } from '../../../client/pages/departure-requests/types.js';
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
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'employee-1' } } }),
}));
vi.mock('../../../client/pages/departure-requests/pickers.js', () => ({
  HandoverPicker: ({
    id,
    value,
    onChange,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <input id={id} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
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
vi.mock('../../../client/components/date-picker.js', () => ({
  DatePicker: ({
    id,
    value,
    onChange,
    invalid,
    disabled,
  }: {
    id: string;
    value: Date | undefined;
    onChange: (v: Date) => void;
    invalid: boolean;
    disabled: boolean;
  }) => (
    <button
      type='button'
      id={id}
      aria-invalid={invalid}
      disabled={disabled}
      onClick={() => onChange(new Date(2026, 9, 21))}
    >
      {value ? 'Date chosen' : 'Choose date'}
    </button>
  ),
}));
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: {
      ...en,
      departureRequests: { ...en.departureRequests, ...copy },
    },
  },
});
const detail = {
  record: {
    id: 'r1',
    number: 'R-1',
    applicant: { id: 'employee-1', name: 'Employee' },
    applicantId: 'employee-1',
    handoverUserId: 'recipient-1',
    departureType: 'resignation',
    reason: 'Career change',
    expectedLastWorkingDay: '2026-10-20',
    lifecycleVersion: 3,
    lines: [
      {
        id: 'line-1',
        date: '2026-10-10',
        category: 'office',
        invoiceNumber: 'INV',
        expectedLastWorkingDay: '2026-10-20',
      },
    ],
  },
  users: [],
  view: { available: [] },
  runs: [],
  taskActions: [],
  runActions: [],
} as unknown as DepartureDetail;
function offered(
  name: string,
  target: { taskId: string } | { runId: string } = { taskId: 't1' },
): OfferedAction {
  return {
    name,
    target,
    task: { id: 't1', subject: 'line-1', stage: 'head' },
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
                  <button type='submit' form='departure-action'>
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
  } as unknown as DepartureDetail);
  expect(screen.getByText(copy.actionForm.submitConsequence)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(api.request).toHaveBeenCalledOnce());
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(api.request).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      path: 'departureRequests/r1/transitions',
      json: {
        transition: 'submit',
        version: 3,
        input: {},
        requestId: expect.any(String),
      },
    }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(screen.getByLabelText(copy.actionForm.comment)).toBeDisabled();
  finish({
    data: {
      record: { ...detail.record, status: 'manager', lifecycleVersion: 4 },
    },
  });
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).toHaveBeenCalledOnce();
});
it('sends an ordinary finance decision with empty input and the full offered run hash', async () => {
  show('approve', offered('approve'));
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'departureRequests/r1/actions',
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
  fireEvent.change(screen.getByLabelText('Comment / reason *'), {
    target: { value: 'Evidence unclear' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Reject' }));
  await screen.findByRole('button', { name: 'Read latest version' });
  expect(screen.getByLabelText('Comment / reason *')).toHaveValue(
    'Evidence unclear',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).toHaveBeenCalledOnce();
  expect(screen.queryByText('secret')).toBeNull();
});
it('freezes uncertain writes and replays exactly the original body and idempotency key', async () => {
  api.request
    .mockRejectedValueOnce(new TypeError('network'))
    .mockResolvedValueOnce({ data: { record: detail.record } });
  show('comment', offered('comment'));
  fireEvent.change(screen.getByLabelText('Comment / reason'), {
    target: { value: 'Do not duplicate this comment' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await screen.findByRole('button', { name: 'Retry identical operation' });
  expect(screen.getByLabelText('Comment / reason')).toBeDisabled();
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

it('HR approval uses the selected calendar date as the real SDK output', async () => {
  const action = offered('approve');
  action.task!.stage = 'hr';
  show('approve', action);
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await waitFor(() => expect(api.request).toHaveBeenCalled());
  expect(api.request.mock.calls[0][0].path).toBe(
    'departureRequests/r1/actions',
  );
  expect(api.request.mock.calls[0][0].json.input).toEqual({
    data: { lastWorkingDay: '2026-10-20' },
  });
});
it('settlement requires a selected date and note and uses the business transition endpoint', async () => {
  const current = {
    ...detail,
    view: { available: [{ name: 'settle', allowed: true }] },
  } as unknown as DepartureDetail;
  show('settle', undefined, current);
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Settlement date *' }));
  fireEvent.change(screen.getByLabelText('Settlement note *'), {
    target: { value: 'All work checked' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Confirm settlement' }),
  );
  await waitFor(() => expect(api.request).toHaveBeenCalled());
  expect(api.request.mock.calls[0][0].path).toBe(
    'departureRequests/r1/transitions',
  );
  expect(api.request.mock.calls[0][0].json.input).toEqual({
    settlementDate: '2026-10-21',
    settlementNote: 'All work checked',
  });
});

it('a forbidden HR action clears the date instead of restoring its original default', async () => {
  api.request.mockRejectedValue(new ApiClientError('SECRET', { status: 403 }));
  const action = offered('approve');
  action.task!.stage = 'hr';
  show('approve', action);
  fireEvent.change(screen.getByLabelText('Comment / reason'), {
    target: { value: 'Private HR opinion' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(screen.getByLabelText('Comment / reason')).toHaveValue(''),
  );
  expect(screen.getByText('Choose date')).toBeInTheDocument();
  expect(screen.queryByText('SECRET')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Retry identical operation' }),
  ).toBeNull();
});

it('HR cancellation requires a reason and sends the guarded business transition after confirmation', async () => {
  const current = {
    ...detail,
    view: { available: [{ name: 'requestCancellation', allowed: true }] },
  } as unknown as DepartureDetail;
  show('requestCancellation', undefined, current);
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'Retain employment after discussion' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(
    await screen.findByRole('button', {
      name: 'Request departure cancellation',
    }),
  );
  await waitFor(() => expect(api.request).toHaveBeenCalled());
  expect(api.request.mock.calls[0][0].path).toBe(
    'departureRequests/r1/transitions',
  );
  expect(api.request.mock.calls[0][0].json).toMatchObject({
    transition: 'requestCancellation',
    version: 3,
    input: { reason: 'Retain employment after discussion' },
  });
});

it('saves submission fields and uses the returned version to submit from the confirmation', async () => {
  const current = {
    ...detail,
    record: { ...detail.record, handoverUserId: null },
    view: { available: [{ name: 'submit', allowed: true }] },
  } as unknown as DepartureDetail;
  api.request
    .mockResolvedValueOnce({
      data: {
        record: {
          ...detail.record,
          handoverUserId: 'chosen',
          lifecycleVersion: 4,
        },
      },
    })
    .mockResolvedValueOnce({
      data: {
        record: { ...detail.record, status: 'manager', lifecycleVersion: 5 },
      },
    });
  show('submit', undefined, current);
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await screen.findByText(copy.actionForm.required);
  expect(api.request).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Handover recipient *'), {
    target: { value: 'chosen' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(api.request.mock.calls[0][0].json).toMatchObject({
    transition: 'edit',
    version: 3,
    input: { handoverUserId: 'chosen' },
  });
  expect(api.request.mock.calls[1][0].json).toMatchObject({
    transition: 'submit',
    version: 4,
  });
});

it('retries the same uncertain submission without repeating its acknowledged draft edit', async () => {
  const current = {
    ...detail,
    record: { ...detail.record, handoverUserId: null },
    view: { available: [{ name: 'submit', allowed: true }] },
  } as unknown as DepartureDetail;
  api.request
    .mockResolvedValueOnce({
      data: {
        record: {
          ...detail.record,
          handoverUserId: 'chosen',
          lifecycleVersion: 4,
        },
      },
    })
    .mockRejectedValueOnce(new TypeError('lost submit response'))
    .mockResolvedValueOnce({
      data: {
        record: { ...detail.record, status: 'manager', lifecycleVersion: 5 },
      },
    });
  show('submit', undefined, current);
  fireEvent.change(screen.getByLabelText('Handover recipient *'), {
    target: { value: 'chosen' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await userEvent.click(
    await screen.findByRole('button', { name: copy.actionForm.replay }),
  );
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(api.request).toHaveBeenCalledTimes(3);
  expect(api.request.mock.calls[1][0].json).toEqual(
    api.request.mock.calls[2][0].json,
  );
});
