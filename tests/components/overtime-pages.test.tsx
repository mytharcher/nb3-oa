import { ApiClientError } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import overtime from '../../client/locales/modules/overtime.en-US.js';
import Index from '../../client/pages/overtime/index.js';
import List from '../../client/pages/overtime/list.js';
import Form from '../../client/pages/overtime/form-dialog.js';
import Detail from '../../client/pages/overtime/detail.js';
import Action from '../../client/pages/overtime/action-dialog.js';
const { api, toaster, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  toaster: { show: vi.fn() },
  permission: { can: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => toaster,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: permission.can, isPending: false }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'alice' } } }),
}));
// The date picker's own calendar behavior is covered separately; this isolates serialization and form lifecycle.
vi.mock('../../client/components/date-picker.js', () => ({
  DatePicker: ({
    id,
    value,
    onChange,
    disabled,
  }: {
    id: string;
    value?: Date;
    onChange: (v: Date) => void;
    disabled: boolean;
  }) => (
    <input
      id={id}
      value={value?.toISOString().slice(0, 10) ?? ''}
      onChange={(e) => onChange(new Date(`${e.target.value}T00:00:00Z`))}
      disabled={disabled}
    />
  ),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...overtime } },
});
const record = {
  id: 'o1',
  applicantId: 'alice',
  applicant: { id: 'alice', name: 'Alice' },
  createdById: 'alice',
  number: 'OT-001',
  date: '2026-10-10',
  minutes: 300,
  monthlyMinutes: 900,
  settlement: 'compensatory',
  reason: 'Release preparation',
  status: 'draft',
  lifecycleVersion: 4,
  ruleSnapshot: null,
  hrRecipients: [],
  requiresHr: false,
  managerApproverId: 'manager',
  createdAt: '2026-10-10T10:00:00Z',
};
function detail() {
  return {
    record: { ...record },
    users: [{ id: 'alice', name: 'Alice' }],
    view: {
      state: 'draft',
      record,
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
  query?: Record<string, string>;
};
function serve(write?: (r: Request) => unknown, data = detail()) {
  api.request.mockImplementation(async (r: Request) => {
    if (r.path === 'users')
      return { data: [], meta: { total: 0, page: 1, pageSize: 20 } };
    if (r.method === 'POST') return write?.(r) ?? { data: { record } };
    if (r.path === 'overtimeRequests') return { data: [record] };
    return { data };
  });
}
function open(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/overtime',
        element: <Index />,
        children: ['todo', 'done', 'copied', 'mine'].map((tab) => ({
          path: tab,
          element: <List />,
          children: [
            { path: 'newOvertime', element: <Form /> },
            { path: 'editOvertime/:requestId', element: <Form /> },
            {
              path: 'overtime/:requestId',
              element: <Detail />,
              children: [
                { path: 'edit', element: <Form /> },
                { path: 'action/:actionName/:targetId', element: <Action /> },
              ],
            },
          ],
        })),
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
function failure(status: number) {
  return new ApiClientError('private error', {
    status,
    method: 'POST',
    url: '/api/overtimeRequests',
  } as ConstructorParameters<typeof ApiClientError>[1]);
}
beforeEach(() => {
  api.request.mockReset();
  toaster.show.mockReset();
  permission.can = true;
});
describe('overtime request pages', () => {
  it('loads the selected view and keeps filters when opening a record', async () => {
    serve();
    const router = open('/overtime/mine?q=Alice');
    const reference = await screen.findByRole('link', { name: /OT-001/ });
    await userEvent.click(reference);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/overtime/mine/overtime/o1'),
    );
    expect(router.state.location.search).toBe('?q=Alice');
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'overtimeRequests',
        query: { view: 'mine' },
      }),
    );
    expect(
      await screen.findByText('Monthly total (minutes)'),
    ).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
  });
  it('saves latest edit version and refreshes the originating list', async () => {
    serve();
    const router = open('/overtime/mine/editOvertime/o1?q=Alice');
    const dialog = await screen.findByRole('dialog');
    const reason = await within(dialog).findByRole('textbox', {
      name: 'Reason *',
    });
    await userEvent.clear(reason);
    await userEvent.type(reason, 'Production support');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/overtime/mine'),
    );
    const writes = api.request.mock.calls.filter(([r]) => r.method === 'POST');
    expect(writes).toHaveLength(1);
    expect(writes[0][0]).toMatchObject({
      path: 'overtimeRequests/o1/transition',
      json: {
        transition: 'edit',
        version: 4,
        input: {
          date: '2026-10-10',
          minutes: 300,
          settlement: 'compensatory',
          reason: 'Production support',
        },
      },
    });
    expect(router.state.location.search).toBe('?q=Alice');
    expect(toaster.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    );
  });
  it('keeps edit inputs and reuses the same request payload after network failure', async () => {
    let attempts = 0;
    serve(() => {
      if (++attempts === 1) throw new Error('Disconnected');
      return { data: { record } };
    });
    open('/overtime/mine/editOvertime/o1');
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByDisplayValue('Release preparation');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
    );
    await within(dialog).findByText(enUS.approvals.error.failed);
    expect(
      within(dialog).getByDisplayValue('Release preparation'),
    ).toBeInTheDocument();
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const writes = api.request.mock.calls.filter(([r]) => r.method === 'POST');
    expect(writes).toHaveLength(2);
    expect(writes[0][0].json).toEqual(writes[1][0].json);
  });
  it('prevents an uncertain draft creation from being sent twice', async () => {
    serve(() => {
      throw new Error('Response lost');
    });
    open('/overtime/mine/newOvertime');
    const dialog = await screen.findByRole('dialog');
    const dateInput = within(dialog).getByLabelText('Overtime date *');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(dateInput, { target: { value: '2026-10-10' } });
    await userEvent.type(
      within(dialog).getByLabelText('Reason *'),
      'Release support',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    );
    expect(
      await within(dialog).findByText(overtime.overtime.uncertainCreate),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    ).toBeDisabled();
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(1);
  });
  it('refuses fractional duration without sending a write', async () => {
    serve();
    open('/overtime/mine/editOvertime/o1');
    const dialog = await screen.findByRole('dialog');
    const minutes = await within(dialog).findByRole('spinbutton', {
      name: 'Duration (minutes) *',
    });
    await userEvent.clear(minutes);
    await userEvent.type(minutes, '1.5');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
    );
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(0);
  });
  it('denies creation without submit or delegate permission', async () => {
    serve();
    permission.can = false;
    open('/overtime/mine/newOvertime');
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByText(enUS.approvals.readOnly),
    ).toBeInTheDocument();
  });
  it('shows no retry for forbidden or missing detail', async () => {
    api.request.mockImplementation(async (r: Request) => {
      if (r.path === 'overtimeRequests') return { data: [record] };
      throw failure(403);
    });
    open('/overtime/mine/overtime/o1');
    expect(
      await screen.findByText(enUS.approvals.error.forbidden),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });
  it('confirms submit and retries with one request id and latest version', async () => {
    let attempts = 0;
    serve(() => {
      if (++attempts === 1) throw failure(500);
      return { data: { record: { ...record, status: 'manager' } } };
    });
    open('/overtime/mine/overtime/o1');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Submit', exact: true }),
    );
    const confirmation = await screen.findByRole('alertdialog');
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(0);
    await userEvent.click(
      within(confirmation).getByRole('button', { name: 'Submit' }),
    );
    await within(confirmation).findByText(enUS.approvals.error.failed);
    await userEvent.click(
      within(confirmation).getByRole('button', { name: 'Submit' }),
    );
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    const writes = api.request.mock.calls.filter(([r]) => r.method === 'POST');
    expect(writes).toHaveLength(2);
    expect(writes[0][0].json).toEqual(writes[1][0].json);
    expect(writes[0][0].json).toMatchObject({
      version: 4,
      transition: 'submit',
    });
  });
  function offered(action = 'approve', options: Record<string, unknown> = {}) {
    return {
      ...detail(),
      view: { ...detail().view, available: [] },
      taskActions: [
        {
          task: { id: 'task-1', runId: 'run-1' },
          onBehalfOf: null,
          actions: [
            {
              name: action,
              options,
              contentHash: true,
              primary: true,
              tone: 'primary',
            },
          ],
        },
      ],
      runActions: [
        {
          run: { id: 'run-1', contentHash: 'reviewed-overtime' },
          onBehalfOf: null,
          actions: [],
        },
      ],
    };
  }
  it('sends the reviewed approval hash and allows optional blank opinion', async () => {
    serve(undefined, offered() as ReturnType<typeof detail>);
    const router = open('/overtime/todo/overtime/o1/action/approve/task-1');
    const dialog = await screen.findByRole('dialog', { name: /^Approve/i });
    await within(dialog).findByText('Release preparation');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Approve', exact: true }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/overtime/todo/overtime/o1'),
    );
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: 'overtimeRequests/o1/action',
        json: expect.objectContaining({
          action: 'approve',
          target: { taskId: 'task-1' },
          contentHash: 'reviewed-overtime',
        }),
      }),
    );
  });
  it('reports missing settlement fields as a schema problem rather than invalid applicant input', async () => {
    serve(
      () => {
        throw new ApiClientError('Field "expiredMinutes" does not exist.', {
          status: 400,
          reason: 'FIELD_NOT_FOUND',
          method: 'POST',
          url: '/api/overtimeRequests/o1/action',
        } as ConstructorParameters<typeof ApiClientError>[1]);
      },
      offered() as ReturnType<typeof detail>,
    );
    const router = open('/overtime/todo/overtime/o1/action/approve/task-1');
    const dialog = await screen.findByRole('dialog', { name: /^Approve/i });
    await within(dialog).findByText('Release preparation');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Approve', exact: true }),
    );
    await within(dialog).findByText(
      'The overtime database schema needs updating. This operation cannot be completed yet. Contact an administrator.',
    );
    expect(
      within(dialog).queryByText(
        'Review the overtime date, duration, settlement and reason.',
      ),
    ).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      '/overtime/todo/overtime/o1/action/approve/task-1',
    );
    expect(toaster.show).not.toHaveBeenCalled();
  });
  it('requires an offered reason and selects transfer recipients from its eligible endpoint', async () => {
    const data = offered('transfer', { reasonRequired: true });
    api.request.mockImplementation(async (r: Request) => {
      if (r.path.endsWith('/candidates'))
        return {
          data: {
            people: [{ id: 'bob', name: 'Bob eligible' }],
            nextOffset: null,
          },
        };
      if (r.path === 'overtimeRequests') return { data: [record] };
      if (r.method === 'POST') return { data: { outcome: 'transferred' } };
      return { data };
    });
    const router = open('/overtime/todo/overtime/o1/action/transfer/task-1');
    const dialog = await screen.findByRole('dialog', { name: /^Transfer/i });
    await within(dialog).findByRole('textbox', { name: 'Reason *' });
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Transfer', exact: true }),
    );
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(0);
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Reason *' }),
      'Same department cover',
    );
    const combo = within(dialog).getByRole('combobox', { name: 'Approver *' });
    await waitFor(() => expect(combo).not.toBeDisabled());
    await userEvent.click(combo);
    await userEvent.click(
      await screen.findByRole('option', { name: 'Bob eligible' }),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Transfer', exact: true }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/overtime/todo/overtime/o1'),
    );
    const write = api.request.mock.calls.find(
      ([r]) => r.method === 'POST',
    )?.[0];
    expect(write.json).toMatchObject({
      action: 'transfer',
      input: { to: 'bob' },
      comment: 'Same department cover',
      contentHash: 'reviewed-overtime',
    });
    expect(api.request.mock.calls.some(([r]) => r.path === 'users')).toBe(
      false,
    );
  });
  it('uses the offered add-signer mode and a scoped candidate', async () => {
    const data = offered('addSigner', {
      reasonRequired: false,
      modes: ['alongside'],
    });
    api.request.mockImplementation(async (r: Request) => {
      if (r.path.endsWith('/candidates'))
        return {
          data: {
            people: [{ id: 'bob', name: 'Bob eligible' }],
            nextOffset: null,
          },
        };
      if (r.path === 'overtimeRequests') return { data: [record] };
      if (r.method === 'POST') return { data: { outcome: 'added' } };
      return { data };
    });
    open('/overtime/todo/overtime/o1/action/addSigner/task-1');
    const dialog = await screen.findByRole('dialog', { name: /^Add signer/i });
    const combo = await within(dialog).findByRole('combobox', {
      name: 'Approver *',
    });
    await waitFor(() => expect(combo).not.toBeDisabled());
    await userEvent.click(combo);
    await userEvent.click(
      await screen.findByRole('option', { name: 'Bob eligible' }),
    );
    const mode = within(dialog).getByRole('combobox', {
      name: 'Signer mode *',
    });
    expect(mode).toHaveTextContent(enUS.approvals.signeralongside);
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Add signer', exact: true }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /^Add signer/i })).toBeNull(),
    );
    expect(
      api.request.mock.calls.find(([r]) => r.method === 'POST')?.[0].json,
    ).toMatchObject({
      action: 'addSigner',
      input: { person: 'bob', mode: 'alongside' },
    });
  });
  it('urges the offered run without inventing a mandatory reason', async () => {
    const data = {
      ...detail(),
      view: { ...detail().view, available: [] },
      runActions: [
        {
          run: { id: 'run-1', contentHash: 'reviewed-overtime' },
          onBehalfOf: null,
          actions: [
            {
              name: 'urge',
              options: { reasonRequired: false },
              contentHash: false,
              primary: false,
              tone: 'default',
            },
          ],
        },
      ],
    };
    serve(undefined, data as ReturnType<typeof detail>);
    open('/overtime/mine/overtime/o1/action/urge/run-1');
    const dialog = await screen.findByRole('dialog', { name: /^Remind/i });
    await within(dialog).findByText('Release preparation');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Remind', exact: true }),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: /^Remind/ })).toBeNull(),
    );
    expect(
      api.request.mock.calls.find(([r]) => r.method === 'POST')?.[0].json,
    ).toMatchObject({ action: 'urge', target: { runId: 'run-1' }, input: {} });
  });
});
