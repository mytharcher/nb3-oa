import { ApiClientError } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  RouterProvider,
  useOutletContext,
} from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import WorkbenchPrototypePage from '../../client/pages/workbench-prototype/index.js';

const { api, permission } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  permission: { workItemCreate: true, announcements: true },
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ success: vi.fn(), error: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: ({
    resource,
    action,
  }: {
    resource: { type: string; id?: string };
    action: string;
  }) => ({
    can:
      resource.id === 'oa.workItems' && action === 'create'
        ? permission.workItemCreate
        : resource.id === 'oa.announcements'
          ? permission.announcements
          : // Only leave can be started, so the quick start card has entries without option reads.
            resource.id === 'oa.leave' ||
            action === 'view' ||
            resource.type === 'page',
    isPending: false,
  }),
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    refresh: vi.fn(),
    session: { user: { id: 'alice', name: 'Alice' } },
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});

const facets = [
  { sourceType: 'approval.task', subject: 'oa.leave', pending: 5 },
  { sourceType: 'approval.task', subject: 'oa.purchase', pending: 2 },
  { sourceType: 'oa.workItem', subject: 'oa.workItem', pending: 3 },
  {
    sourceType: 'oa.announcementReceipt',
    subject: 'oa.announcementReceipt',
    pending: 1,
  },
  { sourceType: 'approval.cc', subject: 'oa.leave', pending: 1 },
  { sourceType: 'approval.application', subject: 'oa.leave', pending: 4 },
];
const item = (
  id: string,
  kind: string,
  extra: Record<string, unknown> = {},
) => ({
  id,
  kind,
  title: `Task ${id}`,
  number: null,
  applicantId: 'bob',
  applicant: { id: 'bob', name: 'Bob' },
  status: 'manager',
  createdAt: '2026-10-20T08:00:00.000Z',
  startDate: null,
  endDate: null,
  amount: null,
  unit: null,
  ...extra,
});

type Fixture = Record<string, (query: Record<string, string>) => unknown>;
let fixture: Fixture;
function serve(overrides: Fixture = {}) {
  fixture = {
    taskCenter: () => ({
      data: {
        tasks: [],
        total: 7,
        counts: { pending: 7, closed: 0, all: 7 },
        facets,
      },
    }),
    'workbench/tasks': (query) =>
      query.view === 'mine'
        ? {
            data: [],
            meta: {
              page: 1,
              pageSize: 5,
              total: 1,
              kinds: ['oa.leave'],
              counts: { drafts: 2, revisions: 1, inProgress: 3 },
              attention: {
                drafts: [],
                revisions: [],
                submitted: [item('m1', 'oa.leave', { applicantId: 'alice' })],
              },
            },
          }
        : {
            data: [
              item('w1', 'oa.workItem', {
                status: 'assigned',
                dueAt: '2020-01-01T00:00:00.000Z',
              }),
              item('l1', 'oa.leave'),
            ],
            meta: {
              page: 1,
              pageSize: 100,
              total: 2,
              kinds: ['oa.leave'],
              counts: { drafts: 0, revisions: 0, inProgress: 0 },
            },
          },
    'leaveBalances/me': () => ({ data: [] }),
    'leaveRequests/options': () => ({ data: { leaveTypes: [] } }),
    'workbench/meetings': () => ({
      data: { date: '2026-10-22', timeZone: 'UTC', total: 0, items: [] },
    }),
    announcements: () => ({
      data: [],
      meta: { page: 1, pageSize: 5, total: 0 },
    }),
    ...overrides,
  };
  api.request.mockImplementation(
    ({
      path,
      query = {},
    }: {
      path: string;
      query?: Record<string, string>;
    }) => {
      const handler = fixture[path];
      if (!handler) return Promise.reject(new Error(`Unexpected ${path}`));
      try {
        return Promise.resolve(handler(query));
      } catch (error) {
        return Promise.reject(error);
      }
    },
  );
}

function Saved() {
  const { reload } = useOutletContext<{ reload: () => void }>();
  return <button onClick={reload}>Saved work item</button>;
}
function open() {
  const router = createMemoryRouter(
    [
      {
        path: '/workbenchPrototype',
        element: <WorkbenchPrototypePage />,
        children: [{ path: 'newWorkItem', element: <Saved /> }],
      },
      { path: '/taskCenter', element: <p>Task center</p> },
    ],
    { initialEntries: ['/workbenchPrototype'] },
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
  permission.workItemCreate = true;
  permission.announcements = true;
});

