import userEvent from '@testing-library/user-event';
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
import copy from '../../../client/locales/modules/probation-actions.en-US.js';
import { ActionForm } from '../../../client/pages/probation-requests/action-dialog.js';
import type { ProbationDetail } from '../../../client/pages/probation-requests/types.js';
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
const { privateState } = vi.hoisted(() => ({
  privateState: {
    allowed: true,
    viewer: 'hr-1',
    loading: false,
    data: null as unknown,
    error: undefined as unknown,
    permissionPending: false,
    reload: vi.fn(),
  },
}));
vi.mock(
  '../../../client/pages/probation-requests/private-compensation.js',
  () => ({
    usePrivateCompensation: vi.fn((_id: string, enabled: boolean) => ({
      ...privateState,
      allowed: enabled && privateState.allowed,
    })),
  }),
);
vi.mock('../../../client/pages/approvals/use-resource.js', () => ({
  useResource: vi.fn((path: string | null) => ({
    data: path
      ? [
          { id: 'g1', title: 'Professional', active: true },
          { id: 'inactive', title: 'Old', active: false },
        ]
      : undefined,
    loading: false,
    error: undefined,
    reload: vi.fn(),
  })),
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
      probationRequests: { ...en.probationRequests, ...copy },
    },
  },
});
const detail = {
  record: {
    id: 'r1',
    number: 'R-1',
    probationEndDate: '2026-10-20',
    lifecycleVersion: 3,
    lines: [
      {
        id: 'line-1',
        date: '2026-10-10',
        category: 'office',
        invoiceNumber: 'INV',
        probationEndDate: '2026-10-20',
      },
    ],
  },
  users: [],
  view: { available: [] },
  runs: [],
  taskActions: [],
  runActions: [],
} as unknown as ProbationDetail;
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
                  <button type='submit' form='probation-action'>
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
  Object.assign(privateState, {
    allowed: true,
    viewer: 'hr-1',
    loading: false,
    data: null,
    error: undefined,
  });
});
it('submits from the action form without a second confirmation and prevents duplicate writes', async () => {
  let finish!: (value: unknown) => void;
  api.request.mockImplementationOnce(
    () => new Promise((resolve) => (finish = resolve)),
  );
  show('submit', undefined, {
    ...detail,
    view: { available: [{ name: 'submit', allowed: true }] },
  } as unknown as ProbationDetail);
  expect(screen.getByText(copy.actionForm.submitConsequence)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(api.request).toHaveBeenCalledOnce());
  expect(screen.queryByRole('alertdialog')).toBeNull();
  expect(api.request).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      path: 'probationRequests/r1/transition',
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
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'probationRequests/r1/action',
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

it('manager approve requires real outputs and uses data with null deferral for regular', async () => {
  show('approve', {
    ...offered('approve'),
    task: { ...offered('approve').task!, stage: 'manager' },
  } as OfferedAction);
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await screen.findAllByText('Complete this field.');
  expect(api.request).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Manager evaluation *')).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Manager evaluation *'), {
    target: { value: 'Ready for role' },
  });
  fireEvent.click(screen.getByLabelText('Conclusion *'));
  await userEvent.click(
    await screen.findByRole('option', { name: 'Confirm employment' }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          input: {
            data: {
              evaluation: 'Ready for role',
              conclusion: 'regular',
              deferredTo: null,
            },
          },
        }),
      }),
    ),
  );
});
it('manager deferred conclusion requires a later calendar date and sends the selected local date', async () => {
  show('approve', {
    ...offered('approve'),
    task: { ...offered('approve').task!, stage: 'manager' },
  } as OfferedAction);
  fireEvent.change(screen.getByLabelText('Manager evaluation *'), {
    target: { value: 'Needs more time' },
  });
  fireEvent.click(screen.getByLabelText('Conclusion *'));
  await userEvent.click(
    await screen.findByRole('option', { name: 'Extend probation' }),
  );
  await screen.findByLabelText('Extended probation end date *');
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  await screen.findByText(
    'Choose a valid date later than the submitted probation end date.',
  );
  expect(screen.getByLabelText('Extended probation end date *')).toHaveFocus();
  fireEvent.click(screen.getByLabelText('Extended probation end date *'));
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          input: {
            data: {
              evaluation: 'Needs more time',
              conclusion: 'deferred',
              deferredTo: '2026-10-21',
            },
          },
        }),
      }),
    ),
  );
});
it('HR approve sends exact decimal compensation separately from SDK input, starting empty after private null', async () => {
  show('approve', {
    ...offered('approve'),
    task: { ...offered('approve').task!, stage: 'hr' },
  } as OfferedAction);
  expect(screen.getByLabelText('Base salary *')).toHaveValue('');
  fireEvent.click(screen.getByLabelText('Grade *'));
  expect(screen.queryByRole('option', { name: 'Old' })).toBeNull();
  fireEvent.click(await screen.findByRole('option', { name: 'Professional' }));
  fireEvent.change(screen.getByLabelText('Base salary *'), {
    target: { value: '99999999999999.99' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        json: expect.objectContaining({
          input: {},
          compensation: { gradeId: 'g1', baseSalary: '99999999999999.99' },
        }),
      }),
    ),
  );
});
it.each(['denied', 'failed', 'pending'])(
  'HR approval is disabled when private access is %s',
  async (state) => {
    if (state === 'denied') privateState.allowed = false;
    if (state === 'failed')
      privateState.error = new ApiClientError('secret', {
        status: 403,
        method: 'GET',
        url: 'compensation',
      });
    if (state === 'pending') {
      privateState.loading = true;
      privateState.data = undefined;
    }
    show('approve', {
      ...offered('approve'),
      task: { ...offered('approve').task!, stage: 'hr' },
    } as OfferedAction);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(api.request).not.toHaveBeenCalled();
    expect(screen.queryByText('secret')).toBeNull();
  },
);
it('GM approve has no compensation fields or private blocking', async () => {
  privateState.allowed = false;
  show('approve', {
    ...offered('approve'),
    task: { ...offered('approve').task!, stage: 'gm' },
  } as OfferedAction);
  expect(screen.queryByLabelText('Base salary *')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({ json: expect.objectContaining({ input: {} }) }),
    ),
  );
  expect(api.request.mock.calls[0][0].json).not.toHaveProperty('compensation');
});

