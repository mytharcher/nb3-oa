import userEvent from '@testing-library/user-event';
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
  act,
} from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import { beforeEach, it, expect, vi } from 'vitest';
function fieldLabel(name: string) {
  return new RegExp(
    '^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?: \\*)?$',
  );
}
import enUS from '../../../client/locales/en-US.js';
import List from '../../../client/pages/onboarding/index.js';
import Detail from '../../../client/pages/onboarding/detail.js';
import Form from '../../../client/pages/onboarding/form.js';
import Action from '../../../client/pages/onboarding/action.js';
import { AttachmentEditor } from '../../../client/pages/onboarding/attachments.js';
const { api, reload, grants, identity } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  reload: vi.fn(),
  grants: new Set<string>(),
  identity: { revision: 0, listeners: new Set<() => void>() },
}));
vi.mock('#components/date-picker', () => ({
  DatePicker: ({
    id,
    value,
    onChange,
    disabled,
    invalid,
  }: {
    id: string;
    value?: Date;
    onChange: (date: Date | undefined) => void;
    disabled?: boolean;
    invalid?: boolean;
  }) => (
    <input
      id={id}
      type='date'
      aria-invalid={invalid || undefined}
      disabled={disabled}
      value={
        value
          ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
          : ''
      }
      onChange={(e) =>
        onChange(
          e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined,
        )
      }
    />
  ),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
  useNavigationGuard: () => undefined,
}));
vi.mock('@nocobase/app-plugin-authentication/client', async (original) => ({
  ...(await original<
    typeof import('@nocobase/app-plugin-authentication/client')
  >()),
  useAuthentication: () => ({ session: { user: { id: 'hr' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', async () => {
  const { useSyncExternalStore } = await import('react');
  return {
    useAuthorizationRevision: () =>
      useSyncExternalStore(
        (listener) => {
          identity.listeners.add(listener);
          return () => {
            identity.listeners.delete(listener);
          };
        },
        () => identity.revision,
      ),
    useCan: ({ action }: { action: string }) => ({
      can: grants.has(action),
      isPending: false,
      error: undefined,
    }),
  };
});
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const record = {
  id: 'o1',
  userId: 'new-user',
  employeeId: 'e1',
  user: { id: 'new-user', name: 'New employee' },
  creator: { id: 'hr', name: 'HR' },
  hireDate: '2026-10-11',
  requisitionId: 'req1',
  status: 'handling',
  version: 4,
};
const task = (kind = 'it', actions: string[] = ['complete']) => ({
  id: 'o1:' + kind,
  kind,
  status: 'claimed',
  assignee: { id: 'hr', name: 'HR' },
  target: null,
  dueDate: '2026-10-10',
  facts: null,
  forced: false,
  version: 3,
  actions,
});
const detail = { record, tasks: [task()], canCancel: true };
function Shell() {
  return <Outlet context={{ basePath: '/onboardings', reload }} />;
}
function mount(
  element: React.ReactNode,
  path = '/onboardings/o1/tasks/o1%3Ait/complete',
) {
  const router = createMemoryRouter(
    [
      {
        path: '/onboardings',
        element: <Shell />,
        children: [
          { index: true, element },
          { path: 'new', element },
          { path: ':onboardingId', element },
          { path: ':onboardingId/cancel', element },
          { path: ':onboardingId/tasks/:taskId/:action', element },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  return render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  api.request.mockReset();
  reload.mockReset();
  grants.clear();
  [
    'view',
    'create',
    'viewSalary',
    'claim',
    'release',
    'complete',
    'forceComplete',
    'cancel',
  ].forEach((v) => grants.add(v));
  identity.revision = 0;
  api.request.mockImplementation(
    async ({ path, method }: { path: string; method?: string }) =>
      method
        ? { data: record }
        : path === 'onboardings'
          ? { data: [], meta: { total: 0 } }
          : path === 'onboardings/options'
            ? { data: { canCreate: true } }
            : path === 'directory'
              ? { data: [] }
              : path === 'requisitions'
                ? { data: [] }
                : path.endsWith('/options') && path !== 'onboardings/options'
                  ? {
                      data: [
                        { id: 'd', title: 'Engineering' },
                        { id: 'p', title: 'Developer' },
                        { id: 'g', title: 'Grade A' },
                      ],
                    }
                  : path === 'directory'
                    ? { data: [] }
                    : { data: detail },
  );
});
it('keeps initiation available on an empty list and uses real status pagination query', async () => {
  mount(<List />, '/onboardings?status=cancelled&page=2');
  expect(
    await screen.findByRole('button', { name: 'New onboarding' }),
  ).toBeInTheDocument();
  await screen.findByText('No onboarding records match your filters');
  expect(api.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'onboardings',
      query: { status: 'cancelled', page: '2', pageSize: '20' },
    }),
  );
});
it('uses server task offers and never automatically loads private facades', async () => {
  api.request.mockResolvedValue({
    data: { ...detail, tasks: [task('it', [])] },
  });
  mount(<Detail />, '/onboardings/o1');
  await screen.findByText('Account and equipment');
  expect(
    screen.queryByRole('link', { name: 'Complete' }),
  ).not.toBeInTheDocument();
  expect(
    api.request.mock.calls.some(([r]) => /\/(salary|bank)$/.test(r.path)),
  ).toBe(false);
});
it.each([
  ['bank', 'Payroll account and social insurance', null],
  ['bank', 'Payroll account and social insurance', {}],
  ['salary', 'Salary', null],
] as const)(
  'shows feedback when %s has no recorded facts (%j)',
  async (kind, label, facts) => {
    grants.add('viewBank');
    api.request.mockImplementation(async ({ path }: { path: string }) => ({
      data: path === `onboardings/o1/${kind}` ? facts : detail,
    }));
    mount(<Detail />, '/onboardings/o1');
    const button = await screen.findByRole('button', {
      name: label,
      exact: true,
    });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(button);
    const message =
      kind === 'bank'
        ? 'Payroll account and social insurance details have not been recorded. Check the finance task progress.'
        : 'Salary details have not been recorded. Contact HR to check.';
    expect(await screen.findByText(message)).toBeVisible();
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(
      document.getElementById(button.getAttribute('aria-controls')!),
    ).toHaveTextContent(message);
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  },
);
it('loads private facts on demand and hides them on collapse and authorization revision', async () => {
  api.request.mockImplementation(async ({ path }: { path: string }) => ({
    data:
      path === 'onboardings/o1/salary' ? { baseSalary: '12345.00' } : detail,
  }));
  mount(<Detail />, '/onboardings/o1');
  const button = await screen.findByRole('button', {
    name: 'Salary',
    exact: true,
  });
  await userEvent.click(button);
  expect(await screen.findByText('12345.00')).toBeVisible();
  await userEvent.click(button);
  expect(screen.queryByText('12345.00')).not.toBeInTheDocument();
  await userEvent.click(button);
  await screen.findByText('12345.00');
  act(() => {
    grants.delete('viewSalary');
    identity.revision++;
    identity.listeners.forEach((listener) => listener());
  });
  expect(screen.queryByText('12345.00')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Salary', exact: true }),
  ).not.toBeInTheDocument();
});
it('shows a retry after private facts fail to load', async () => {
  let attempts = 0;
  api.request.mockImplementation(async ({ path }: { path: string }) => {
    if (path === 'onboardings/o1/salary') {
      if (!attempts++) throw new Error('network');
      return { data: { baseSalary: '12345.00' } };
    }
    return { data: detail };
  });
  mount(<Detail />, '/onboardings/o1');
  await userEvent.click(
    await screen.findByRole('button', { name: 'Salary', exact: true }),
  );
  await userEvent.click(
    await screen.findByRole('button', { name: 'Retry', exact: true }),
  );
  expect(await screen.findByText('12345.00')).toBeVisible();
});
it('ordinary IT completion fixes created account and submits real facts plus task version', async () => {
  mount(<Action />);
  await screen.findByLabelText(fieldLabel('Device reference'));
  expect(screen.getByLabelText(fieldLabel('Created account'))).toHaveValue(
    'new-user',
  );
  fireEvent.change(screen.getByLabelText(fieldLabel('Device reference')), {
    target: { value: 'asset-issued-42' },
  });
  fireEvent.change(screen.getByLabelText(fieldLabel('Reason')), {
    target: { value: 'Equipment issued' },
  });
  fireEvent.submit(document.querySelector('form')!);
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'onboardings/o1/tasks/o1%3Ait/actions',
        method: 'POST',
        json: expect.objectContaining({
          expectedVersion: 3,
          action: 'complete',
          facts: { accountId: 'new-user', deviceReference: 'asset-issued-42' },
          reason: 'Equipment issued',
          requestId: expect.any(String),
        }),
      }),
    ),
  );
});
it('unknown outcome freezes editing and retries identical command', async () => {
  let attempts = 0;
  api.request.mockImplementation(async ({ method }: { method?: string }) => {
    if (method) {
      if (!attempts++) throw new Error('network');
      return { data: record };
    }
    return { data: detail };
  });
  mount(<Action />);
  await screen.findByLabelText(fieldLabel('Device reference'));
  fireEvent.change(screen.getByLabelText(fieldLabel('Device reference')), {
    target: { value: 'issued-2' },
  });
  fireEvent.change(screen.getByLabelText(fieldLabel('Reason')), {
    target: { value: 'Done' },
  });
  fireEvent.submit(document.querySelector('form')!);
  await screen.findByRole('button', { name: 'Retry same command' });
  expect(screen.getByLabelText(fieldLabel('Device reference'))).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry same command' }));
  await waitFor(() =>
    expect(api.request.mock.calls.filter(([r]) => r.method)).toHaveLength(2),
  );
  const writes = api.request.mock.calls.filter(([r]) => r.method);
  expect(writes[0][0].json).toEqual(writes[1][0].json);
});
it('stale conflict preserves bank input and prevents an obsolete command retry', async () => {
  let attempts = 0;
  api.request.mockImplementation(async ({ method }: { method?: string }) => {
    if (method && attempts++ === 0)
      throw new ApiClientError('stale', {
        status: 409,
        method: 'POST',
        url: 'onboardings/o1/tasks/o1:finance/actions',
      });
    return {
      data: {
        ...detail,
        tasks: [{ ...task('finance'), version: attempts ? 8 : 3 }],
      },
    };
  });
  mount(<Action />, '/onboardings/o1/tasks/o1%3Afinance/complete');
  await screen.findByLabelText(fieldLabel('Bank account'));
  for (const [label, value] of [
    ['Bank', 'Bank A'],
    ['Bank account', 'secret-account'],
    ['Account holder', 'New employee'],
    ['Social insurance reference', 'soc-1'],
    ['Reason', 'Checked'],
  ])
    fireEvent.change(screen.getByLabelText(fieldLabel(label)), {
      target: { value },
    });
  fireEvent.submit(document.querySelector('form')!);
  await waitFor(() =>
    expect(screen.getByLabelText(fieldLabel('Bank account'))).toHaveValue(
      'secret-account',
    ),
  );
  expect(
    screen.getByRole('button', { name: 'Complete', exact: true }),
  ).toBeDisabled();
  await userEvent.click(
    await screen.findByRole('button', { name: 'Load latest' }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Complete', exact: true }),
    ).toBeEnabled(),
  );
  expect(screen.getByLabelText(fieldLabel('Bank account'))).toHaveValue(
    'secret-account',
  );
  fireEvent.submit(document.querySelector('form')!);
  await waitFor(() =>
    expect(api.request.mock.calls.filter(([r]) => r.method)).toHaveLength(2),
  );
  const writes = api.request.mock.calls.filter(([r]) => r.method);
  expect(writes[0][0].json.expectedVersion).toBe(3);
  expect(writes[1][0].json.expectedVersion).toBe(8);
  expect(writes[1][0].json.requestId).not.toBe(writes[0][0].json.requestId);
  expect(writes[1][0].json.facts.bankAccount).toBe('secret-account');
});
it('authorization revision drops unsaved private task fields', async () => {
  api.request.mockResolvedValue({
    data: { ...detail, tasks: [task('finance')] },
  });
  mount(<Action />, '/onboardings/o1/tasks/o1%3Afinance/complete');
  await screen.findByLabelText(fieldLabel('Bank account'));
  fireEvent.change(screen.getByLabelText(fieldLabel('Bank account')), {
    target: { value: 'private' },
  });
  act(() => {
    identity.revision++;
    identity.listeners.forEach((v) => v());
  });
  await waitFor(() =>
    expect(screen.getByLabelText(fieldLabel('Bank account'))).toHaveValue(''),
  );
});
it('recovery completion collects its receipt rather than original device facts', async () => {
  api.request.mockResolvedValue({
    data: {
      ...detail,
      record: { ...record, status: 'cancelled' },
      tasks: [task('recovery:it')],
    },
  });
  mount(<Action />, '/onboardings/o1/tasks/o1%3Arecovery%3Ait/complete');
  await screen.findByLabelText(fieldLabel('Recovery receipt'));
  expect(
    screen.queryByLabelText(fieldLabel('Device reference')),
  ).not.toBeInTheDocument();
});
it('requires readable salary capability before offering employee creation inputs', async () => {
  grants.delete('viewSalary');
  mount(<Form />, '/onboardings/new');
  await screen
    .findByText('You do not have permission to view this content.')
    .catch(() => undefined);
  expect(
    screen.queryByLabelText(fieldLabel('Base salary')),
  ).not.toBeInTheDocument();
  expect(api.request).not.toHaveBeenCalled();
});

it('creates from a real current recruiting allocation with immutable version and no frozen-field overrides', async () => {
  api.request.mockImplementation(
    async ({ path, method }: { path: string; method?: string }) =>
      method
        ? { data: record }
        : path === 'onboardings/options'
          ? { data: { canCreate: true } }
          : path === 'directory'
            ? { data: [{ id: 'mentor-1', name: 'Actual mentor', code: 'M-1' }] }
            : path === 'requisitions'
              ? {
                  data: [
                    {
                      id: 'closed',
                      status: 'closed',
                      remaining: 1,
                      version: 1,
                      departmentId: 'd',
                      positionId: 'p',
                      gradeId: 'g',
                    },
                    {
                      id: 'allocation-1',
                      status: 'recruiting',
                      remaining: 2,
                      version: 7,
                      departmentId: 'd',
                      positionId: 'p',
                      gradeId: 'g',
                    },
                  ],
                }
              : path.endsWith('/options') && path !== 'onboardings/options'
                ? {
                    data: [
                      { id: 'd', title: 'Engineering' },
                      { id: 'p', title: 'Developer' },
                      { id: 'g', title: 'Grade A' },
                    ],
                  }
                : path === 'directory'
                  ? {
                      data: [
                        { id: 'mentor-1', name: 'Actual mentor', code: 'M-1' },
                      ],
                    }
                  : { data: detail },
  );
  mount(<Form />, '/onboardings/new');
  const user = userEvent.setup();
  await screen.findByLabelText(fieldLabel('Employee name'));
  await user.click(
    screen.getByLabelText(fieldLabel('Recruitment allocation *')),
  );
  expect(
    screen.queryByRole('option', { name: /closed/ }),
  ).not.toBeInTheDocument();
  await user.click(
    await screen.findByRole('option', {
      name: /Engineering.*Developer.*Grade A/,
    }),
  );
  for (const [label, value] of [
    ['Employee name', 'Synthetic hire'],
    ['Account email', 'synthetic@example.test'],
    ['Initial password', 'temporary-12345'],
    ['Employee code', 'SYN-1'],
    ['Hire date', '2026-10-11'],
    ['Probation end date', '2027-01-11'],
    ['Base salary', '12000.00'],
    ['Creation reason', 'Synthetic contract test'],
    ['Workstation requirements', 'Desk near the team'],
  ])
    fireEvent.change(screen.getByLabelText(fieldLabel(label)), {
      target: { value },
    });
  await user.click(screen.getByLabelText(fieldLabel('Mentor employee')));
  await user.click(
    await screen.findByRole('option', { name: /Actual mentor.*M-1/ }),
  );
  fireEvent.submit(document.querySelector('form')!);
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'onboardings',
        json: expect.objectContaining({
          requisitionId: 'allocation-1',
          requisitionVersion: 7,
          employee: {
            code: 'SYN-1',
            name: 'Synthetic hire',
            managerId: null,
            hireDate: '2026-10-11',
            careerStartDate: null,
            probationEndDate: '2027-01-11',
          },
          baseSalary: '12000.00',
          mentorEmployeeId: 'mentor-1',
          workstationRequirement: 'Desk near the team',
        }),
      }),
    ),
  );
  const body = api.request.mock.calls.find(([r]) => r.method)?.[0].json;
  expect(body).not.toHaveProperty('departmentId');
  expect(body).not.toHaveProperty('positionId');
  expect(body).not.toHaveProperty('gradeId');
});
it('does not create after IME Enter in a task result field', async () => {
  mount(<Action />);
  await screen.findByLabelText(fieldLabel('Device reference'));
  fireEvent.change(screen.getByLabelText(fieldLabel('Device reference')), {
    target: { value: 'issued-1' },
  });
  fireEvent.change(screen.getByLabelText(fieldLabel('Reason')), {
    target: { value: '完成' },
  });
  const accepted = fireEvent.keyDown(
    screen.getByLabelText(fieldLabel('Reason')),
    {
      key: 'Enter',
      keyCode: 229,
      isComposing: true,
    },
  );
  expect(accepted).toBe(false);
  expect(api.request.mock.calls.filter(([r]) => r.method)).toHaveLength(0);
});
it('actual creation eligibility denial prevents both inputs and recruitment source queries', async () => {
  api.request.mockResolvedValue({ data: { canCreate: false } });
  mount(<Form />, '/onboardings/new');
  await waitFor(() => expect(api.request).toHaveBeenCalled());
  await waitFor(() =>
    expect(
      screen.queryByLabelText(fieldLabel('Employee name')),
    ).not.toBeInTheDocument(),
  );
  expect(api.request.mock.calls.some(([r]) => r.path === 'requisitions')).toBe(
    false,
  );
});

