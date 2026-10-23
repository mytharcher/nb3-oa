import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../../client/locales/en-US.js';
import TaskCenter from '../../../client/pages/task-center/index.js';
import LegacyCenter from '../../../client/pages/approvals/index.js';
import Target from '../../../client/pages/task-center/target.js';
import type { TaskCenterData } from '../../../client/pages/task-center/sources.js';
const state = vi.hoisted(() => ({ request: vi.fn() }));
const api = { request: state.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'reviewer' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
afterEach(() => {
  cleanup();
  state.request.mockReset();
});
const data: TaskCenterData = {
  tasks: [
    {
      id: 'personal-entry',
      sourceType: 'approval.task',
      sourceKey: 'opaque-task-id',
      subject: 'oa.leave',
      title: 'LEAVE-101',
      status: 'pending',
      createdAt: '2026-10-22T01:00:00Z',
      updatedAt: '2026-10-22T01:00:00Z',
    },
  ],
  total: 1,
  counts: { pending: 1, closed: 2, all: 3 },
  facets: [{ sourceType: 'approval.task', subject: 'oa.leave', pending: 1 }],
};
it('opens the legacy draft shortcut as ordinary pending applications and opens the authorized draft detail', async () => {
  state.request.mockResolvedValue({
    data: {
      ...data,
      tasks: [
        {
          ...data.tasks[0],
          id: 'draft:1',
          sourceType: 'approval.application',
          sourceKey: 'oa.leave:draft-record',
          title: 'oa.leave',
          recordId: 'draft-record',
          businessStatus: 'draft',
        },
        {
          ...data.tasks[0],
          id: 'submitted',
          sourceType: 'approval.application',
          title: 'LEAVE-SUBMITTED',
        },
      ],
    },
  });
  const router = mount('/approvals/mine?category=drafts');
  expect(await screen.findByText('Draft')).toBeVisible();
  expect(screen.getByText('LEAVE-SUBMITTED')).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Drafts' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'All applications' })).toBeNull();
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({
      path: 'taskCenter',
      query: expect.objectContaining({
        source: 'approval.application',
        status: 'pending',
      }),
    }),
  );
  expect(state.request.mock.calls[0][0].query).not.toHaveProperty('category');
  await userEvent.click(
    screen.getByRole('button', { name: 'Leave', exact: true }),
  );
  expect(await screen.findByText('Authorized business detail')).toBeVisible();
  expect(router.state.location.pathname).toBe('/taskCenter/leave/draft-record');
  expect(router.state.location.search).not.toContain('category=drafts');
});
function mount(entry: string) {
  const router = createMemoryRouter(
    [
      { path: '/approvals/*', element: <LegacyCenter /> },
      {
        path: '/taskCenter',
        element: <TaskCenter />,
        children: [
          { path: 'task/:taskId', element: <Target /> },
          {
            path: 'leave/:requestId',
            element: <span>Authorized business detail</span>,
          },
        ],
      },
    ],
    { initialEntries: [entry] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
it('loads cards from the index, scopes closed requests on the server, and keeps pending navigation facets', async () => {
  state.request.mockResolvedValue({ data });
  const router = mount('/taskCenter?source=approval.task&subject=oa.leave');
  expect(await screen.findByText('LEAVE-101')).toBeVisible();
  expect(screen.queryByRole('table')).toBeNull();
  expect(screen.queryByText(/prototype/i)).toBeNull();
  await userEvent.click(screen.getByRole('tab', { name: /Done/ }));
  await waitFor(() =>
    expect(state.request).toHaveBeenLastCalledWith(
      expect.objectContaining({
        path: 'taskCenter',
        query: expect.objectContaining({
          source: 'approval.task',
          subject: 'oa.leave',
          status: 'closed',
        }),
      }),
    ),
  );
  expect(router.state.location.search).toContain('status=closed');
});
it('resolves the personal entry through its owned reference and opens the business under the current scope', async () => {
  state.request.mockImplementation(async ({ path }: { path: string }) =>
    path.endsWith('/target')
      ? { data: { subject: 'oa.leave', recordId: 'business-record' } }
      : { data },
  );
  const router = mount('/taskCenter?subject=oa.leave&status=all');
  await userEvent.click(await screen.findByText('LEAVE-101'));
  expect(await screen.findByText('Authorized business detail')).toBeVisible();
  expect(router.state.location.pathname).toBe(
    '/taskCenter/leave/business-record',
  );
  expect(router.state.location.search).toBe('?subject=oa.leave&status=all');
  await act(async () => {
    await router.navigate('/taskCenter?subject=oa.leave&status=all');
  });
  await waitFor(() => expect(state.request).toHaveBeenCalledTimes(3));
  expect(state.request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      path: 'taskCenter',
      query: expect.objectContaining({ subject: 'oa.leave', status: 'all' }),
    }),
  );
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'taskCenter/personal-entry/target' }),
  );
});
it('keeps existing cards while refresh is pending and refreshes all read blocks together', async () => {
  state.request
    .mockResolvedValueOnce({ data })
    .mockReturnValue(new Promise(() => {}));
  mount('/taskCenter');
  expect(await screen.findByText('LEAVE-101')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(screen.getByText('LEAVE-101')).toBeVisible();
  expect(state.request).toHaveBeenCalledTimes(2);
});
it('retains old deep links and maps the business and source filters', async () => {
  state.request.mockResolvedValue({ data });
  const router = mount('/approvals/copied/leave/business-record?kind=oa.leave');
  expect(await screen.findByText('Authorized business detail')).toBeVisible();
  expect(router.state.location.pathname).toBe(
    '/taskCenter/leave/business-record',
  );
  expect(new URLSearchParams(router.state.location.search).get('source')).toBe(
    'approval.cc',
  );
  expect(new URLSearchParams(router.state.location.search).get('subject')).toBe(
    'oa.leave',
  );
});