describe('workbench prototype', () => {
  it('counts every source with the task center labels and links into it', async () => {
    serve();
    open();
    const overview = await screen.findByRole('region', {
      name: 'Tasks by source',
    });
    // Same labels as the task center navigation, valued from its pending facets.
    for (const [label, count, source] of [
      ['Awaiting my approval', 7, 'approval.task'],
      ['Work items', 3, 'oa.workItem'],
      ['Announcement receipt', 1, 'oa.announcementReceipt'],
      ['Copied to me', 1, 'approval.cc'],
      ['My requests', 4, 'approval.application'],
    ] as const)
      expect(
        await within(overview).findByRole('link', {
          name: `${label} ${count}`,
        }),
      ).toHaveAttribute('href', `/taskCenter?source=${source}`);
    // Handling sources only: approval, work items, receipts and copies.
    expect(await screen.findByText(/12 tasks/)).toBeInTheDocument();
    expect(screen.getByText(/1 item overdue|1 overdue/i)).toBeInTheDocument();
  });

  it('labels each preview row with its source and orders the overdue one first', async () => {
    serve();
    open();
    const card = (
      await screen.findByRole('heading', { name: 'Tasks' })
    ).closest('[data-slot=card]') as HTMLElement;
    const rows = await within(card).findAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Task w1');
    expect(rows[0]).not.toHaveTextContent(/Approval ·/);
    expect(rows[1]).toHaveTextContent(/Approval ·/);
    expect(
      within(card).getByRole('button', { name: 'Open task center' }),
    ).toHaveAttribute('href', '/taskCenter');
  });

  it('follows own requests with returned and draft counts', async () => {
    serve();
    open();
    expect(
      await screen.findByText('1 request was returned or failed'),
    ).toBeInTheDocument();
    // Drafts sit in the task center's personal request list; the card only counts them.
    expect(screen.getByText('Drafts (2)')).toBeInTheDocument();
    const card = screen
      .getByRole('heading', { name: 'My requests' })
      .closest('[data-slot=card]') as HTMLElement;
    expect(
      within(card).getByRole('button', { name: 'View all' }),
    ).toHaveAttribute('href', '/taskCenter?source=approval.application');
    expect(await screen.findByText('Task m1')).toBeInTheDocument();
  });

  it('keeps the other cards when the source overview fails, offering a retry', async () => {
    let calls = 0;
    serve({
      taskCenter: () => {
        calls += 1;
        throw new ApiClientError('boom', { status: 500 });
      },
    });
    open();
    const overview = await screen.findByRole('region', {
      name: 'Tasks by source',
    });
    await userEvent.click(
      await within(overview).findByRole('button', { name: 'Retry' }),
    );
    await waitFor(() => expect(calls).toBe(2));
    // The Retry button goes away with the error; focus stays on the page's Refresh.
    expect(screen.getByRole('button', { name: 'Refresh' })).toHaveFocus();
    // Without facets the header names only the date: no task or overdue count.
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
    expect(screen.queryByText(/tasks$/)).not.toBeInTheDocument();
    expect(await screen.findByText('Task w1')).toBeInTheDocument();
  });

  it('does not offer a retry when the overview is forbidden', async () => {
    serve({
      taskCenter: () => {
        throw new ApiClientError('no', { status: 403 });
      },
    });
    open();
    const overview = await screen.findByRole('region', {
      name: 'Tasks by source',
    });
    await waitFor(() =>
      expect(within(overview).getByRole('alert')).toBeInTheDocument(),
    );
    expect(
      within(overview).queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
  });

  it('opens a new work item over the page and refreshes after saving', async () => {
    serve();
    const router = open();
    await userEvent.click(
      await screen.findByRole('button', { name: 'New work item' }),
    );
    expect(router.state.location.pathname).toBe(
      '/workbenchPrototype/newWorkItem',
    );
    const before = api.request.mock.calls.filter(
      ([request]) => (request as { path: string }).path === 'taskCenter',
    ).length;
    await userEvent.click(
      screen.getByRole('button', { name: 'Saved work item' }),
    );
    await waitFor(() =>
      expect(
        api.request.mock.calls.filter(
          ([request]) => (request as { path: string }).path === 'taskCenter',
        ).length,
      ).toBeGreaterThan(before),
    );
  });

  it('hides gated cards and shows the announcement empty state', async () => {
    permission.workItemCreate = false;
    serve();
    open();
    expect(await screen.findByText('No announcements')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New work item' }),
    ).not.toBeInTheDocument();
    // Receipts are tasks now; the old receipt card is gone.
    expect(
      screen.queryByText('Announcements to confirm'),
    ).not.toBeInTheDocument();
  });

  it('leaves the announcement card out without the grant', async () => {
    permission.announcements = false;
    serve();
    open();
    await screen.findByText('Task w1');
    expect(screen.queryByText('Latest announcements')).not.toBeInTheDocument();
    expect(
      api.request.mock.calls.some(
        ([request]) => (request as { path: string }).path === 'announcements',
      ),
    ).toBe(false);
  });

  it('refreshes every card in place, keeping reference data on screen', async () => {
    serve({
      'workbench/meetings': () => ({
        data: {
          date: '2026-10-22',
          timeZone: 'UTC',
          total: 1,
          items: [
            {
              id: 'b1',
              title: 'Weekly sync',
              startAt: '2026-10-22T09:00:00Z',
              endAt: '2026-10-22T10:00:00Z',
              status: 'confirmed',
            },
          ],
        },
      }),
    });
    open();
    expect(await screen.findByText('Weekly sync')).toBeInTheDocument();
    const reads = (path: string) =>
      api.request.mock.calls.filter(
        ([request]) => (request as { path: string }).path === path,
      ).length;
    const before = reads('workbench/meetings');
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    // Kept while the read runs, rather than replaced by a skeleton.
    expect(screen.getByText('Weekly sync')).toBeInTheDocument();
    await waitFor(() => expect(reads('workbench/meetings')).toBe(before + 1));
    expect(reads('announcements')).toBeGreaterThan(1);
  });
});
