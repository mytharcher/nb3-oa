import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, it, expect, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import training from '../../client/locales/modules/training.en-US.js';
import Form from '../../client/pages/training/form-dialog.js';
import Detail from '../../client/pages/training/detail.js';
import Action from '../../client/pages/training/action-dialog.js';
import {
  parseAmountCents,
  amountText,
} from '../../client/pages/training/money.js';
const { api, reload, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  reload: vi.fn(),
  permission: { can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: permission.can, isPending: false }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'alice' } } }),
}));
// DateTimePicker wall-clock conversion has its own suite; isolate form serialization here.
vi.mock('../../client/components/date-time-picker.js', () => ({
  DateTimePicker: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    disabled: boolean;
  }) => (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...training } },
});
const record = {
  id: 'b1',
  applicantId: 'alice',
  createdById: 'alice',
  number: null,
  departmentId: 'dept',
  name: 'Workshop',
  institution: 'Learning Institute',
  startAt: '2026-11-12T01:00:00Z',
  endAt: '2026-11-12T09:00:00Z',
  usesWorkingTime: true,
  amountCents: 29,
  attendanceRecorded: false,
  authorizationId: null,
  managerApproverId: 'manager',
  executiveApproverId: 'exec',
  gmApproverId: 'gm',
  headMerged: null,
  gmMerged: null,
  hrRecipients: ['hr'],
  reason: 'Budget change',
  status: 'draft',
  lifecycleVersion: 4,
  ruleSnapshot: null,
  headApproverId: 'head',
  createdAt: '2026-10-11T00:00:00Z',
};
function detail(overrides = {}) {
  const r = { ...record, ...overrides };
  return {
    record: r,
    timeZone: 'Asia/Shanghai',
    users: [{ id: 'alice', name: 'Alice' }],
    view: {
      state: r.status,
      record: r,
      version: 4,
      available: [
        { name: 'edit', allowed: true, blockers: [] },
        { name: 'submit', allowed: true, blockers: [] },
      ],
      history: { transitions: [], effectRuns: [] },
    },
    runs: [],
    taskActions: [],
    runActions: [],
    upcoming: [],
    timeline: { runs: [] },
  };
}
type Request = {
  path: string;
  method?: string;
  json?: Record<string, unknown>;
};
function serve(write?: (r: Request) => unknown, data = detail()) {
  api.request.mockImplementation(async (r: Request) => {
    if (r.path === 'trainingRequests/options')
      return { data: { timeZone: 'Asia/Shanghai' } };
    if (r.path === 'users') return { data: [], meta: { total: 0 } };
    if (r.method === 'POST') return write?.(r) ?? { data: { record } };
    return { data };
  });
}
function open(path = '/mine/newTraining') {
  const router = createMemoryRouter(
    [
      {
        path: '/mine',
        element: <Outlet context={{ reload }} />,
        children: [
          { path: 'newTraining', element: <Form /> },
          { path: 'editTraining/:requestId', element: <Form /> },
          {
            path: 'training/:requestId',
            element: <Detail />,
            children: [
              { path: 'edit', element: <Form /> },
              { path: 'action/:actionName/:targetId', element: <Action /> },
            ],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}

async function fill(amount = '0.29') {
  const user = userEvent.setup();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.type(screen.getByLabelText(/Training name/), 'Workshop');
  await user.type(screen.getByLabelText(/Institution/), 'Learning Institute');
  await user.type(screen.getByLabelText(/Starts at/), '2026-11-12T01:00:00Z');
  await user.type(screen.getByLabelText(/Ends at/), '2026-11-12T09:00:00Z');
  await user.clear(screen.getByLabelText(/Fee/));
  await user.type(screen.getByLabelText(/Fee/), amount);
  await user.type(screen.getByLabelText(/Reason/), 'Learning');
  return user;
}
beforeEach(() => {
  api.request.mockReset();
  reload.mockReset();
});
it('accepts zero and preserves exact cents while rejecting subcents and unsafe values', () => {
  expect(parseAmountCents('0')).toBe(0);
  expect(parseAmountCents('0.29')).toBe(29);
  expect(amountText(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91');
  for (const value of ['-1', '1e3', '0.001', '90071992547409.92'])
    expect(parseAmountCents(value)).toBeNull();
});
it('creates free training with UTC interval and no invented budget fields', async () => {
  serve();
  const router = open();
  const user = await fill('0');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'trainingRequests',
      method: 'POST',
      json: {
        name: 'Workshop',
        institution: 'Learning Institute',
        startAt: '2026-11-12T01:00:00Z',
        endAt: '2026-11-12T09:00:00Z',
        usesWorkingTime: false,
        amountCents: 0,
        reason: 'Learning',
      },
    }),
  );
});
it('rejects subcent fees without a write', async () => {
  serve();
  open();
  const user = await fill('0.001');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(
    await screen.findByText(training.training.amountInvalid),
  ).toBeInTheDocument();
  expect(api.request.mock.calls.some(([r]) => r.method === 'POST')).toBe(false);
});
it('locks an uncertain creation so retry cannot create duplicates', async () => {
  serve(() => {
    throw new Error('response lost');
  });
  open();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(
    await screen.findByText(training.training.uncertainCreate),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  expect(
    api.request.mock.calls.filter(([r]) => r.method === 'POST'),
  ).toHaveLength(1);
});
it('shows approved attendance and allowance facts in company time zone', async () => {
  serve(
    undefined,
    detail({
      status: 'approved',
      attendanceRecorded: true,
      authorizationId: 'quota',
    }),
  );
  open('/mine/training/b1');
  expect(
    await screen.findByText(training.training.attendanceRecorded),
  ).toBeInTheDocument();
  expect(screen.getAllByText(/0.29 yuan/)).toHaveLength(2);
  expect(
    screen.getByText('Company time zone: Asia/Shanghai'),
  ).toBeInTheDocument();
});
it('keeps submit failure feedback focused inside its real confirmation dialog', async () => {
  serve(() => {
    throw new Error('submit unavailable');
  });
  open('/mine/training/b1');
  await userEvent.click(
    await screen.findByRole('button', { name: 'Submit', exact: true }),
  );
  const modal = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(modal).getByRole('button', { name: 'Submit', exact: true }),
  );
  await waitFor(() =>
    expect(modal.querySelector('[tabindex="-1"]')).toHaveFocus(),
  );
});

it('retains the edit input, original version and request id across an uncertain retry', async () => {
  let attempts = 0;
  serve(() => {
    if (attempts++ === 0) throw new Error('response lost');
    return { data: { record } };
  });
  const router = open('/mine/editTraining/b1');
  await screen.findByDisplayValue('Workshop');
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeEnabled(),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save draft', exact: true }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Save draft', exact: true }),
    ).toBeEnabled(),
  );
  await userEvent.click(
    screen.getByRole('button', { name: 'Save draft', exact: true }),
  );
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  const writes = api.request.mock.calls
    .map(([r]) => r as Request)
    .filter((r) => r.method === 'POST');
  expect(writes).toHaveLength(2);
  expect(writes[0].json).toEqual(writes[1].json);
  expect(writes[0].json).toMatchObject({
    version: 4,
    transition: 'edit',
    input: { amountCents: 29 },
  });
});
