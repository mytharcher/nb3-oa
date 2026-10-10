import { ApiClientError } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import type { ReactNode } from 'react';
import enUS from '../../client/locales/en-US.js';
import ApprovalsPage from '../../client/pages/approvals/index.js';
import ApprovalList from '../../client/pages/approvals/list.js';
import LeaveDetail from '../../client/pages/approvals/detail.js';
import LeaveForm from '../../client/pages/approvals/form-page.js';
import ActionDialog from '../../client/pages/approvals/action-dialog.js';
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
  useCan: () => ({ can: permission.can, isPending: false }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    refresh: vi.fn(),
    session: { user: { id: 'alice' } },
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function I18n({ children }: { children: ReactNode }) {
  return <TestI18nProvider runtime={runtime}>{children}</TestI18nProvider>;
}
const record = {
  id: 'l1',
  applicantId: 'alice',
  applicant: { id: 'alice', name: 'Alice' },
  createdById: 'alice',
  number: 'LEA-1',
  leaveType: 'personal',
  startDate: '2026-10-12',
  endDate: '2026-10-12',
  startHalf: 'am',
  endHalf: 'pm',
  days: 1,
  reason: 'Family appointment',
  attachments: [],
  handoverUserId: null,
  enableDelegation: false,
  status: 'draft',
  lifecycleVersion: 3,
  createdAt: '2026-10-10T10:00:00Z',
};
const detail = () => ({
  record: { ...record },
  users: [{ id: 'alice', name: 'Alice' }],
  view: {
    record,
    state: 'draft',
    version: 3,
    available: [
      {
        name: 'edit',
        allowed: true,
        blockers: [],
        to: ['draft'],
        title: 'Edit',
      },
      {
        name: 'submit',
        allowed: true,
        blockers: [],
        to: ['manager'],
        title: 'Submit',
      },
    ],
    history: { transitions: [], effectRuns: [] },
  },
  runs: [],
  taskActions: [],
  runActions: [],
  upcoming: [],
  timeline: { runs: [] },
});
const options = {
  leaveTypes: [
    {
      code: 'personal',
      label: { 'en-US': 'Personal leave' },
      active: true,
      extra: {},
    },
  ],
  balanceAvailable: false,
  timeZone: 'Asia/Shanghai',
};
type Request = {
  path: string;
  method?: string;
  json?: Record<string, unknown>;
  query?: Record<string, string>;
};
function serve(
  handler: (request: Request) => unknown,
  optionData: unknown = options,
) {
  api.request.mockImplementation((request: Request) => {
    try {
      if (request.path === 'users')
        return Promise.resolve({
          data: [],
          meta: { total: 0, page: 1, pageSize: 20 },
        });
      if (request.path === 'leaveRequests/options')
        return Promise.resolve({ data: optionData });
      if (request.path === 'leaveRequests/preview')
        return Promise.resolve({
          data: {
            days: 1,
            route: { mode: 'stages', steps: [], problems: [], notes: [] },
          },
        });
      return Promise.resolve(handler(request));
    } catch (e) {
      return Promise.reject(e);
    }
  });
}
function error(status: number) {
  return new ApiClientError('private failure', {
    status,
    method: 'GET',
    url: '/api/leaveRequests',
  } as ConstructorParameters<typeof ApiClientError>[1]);
}
function open(path: string) {
  const routes = [
    {
      path: '/approvals',
      element: <ApprovalsPage />,
      children: ['todo', 'done', 'copied', 'mine'].map((tab) => ({
        path: tab,
        element: <ApprovalList />,
        children: [
          { path: 'newLeave', element: <LeaveForm /> },
          { path: 'editLeave/:requestId', element: <LeaveForm /> },
          {
            path: 'leave/:requestId',
            element: <LeaveDetail />,
            children: [
              { path: 'edit', element: <LeaveForm /> },
              {
                path: 'action/:actionName/:targetId',
                element: <ActionDialog />,
              },
            ],
          },
        ],
      })),
    },
  ];
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />, { wrapper: I18n });
  return router;
}
beforeEach(() => {
  api.request.mockReset();
  toaster.show.mockReset();
  permission.can = true;
});
describe('approval center', () => {
  it('redirects only bare center and retains query', async () => {
    serve(() => ({ data: [] }));
    const router = open('/approvals?q=Alice');
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/approvals/todo'),
    );
    expect(router.state.location.search).toBe('?q=Alice');
    expect(await screen.findByText('No matching records')).toBeInTheDocument();
  });
  it('shows resolved applicant and opens detail over the same filtered tab', async () => {
    serve((r) =>
      r.path === 'leaveRequests' ? { data: [record] } : { data: detail() },
    );
    const router = open('/approvals/mine?status=draft');
    await userEvent.click(await screen.findByRole('link', { name: /LEA-1/ }));
    expect(router.state.location.pathname).toBe('/approvals/mine/leave/l1');
    expect(router.state.location.search).toBe('?status=draft');
    expect(await screen.findByText('Family appointment')).toBeInTheDocument();
  });
  it('has a single create action in empty state and hides it without permission', async () => {
    permission.can = false;
    serve(() => ({ data: [] }));
    open('/approvals/todo');
    expect(await screen.findByText('No pending approvals')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New leave request' }),
    ).toBeNull();
  });
  it('clears previously authorized detail and write controls on refreshed 403', async () => {
    let refused = false;
    serve((r) => {
      if (r.path === 'leaveRequests') return { data: [record] };
      if (refused) throw error(403);
      return { data: detail() };
    });
    open('/approvals/mine/leave/l1');
    expect(await screen.findByText('Family appointment')).toBeInTheDocument();
    refused = true;
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Refresh' }).at(-1)!,
    );
    expect(
      await screen.findByText('Access denied. Contact an administrator.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Family appointment')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull();
  });
  it('does not retain first record facts while a different record loads', async () => {
    serve((r) =>
      r.path === 'leaveRequests'
        ? { data: [record] }
        : r.path.endsWith('l1')
          ? { data: detail() }
          : new Promise(() => {}),
    );
    const router = open('/approvals/mine/leave/l1');
    await screen.findByText('Family appointment');
    await router.navigate('/approvals/mine/leave/l2');
    await waitFor(() =>
      expect(screen.queryByText('Family appointment')).toBeNull(),
    );
  });
});
describe('leave editing', () => {
  it('validates only submit and preserves the page on missing fields', async () => {
    serve((r) =>
      r.path === 'leaveRequests'
        ? { data: [] }
        : r.path === 'leaveRequests/options'
          ? { data: options }
          : { data: [] },
    );
    open('/approvals/mine/newLeave');
    await screen.findByRole('button', { name: 'Save draft' });
    expect(screen.queryByText('Enter a value.')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findAllByText('Enter a value.')).not.toHaveLength(0);
    expect(api.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST', path: 'leaveRequests' }),
    );
    expect(
      screen.getByText(enUS.approvals.attachmentLimit),
    ).toBeInTheDocument();
  });
  it('reads latest edit and sends its version with no fake attachments', async () => {
    serve((r) =>
      r.path === 'leaveRequests'
        ? { data: [record] }
        : r.path === 'leaveRequests/options'
          ? { data: options }
          : r.method === 'POST'
            ? { data: { record: { ...record, reason: 'Updated' } } }
            : { data: detail() },
    );
    const router = open('/approvals/mine/editLeave/l1');
    const field = await screen.findByLabelText(/Reason/);
    await userEvent.clear(field);
    await userEvent.type(field, 'Updated');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'leaveRequests/l1/transition',
          json: expect.objectContaining({
            transition: 'edit',
            version: 3,
            input: expect.objectContaining({
              reason: 'Updated',
              attachments: [],
            }) as unknown,
          }) as unknown,
        }),
      ),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/approvals/mine/leave/l1'),
    );
  });
});
describe('approval action dialog', () => {
  function offeredDetail() {
    return {
      ...detail(),
      record: { ...record, status: 'manager' },
      view: { ...detail().view, available: [] },
      runActions: [
        {
          run: { id: 'run-1', contentHash: 'reviewed-hash' },
          onBehalfOf: null,
          actions: [
            {
              name: 'approve',
              options: {},
              batch: false,
              contentHash: true,
              tone: 'primary',
              primary: true,
            },
            {
              name: 'reject',
              options: { reasonRequired: true },
              batch: false,
              contentHash: true,
              tone: 'danger',
              primary: false,
            },
          ],
        },
      ],
    };
  }
  it('posts the reviewed hash and target, then reloads and returns to the same detail', async () => {
    let detailReads = 0;
    serve((r) => {
      if (r.path === 'leaveRequests') return { data: [record] };
      if (r.method === 'POST') return { data: { outcome: 'approved' } };
      detailReads += 1;
      return {
        data: {
          ...offeredDetail(),
          record: {
            ...offeredDetail().record,
            reason:
              detailReads === 1
                ? 'Family appointment'
                : 'Fresh reason for this decision',
          },
        },
      };
    });
    const router = open('/approvals/done/leave/l1?q=Alice');
    await screen.findByText('Family appointment');
    await router.navigate(
      '/approvals/done/leave/l1/action/approve/run-1?q=Alice',
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      await within(dialog).findByText('Fresh reason for this decision'),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText('Family appointment')).toBeNull();
    await userEvent.type(within(dialog).getByLabelText('Comment'), 'Reviewed');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Approve' }),
    );
    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(
        expect.objectContaining({
          path: 'leaveRequests/l1/action',
          json: expect.objectContaining({
            action: 'approve',
            target: { runId: 'run-1' },
            contentHash: 'reviewed-hash',
            comment: 'Reviewed',
            requestId: expect.any(String) as unknown,
          }) as unknown,
        }),
      ),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/approvals/done/leave/l1'),
    );
    expect(router.state.location.search).toBe('?q=Alice');
  });
  it('requires a rejection reason and validates as it changes after first failure', async () => {
    serve((r) =>
      r.path === 'leaveRequests'
        ? { data: [record] }
        : { data: offeredDetail() },
    );
    open('/approvals/todo/leave/l1/action/reject/run-1');
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Reject' }),
    );
    expect(
      await within(dialog).findByText('Enter a value.'),
    ).toBeInTheDocument();
    await userEvent.type(
      within(dialog).getByLabelText(/Reason/),
      'Incorrect dates',
    );
    await waitFor(() =>
      expect(within(dialog).queryByText('Enter a value.')).toBeNull(),
    );
    expect(api.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST' }),
    );
  });
  it('disables balance-backed submission before posting', async () => {
    const annual = { ...record, leaveType: 'annual' };
    serve((r) =>
      r.path === 'leaveRequests'
        ? { data: [annual] }
        : { data: { ...detail(), record: annual } },
    );
    open('/approvals/mine/leave/l1');
    expect(
      await screen.findByRole('button', { name: 'Submit' }),
    ).toBeDisabled();
    expect(api.request).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: 'POST' }),
    );
  });
  it('requires discard confirmation before replacing conflicting edits with latest values', async () => {
    let latest = false;
    serve((r) => {
      if (r.path === 'leaveRequests') return { data: [record] };
      if (r.method === 'POST') {
        latest = true;
        throw error(409);
      }
      return {
        data: {
          ...detail(),
          record: {
            ...record,
            lifecycleVersion: latest ? 4 : 3,
            reason: latest ? 'Other writer' : 'Family appointment',
          },
        },
      };
    });
    open('/approvals/mine/editLeave/l1');
    const reason = await screen.findByLabelText(/Reason/);
    await userEvent.clear(reason);
    await userEvent.type(reason, 'My edit');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(
      await screen.findByRole('button', { name: 'Load latest' }),
    );
    expect(reason).toHaveValue('My edit');
    const confirmation = await screen.findByRole('alertdialog');
    await userEvent.click(
      within(confirmation).getByRole('button', { name: 'Load latest' }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/Reason/)).toHaveValue('Other writer'),
    );
  });
  it('reports a completed decision separately from a failed refresh and prevents another write', async () => {
    let posted = false;
    serve((r) => {
      if (r.path === 'leaveRequests') return { data: [record] };
      if (r.method === 'POST') {
        posted = true;
        return { data: {} };
      }
      if (posted) throw error(500);
      return { data: offeredDetail() };
    });
    open('/approvals/todo/leave/l1/action/approve/run-1');
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Approve' }),
    );
    expect(
      await screen.findByText(enUS.approvals.refreshAfterSuccess),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Approve' }),
    ).toBeDisabled();
    expect(
      api.request.mock.calls.filter(([r]) => r.method === 'POST'),
    ).toHaveLength(1);
  });
  it('disables dictionary-defined attachment requirements', async () => {
    const custom = { ...record, leaveType: 'medicalSupport' };
    serve(
      (r) =>
        r.path === 'leaveRequests'
          ? { data: [custom] }
          : { data: { ...detail(), record: custom } },
      {
        ...options,
        leaveTypes: [
          {
            code: 'medicalSupport',
            active: true,
            label: { 'en-US': 'Medical support' },
            extra: { requiresAttachment: true, attachmentAboveDays: 0.5 },
          },
        ],
      },
    );
    open('/approvals/mine/leave/l1');
    await screen.findAllByText('Medical support');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });
});
