import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { beforeEach, it, expect, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import expense from '../../client/locales/modules/expense-plan.en-US.js';
import Form from '../../client/pages/expense-plan/form-dialog.js';
import Detail from '../../client/pages/expense-plan/detail.js';
import Action from '../../client/pages/expense-plan/action-dialog.js';
import {
  parseAmountCents,
  amountText,
} from '../../client/pages/expense-plan/money.js';
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
// DatePicker interaction is covered by its own suite; isolate date-only transport here.
vi.mock('../../client/components/date-picker.js', () => ({
  DatePicker: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id: string;
    value: Date | undefined;
    onChange: (v: Date | undefined) => void;
    disabled: boolean;
  }) => (
    <input
      id={id}
      defaultValue={value?.toISOString().slice(0, 10) ?? ''}
      onChange={(e) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value))
          onChange(new Date(`${e.target.value}T12:00:00Z`));
        else if (!e.target.value) onChange(undefined);
      }}
      disabled={disabled}
    />
  ),
}));
vi.mock('../../client/components/user-picker.js', () => ({
  UserPicker: ({
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
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...expense } },
});
const record = {
  id: 'b1',
  applicantId: 'alice',
  createdById: 'alice',
  number: null,
  departmentId: 'dept',
  year: 2026,
  subject: 'travel',
  matterType: 'teamBuilding',
  participants: 20,
  eventDate: '2026-11-12',
  executiveApproverId: 'vp',
  gmApproverId: 'gm',
  gmMerged: null,
  authorizationId: null,
  amountCents: 29,
  heldCents: 0,
  heldAccount: null,
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
    timeZone: 'Asia/Shanghai',
    department: { id: 'dept', title: 'Applicant primary department' },
    authorization: null,
    record: r,
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
    if (r.path === 'expensePlans/options')
      return {
        data: {
          timeZone: 'Asia/Shanghai',
          department: { id: 'dept', title: 'Applicant primary department' },
          matterTypes: [
            {
              code: 'teamBuilding',
              label: { 'en-US': 'Team building' },
              active: true,
            },
          ],
          subjects: ['office', 'travel', 'equipment'].map((code) => ({
            code,
            label: { 'en-US': code },
            active: true,
          })),
        },
      };
    if (r.path === 'departments/options')
      return {
        data: [
          {
            id: 'dept',
            title: 'Selected department',
            parentId: null,
            active: true,
          },
        ],
      };
    if (r.path === 'users') return { data: [], meta: { total: 0 } };
    if (r.method === 'POST') return write?.(r) ?? { data: { record } };
    return { data: structuredClone(data) };
  });
}
function open(path = '/mine/newExpensePlan') {
  const router = createMemoryRouter(
    [
      {
        path: '/mine',
        element: <Outlet context={{ reload }} />,
        children: [
          { path: 'newExpensePlan', element: <Form /> },
          { path: 'editExpensePlan/:requestId', element: <Form /> },
          {
            path: 'expensePlan/:requestId',
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
  await user.type(screen.getByLabelText(/Event date/), '2026-11-12');
  for (const [label, value] of [
    ['Budget subject', 'travel'],
    ['Matter type', 'Team building'],
  ]) {
    await user.click(screen.getByLabelText(new RegExp(label)));
    await user.click(await screen.findByRole('option', { name: value }));
  }
  await user.type(screen.getByLabelText(/Estimated expense \(yuan\)/), amount);
  await user.type(screen.getByLabelText(/Reason/), 'Team event');
  return user;
}
beforeEach(() => {
  api.request.mockReset();
  reload.mockReset();
  permission.can = true;
});
it('preserves exact cents at decimal and safe integer boundaries', () => {
  expect(parseAmountCents('0.29')).toBe(29);
  expect(parseAmountCents('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
  expect(amountText(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91');
  for (const value of ['0', '-1', '0.001', '1e3', '1.234', '90071992547409.92'])
    expect(parseAmountCents(value)).toBeNull();
});
it('creates a proposal with selected account and exact 29 cents, then closes', async () => {
  serve();
  const router = open();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'POST',
      path: 'expensePlans',
      json: expect.objectContaining({
        amountCents: 29,
        subject: 'travel',
        matterType: 'teamBuilding',
        eventDate: '2026-11-12',
        participants: 1,
      }),
    }),
  );
});
it('rejects sub-cent input without writing', async () => {
  serve();
  open();
  const user = await fill('0.001');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(
    await screen.findByText(expense.expensePlans.amountInvalid),
  ).toBeInTheDocument();
  expect(api.request.mock.calls.some(([r]) => r.method === 'POST')).toBe(false);
});
it('locks an uncertain creation instead of repeating it', async () => {
  serve(() => {
    throw new Error('Lost response');
  });
  open();
  const user = await fill();
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(
    await screen.findByText(expense.expensePlans.uncertainCreate),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  expect(
    api.request.mock.calls.filter(([r]) => r.method === 'POST'),
  ).toHaveLength(1);
});
it('retries edits with the latest version and original request id, preserving the revised proposal', async () => {
  let attempts = 0;
  serve(() => {
    if (++attempts === 1) throw new Error('Transient');
    return { data: { record } };
  });
  const router = open('/mine/editExpensePlan/b1');
  await screen.findByDisplayValue('0.29');
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText(/Estimated expense \(yuan\)/));
  await user.type(screen.getByLabelText(/Estimated expense \(yuan\)/), '0.58');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByText(enUS.approvals.error.failed);
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Load latest' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeEnabled(),
  );
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() => expect(router.state.location.pathname).toBe('/mine'));
  const writes = api.request.mock.calls
    .filter(([r]) => r.method === 'POST')
    .map(([r]) => r);
  expect(writes[0].json).toEqual(writes[1].json);
  expect(writes[0].json).toMatchObject({
    version: 4,
    input: { amountCents: 58 },
  });
});
it('shows the real retained reservation separately from a revision proposal', async () => {
  serve(
    undefined,
    detail({
      status: 'revision',
      subject: 'equipment',
      amountCents: 20002,
      heldCents: 10001,
      heldAccount: { departmentId: 'dept', year: 2026, subject: 'office' },
    }),
  );
  open('/mine/expensePlan/b1');
  expect(await screen.findByText('200.02 yuan')).toBeInTheDocument();
  expect(await screen.findByText(/office · 100.01 yuan/)).toBeInTheDocument();
  expect(
    screen.getByText(expense.expensePlans.revisionHold),
  ).toBeInTheDocument();
});
it('explains options access failure and disables save', async () => {
  serve();
  const original = api.request.getMockImplementation()!;
  api.request.mockImplementation(async (r: Request) =>
    r.path === 'expensePlans/options'
      ? Promise.reject(
          new ApiClientError('Forbidden', {
            status: 403,
            method: 'GET',
            url: '/api/expensePlans/options',
          } as ConstructorParameters<typeof ApiClientError>[1]),
        )
      : original(r),
  );
  open();
  expect(
    await screen.findByText(enUS.approvals.error.forbidden),
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled();
});
it('focuses the amount after insufficient funds and keeps the proposal', async () => {
  serve(() => {
    throw new ApiClientError('Insufficient', {
      status: 422,
      reason: 'BUDGET_INSUFFICIENT',
      method: 'POST',
      url: '/api/expensePlans/b1/transition',
    } as ConstructorParameters<typeof ApiClientError>[1]);
  });
  open('/mine/editExpensePlan/b1');
  const amount = await screen.findByDisplayValue('0.29');
  await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(
    await screen.findByText(expense.expensePlans.errors.insufficient),
  ).toBeInTheDocument();
  expect(amount).toHaveValue('0.29');
  await waitFor(() => expect(amount).toHaveFocus());
});
it('approves the expense facts with the reviewed content hash', async () => {
  const d = {
    ...detail(),
    view: { ...detail().view, available: [] },
    taskActions: [
      {
        task: { id: 'task-1', runId: 'run-1' },
        onBehalfOf: null,
        actions: [
          {
            name: 'approve',
            options: {},
            contentHash: true,
            primary: true,
            tone: 'primary',
          },
        ],
      },
    ],
    runActions: [
      {
        run: { id: 'run-1', contentHash: 'reviewed-expense' },
        onBehalfOf: null,
        actions: [],
      },
    ],
  };
  serve(undefined, d as ReturnType<typeof detail>);
  const router = open('/mine/expensePlan/b1/action/approve/task-1');
  await screen.findByRole('dialog');
  await userEvent.click(
    screen.getByRole('button', { name: 'Approve', exact: true }),
  );
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/mine/expensePlan/b1'),
  );
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'POST',
      path: 'expensePlans/b1/action',
      json: expect.objectContaining({
        action: 'approve',
        target: { taskId: 'task-1' },
        contentHash: 'reviewed-expense',
      }),
    }),
  );
});

it('keeps insufficient submit feedback focused inside the confirmation dialog', async () => {
  serve(() => {
    throw new ApiClientError('Insufficient', {
      status: 422,
      reason: 'BUDGET_INSUFFICIENT',
      method: 'POST',
      url: '/api/expensePlans/b1/transition',
    } as ConstructorParameters<typeof ApiClientError>[1]);
  });
  open('/mine/expensePlan/b1');
  await userEvent.click(
    await screen.findByRole('button', { name: 'Submit', exact: true }),
  );
  const modal = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(modal).getByRole('button', { name: 'Submit', exact: true }),
  );
  const feedback = await within(modal).findByText(
    expense.expensePlans.errors.insufficient,
  );
  await waitFor(() =>
    expect(modal).toContainElement(document.activeElement as HTMLElement),
  );
  await waitFor(() =>
    expect(feedback.closest('[tabindex="-1"]')).toHaveFocus(),
  );
  await userEvent.click(
    within(modal).getByRole('button', { name: 'Cancel', exact: true }),
  );
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole('button', { name: 'Edit', exact: true }),
  ).toBeInTheDocument();
});

