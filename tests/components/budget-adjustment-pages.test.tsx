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
import budget from '../../client/locales/modules/budget-adjustments.en-US.js';
import Form from '../../client/pages/budget-adjustments/form-dialog.js';
import Detail from '../../client/pages/budget-adjustments/detail.js';
import Action from '../../client/pages/budget-adjustments/action-dialog.js';
import {
  parseAmountCents,
  amountText,
} from '../../client/pages/budget-adjustments/money.js';
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
// Picker behavior is covered in its own suite; this isolates selected-department serialization and money handling.
vi.mock('../../client/components/department-picker.js', () => ({
  DepartmentPicker: ({
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
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...budget } },
});
const record = {
  id: 'b1',
  applicantId: 'alice',
  createdById: 'alice',
  number: null,
  departmentId: 'dept',
  year: 2026,
  subject: 'travel',
  sourceSubject: 'office',
  adjustmentType: 'transfer',
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
    if (r.path === 'budgetAdjustments/options')
      return {
        data: {
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
    return { data };
  });
}
function open(path = '/mine/newBudgetAdjustment') {
  const router = createMemoryRouter(
    [
      {
        path: '/mine',
        element: <Outlet context={{ reload }} />,
        children: [
          { path: 'newBudgetAdjustment', element: <Form /> },
          { path: 'editBudgetAdjustment/:requestId', element: <Form /> },
          {
            path: 'budgetAdjustment/:requestId',
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
  await user.type(screen.getByLabelText(/Budget department/), 'dept');
  for (const [label, value] of [
    ['Target subject', 'travel'],
    ['Source subject', 'office'],
  ]) {
    await user.click(screen.getByLabelText(new RegExp(label)));
    await user.click(await screen.findByRole('option', { name: value }));
  }
  await user.type(screen.getByLabelText(/Amount \(yuan\)/), amount);
  await user.type(screen.getByLabelText(/Reason/), 'Funding transfer');
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
      path: 'budgetAdjustments',
      json: expect.objectContaining({
        departmentId: 'dept',
        amountCents: 29,
        subject: 'travel',
        sourceSubject: 'office',
        adjustmentType: 'transfer',
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
    await screen.findByText(budget.budgetAdjustments.amountInvalid),
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
    await screen.findByText(budget.budgetAdjustments.uncertainCreate),
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
  const router = open('/mine/editBudgetAdjustment/b1');
  await screen.findByDisplayValue('0.29');
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText(/Amount \(yuan\)/));
  await user.type(screen.getByLabelText(/Amount \(yuan\)/), '0.58');
  await user.click(screen.getByRole('button', { name: 'Save draft' }));
  await screen.findByText(enUS.approvals.error.failed);
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
      sourceSubject: 'equipment',
      amountCents: 20002,
      heldCents: 10001,
      heldAccount: { departmentId: 'dept', year: 2026, subject: 'office' },
    }),
  );
  open('/mine/budgetAdjustment/b1');
  expect(await screen.findByText('200.02 yuan')).toBeInTheDocument();
  expect(await screen.findByText(/office · 100.01 yuan/)).toBeInTheDocument();
  expect(
    screen.getByText(budget.budgetAdjustments.revisionHold),
  ).toBeInTheDocument();
});
it('explains options access failure and disables save', async () => {
  serve();
  const original = api.request.getMockImplementation()!;
  api.request.mockImplementation(async (r: Request) =>
    r.path === 'budgetAdjustments/options'
      ? Promise.reject(
          new ApiClientError('Forbidden', {
            status: 403,
            method: 'GET',
            url: '/api/budgetAdjustments/options',
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
      url: '/api/budgetAdjustments/b1/transition',
    } as ConstructorParameters<typeof ApiClientError>[1]);
  });
  open('/mine/editBudgetAdjustment/b1');
  const amount = await screen.findByDisplayValue('0.29');
  await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(
    await screen.findByText(budget.budgetAdjustments.insufficient),
  ).toBeInTheDocument();
  expect(amount).toHaveValue('0.29');
  await waitFor(() => expect(amount).toHaveFocus());
});
it('approves the budget facts with the reviewed content hash', async () => {
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
        run: { id: 'run-1', contentHash: 'reviewed-budget' },
        onBehalfOf: null,
        actions: [],
      },
    ],
  };
  serve(undefined, d as ReturnType<typeof detail>);
  const router = open('/mine/budgetAdjustment/b1/action/approve/task-1');
  await screen.findByRole('dialog');
  await userEvent.click(
    screen.getByRole('button', { name: 'Approve', exact: true }),
  );
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/mine/budgetAdjustment/b1'),
  );
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: 'POST',
      path: 'budgetAdjustments/b1/action',
      json: expect.objectContaining({
        action: 'approve',
        target: { taskId: 'task-1' },
        contentHash: 'reviewed-budget',
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
      url: '/api/budgetAdjustments/b1/transition',
    } as ConstructorParameters<typeof ApiClientError>[1]);
  });
  open('/mine/budgetAdjustment/b1');
  await userEvent.click(
    await screen.findByRole('button', { name: 'Submit', exact: true }),
  );
  const modal = await screen.findByRole('alertdialog');
  await userEvent.click(
    within(modal).getByRole('button', { name: 'Submit', exact: true }),
  );
  const feedback = await within(modal).findByText(
    budget.budgetAdjustments.insufficient,
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