it('required task fields show inline error and focus the first missing field', async () => {
  mount(<Action />);
  await screen.findByLabelText(fieldLabel('Device reference'));
  fireEvent.submit(document.querySelector('form')!);
  expect(screen.getByLabelText(fieldLabel('Device reference'))).toHaveFocus();
  expect(screen.getByLabelText(fieldLabel('Device reference'))).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  expect(screen.getAllByText('Enter Device reference.').length).toBeGreaterThan(
    0,
  );
  expect(api.request.mock.calls.filter(([r]) => r.method)).toHaveLength(0);
  fireEvent.change(screen.getByLabelText(fieldLabel('Device reference')), {
    target: { value: 'corrected-reference' },
  });
  expect(screen.queryByText('Enter Device reference.')).not.toBeInTheDocument();
  expect(screen.getByText('Enter Reason.')).toBeInTheDocument();
});
it('creation options server error retains a retry and never loads source options', async () => {
  api.request.mockRejectedValue(
    new ApiClientError('Server error', {
      status: 500,
      method: 'GET',
      url: 'onboardings/options',
    }),
  );
  mount(<Form />, '/onboardings/new');
  expect(
    await screen.findByRole('button', { name: 'Retry', exact: true }),
  ).toBeVisible();
  expect(api.request.mock.calls.some(([r]) => r.path === 'requisitions')).toBe(
    false,
  );
});
it('cancellation requires a named destructive confirmation before its current-version write', async () => {
  mount(<Action />, '/onboardings/o1/cancel');
  await screen.findByLabelText(fieldLabel('Reason'));
  fireEvent.change(screen.getByLabelText(fieldLabel('Reason')), {
    target: { value: 'Declined hire' },
  });
  fireEvent.submit(document.querySelector('form')!);
  expect(api.request.mock.calls.filter(([r]) => r.method)).toHaveLength(0);
  expect(await screen.findByRole('alertdialog')).toHaveTextContent(
    'New employee',
  );
  const buttons = screen.getAllByRole('button', {
    name: 'Confirm',
    exact: true,
  });
  fireEvent.click(buttons[buttons.length - 1]);
  await waitFor(() =>
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'onboardings/o1/cancel',
        json: expect.objectContaining({
          expectedVersion: 4,
          reason: 'Declined hire',
        }),
      }),
    ),
  );
});