it('hides the HR actor department when submitting for another applicant and never accepts a chosen account', async () => {
  serve();
  open();
  const user = await fill();
  await user.type(screen.getByLabelText('Applicant'), 'bob');
  expect(
    screen.getByText(expense.expensePlans.proxyDepartment),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/Current primary department:/),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() =>
    expect(api.request.mock.calls.some(([r]) => r.method === 'POST')).toBe(
      true,
    ),
  );
  const write = api.request.mock.calls.find(
    ([r]) => r.method === 'POST',
  )![0] as Request;
  expect(write.json).toMatchObject({ applicantId: 'bob', amountCents: 29 });
  expect(write.json).not.toHaveProperty('departmentId');
  expect(write.json).not.toHaveProperty('year');
});
it('shows approved quota and persisted same-person merge without claiming reimbursement completion', async () => {
  const d = {
    ...detail({
      status: 'approved',
      gmMerged: {
        runId: 'r',
        taskId: 't',
        personId: 'gm',
        at: '2026-10-11T01:00:00Z',
        stages: ['executive', 'gm'],
      },
    }),
    authorization: {
      id: 'quota-1',
      grantedCents: 29,
      state: 'expired',
      deadline: '2027-01-09',
    },
    users: [
      { id: 'alice', name: 'Alice' },
      { id: 'gm', name: 'General Manager' },
    ],
    view: { ...detail().view, available: [] },
  };
  serve(undefined, d as ReturnType<typeof detail>);
  open('/mine/expensePlan/b1');
  expect(
    await screen.findByText(expense.expensePlans.applied),
  ).toBeInTheDocument();
  expect(
    screen.getByText(expense.expensePlans.quotaStates.expired),
  ).toBeInTheDocument();
  expect(
    screen.getByText(expense.expensePlans.mergedTitle),
  ).toBeInTheDocument();
  expect(screen.getByText(expense.expensePlans.merged)).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Withdraw', exact: true }),
  ).not.toBeInTheDocument();
});
it('retains disabled historical dictionary labels and requires an active choice before saving', async () => {
  serve();
  const original = api.request.getMockImplementation()!;
  api.request.mockImplementation(async (r: Request) => {
    const response = await original(r);
    if (r.path === 'expensePlans/options')
      response.data.matterTypes = [
        {
          code: 'teamBuilding',
          label: { 'en-US': 'Former team events' },
          active: false,
        },
        { code: 'event', label: { 'en-US': 'Events' }, active: true },
      ];
    return response;
  });
  open('/mine/editExpensePlan/b1');
  const user = userEvent.setup();
  await screen.findByDisplayValue('0.29');
  expect(await screen.findByText('Former team events')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(
    await screen.findAllByText(expense.expensePlans.subjectInactive),
  ).not.toHaveLength(0);
  expect(api.request.mock.calls.some(([r]) => r.method === 'POST')).toBe(false);
});
