import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import cancellation from '../../client/locales/modules/leave-cancellations.en-US.js';
import Form from '../../client/pages/leave-cancellations/form-dialog.js';
import Detail from '../../client/pages/leave-cancellations/detail.js';
import Action from '../../client/pages/leave-cancellations/action-dialog.js';
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
  application: { namespace: 'nb3-oa', resources: { ...enUS, ...cancellation } },
});
const record = {
  id: 'c1',
  originalLeaveId: 'l1',
  applicantId: 'alice',
  createdById: 'alice',
  number: 'LEAVECANCEL001',
  startDate: '2027-01-04',
  startHalf: 'am',
  endDate: '2027-01-04',
  endHalf: 'pm',
  leaveType: 'annual',
  cancelAll: false,
  days: '1',
  baseline: {
    originalNumber: 'LEAVE001',
    endDate: '2027-01-05',
    endHalf: 'pm',
  },
  reason: 'Changed plans',
  status: 'draft',
  lifecycleVersion: 4,
  createdAt: '2026-10-10T10:00:00Z',
};
const source = {
  id: 'l1',
  number: 'LEAVE001',
  startDate: '2027-01-04',
  endDate: '2027-01-05',
  startHalf: 'am',
  endHalf: 'pm',
  leaveType: 'annual',
  days: '2',
  timeZone: 'Asia/Shanghai',
};
function detail() {
  return {
    record,
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
};
function serve(write?: (r: Request) => unknown) {
  api.request.mockImplementation(async (r: Request) => {
    if (r.method === 'POST') return write?.(r) ?? { data: { record } };
    if (r.path === 'leaveRequests?view=mine')
      return {
        data: [
          { ...record, id: 'l1', number: 'LEAVE001', status: 'approved' },
          {
            ...record,
            id: 'foreign',
            applicantId: 'bob',
            number: 'PRIVATE',
            status: 'approved',
          },
        ],
      };
    if (r.path.startsWith('leaveCancellations/originals/'))
      return { data: source };
    return { data: detail() };
  });
}
function open(path: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/approvals/mine',
        element: <Outlet context={{ reload: vi.fn() }} />,
        children: [
          { path: 'newCancellation', element: <Form /> },
          { path: 'editCancellation/:requestId', element: <Form /> },
          {
            path: 'cancellation/:requestId',
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
beforeEach(() => {
  api.request.mockReset();
  toaster.show.mockReset();
  permission.can = true;
});
describe('cancellation client flow', () => {
  it('prefills the latest effective original range and saves on the current tab', async () => {
    serve();
    const router = open(
      '/approvals/mine/newCancellation?originalLeaveId=l1&q=Alice',
    );
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText(/LEAVE001: Jan 4, 2027/);
    await userEvent.type(
      within(dialog).getByLabelText('Reason *'),
      'Changed trip',
    );
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Save draft' }),
      ).not.toBeDisabled(),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/approvals/mine'),
    );
    expect(
      api.request.mock.calls.find(([r]) => r.method === 'POST')?.[0].json,
    ).toMatchObject({
      originalLeaveId: 'l1',
      endDate: '2027-01-05',
      endHalf: 'pm',
      cancelAll: false,
      reason: 'Changed trip',
    });
    expect(router.state.location.search).toContain('q=Alice');
  });
  it('serializes current version and keeps original identity out of edits', async () => {
    serve();
    open('/approvals/mine/editCancellation/c1');
    const dialog = await screen.findByRole('dialog');
    const reason = await within(dialog).findByDisplayValue('Changed plans');
    await userEvent.clear(reason);
    await userEvent.type(reason, 'Confirmed return');
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
      ).not.toBeDisabled(),
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft', exact: true }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const write = api.request.mock.calls.find(
      ([r]) => r.method === 'POST',
    )?.[0];
    expect(write.json).toMatchObject({
      transition: 'edit',
      version: 4,
      input: {
        cancelAll: false,
        endDate: '2027-01-04',
        endHalf: 'pm',
        reason: 'Confirmed return',
      },
    });
    expect(write.json.input).not.toHaveProperty('originalLeaveId');
  });
  it('locks an uncertain create and preserves the entered reason', async () => {
    serve(() => {
      throw new Error('Lost response');
    });
    open('/approvals/mine/newCancellation?originalLeaveId=l1');
    const dialog = await screen.findByRole('dialog');
    await within(dialog).findByText(/LEAVE001: Jan 4, 2027/);
    await userEvent.type(
      within(dialog).getByLabelText('Reason *'),
      'Changed trip',
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    );
    await within(dialog).findByText(
      cancellation.leaveCancellations.uncertainCreate,
    );
    expect(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByDisplayValue('Changed trip'),
    ).toBeInTheDocument();
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(1);
  });
  it('denies creating without a submit grant', async () => {
    serve();
    permission.can = false;
    open('/approvals/mine/newCancellation?originalLeaveId=l1');
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('button', { name: 'Save draft' }),
    ).toBeDisabled();
    expect(
      within(dialog).getByText(enUS.approvals.readOnly),
    ).toBeInTheDocument();
  });
});