it('explains unsupported onboarding attachments without sending an upload', () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <AttachmentEditor
        id='o1'
        taskId='task'
        ids={[]}
        onChange={vi.fn()}
        disabled={false}
        onBusy={vi.fn()}
      />
    </TestI18nProvider>,
  );
  fireEvent.change(screen.getByLabelText('Upload attachment'), {
    target: { files: [new File(['unsupported'], 'evidence.exe')] },
  });
  expect(screen.getByRole('alert')).toHaveTextContent('20');
  expect(screen.getByRole('alert')).toHaveTextContent('PDF');
  expect(api.request).not.toHaveBeenCalled();
});

it.each(['create', 'complete'])(
  'does not replay the %s drawer entrance after delayed data',
  async (mode) => {
    const original = api.request.getMockImplementation()!;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    api.request.mockImplementation(async (request) => {
      if (
        request.path ===
        (mode === 'create' ? 'onboardings/options' : 'onboardings/o1')
      )
        await pending;
      return original(request);
    });
    mount(
      mode === 'create' ? <Form /> : <Action />,
      mode === 'create'
        ? '/onboardings/new'
        : '/onboardings/o1/tasks/o1%3Ait/complete',
    );
    expect(screen.getByRole('dialog')).not.toHaveClass(
      'data-open:animate-none',
    );
    await act(async () => {
      release();
    });
    await screen.findByLabelText(
      mode === 'create'
        ? fieldLabel('Employee name')
        : fieldLabel('Device reference'),
    );
    expect(screen.getByRole('dialog')).toHaveClass('data-open:animate-none');
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      'data-open:animate-none',
    );
  },
);