async function fillHrSalary(value: string) {
  await userEvent.click(screen.getByLabelText('Grade *'));
  await userEvent.click(
    await screen.findByRole('option', { name: 'Professional' }),
  );
  fireEvent.change(screen.getByLabelText('Base salary *'), {
    target: { value },
  });
}
it('retains and replays the exact private HR proposal and original key after an unknown result', async () => {
  api.request
    .mockRejectedValueOnce(new TypeError('network'))
    .mockResolvedValueOnce({ data: { record: detail.record } });
  show('approve', {
    ...offered('approve'),
    task: { ...offered('approve').task!, stage: 'hr' },
  } as OfferedAction);
  await fillHrSalary('0.00');
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await screen.findByRole('button', { name: 'Retry identical operation' });
  expect(screen.getByLabelText('Base salary *')).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', { name: 'Retry identical operation' }),
  );
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(2));
  expect(api.request.mock.calls[1][0].json).toEqual(
    api.request.mock.calls[0][0].json,
  );
  expect(api.request.mock.calls[1][0].json.compensation).toEqual({
    gradeId: 'g1',
    baseSalary: '0.00',
  });
});
it('clears private HR form and replay payload after a forbidden write', async () => {
  api.request.mockRejectedValue(
    new ApiClientError('secret', {
      status: 403,
      method: 'POST',
      url: 'action',
    }),
  );
  show('approve', {
    ...offered('approve'),
    task: { ...offered('approve').task!, stage: 'hr' },
  } as OfferedAction);
  await fillHrSalary('2500.25');
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Approve' }));
  await screen.findByText(
    'You cannot view compensation. HR approval cannot be confirmed.',
  );
  expect(screen.queryByLabelText('Base salary *')).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Retry identical operation' }),
  ).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).toHaveBeenCalledOnce();
});
it.each(['1e3', '-1', '1.999', '100000000000000'])(
  'rejects invalid decimal salary %s without issuing an action',
  async (salary) => {
    show('approve', {
      ...offered('approve'),
      task: { ...offered('approve').task!, stage: 'hr' },
    } as OfferedAction);
    await fillHrSalary(salary);
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    await screen.findByText(
      'Enter a decimal amount with up to 14 integer digits and 2 decimal places.',
    );
    expect(screen.getByLabelText('Base salary *')).toHaveFocus();
    expect(api.request).not.toHaveBeenCalled();
  },
);
