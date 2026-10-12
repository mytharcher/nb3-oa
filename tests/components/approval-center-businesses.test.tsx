import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import ApprovalList from '../../client/pages/approvals/list.js';
const state = vi.hoisted(() => ({ request: vi.fn() }));
const api = { request: state.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'owner' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: false, isPending: false, error: undefined }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
afterEach(() => {
  cleanup();
  state.request.mockReset();
});
for (const [kind, label, status, stateLabel, route] of [
  ['oa.workItem', 'Work item', 'assigned', 'Assigned', 'workItem'],
  [
    'oa.announcementReceipt',
    'Announcement receipt',
    'pending',
    'Pending',
    'announcement',
  ],
  ['oa.recruitment', 'Recruitment', 'hrbp', 'HRBP', 'recruitment'],
  [
    'oa.sealRequest',
    'Seal request',
    'stamping',
    'Stamping registration',
    'seal',
  ],
  ['oa.vehicleRequest', 'Vehicle request', 'dispatch', 'Dispatch', 'vehicle'],
] as const) {
  it(`renders ${kind} with its owner state and preserves the filtered source route`, async () => {
    const row = {
      id: 'record',
      kind,
      number: 'CENTER-1',
      applicantId: 'owner',
      applicant: { id: 'owner', name: 'Applicant' },
      status,
      createdAt: '2026-10-11T01:00:00Z',
      startDate: null,
      endDate: null,
      amount: null,
      unit: null,
    };
    state.request.mockResolvedValue({
      data: [row],
      meta: {
        total: 1,
        page: 1,
        pageSize: 20,
        kinds: [kind],
        counts: { drafts: 0, revisions: 0, inProgress: 1 },
      },
    });
    // Keep one API reference across renders, like the production context.
    const router = createMemoryRouter(
      [
        {
          path: '/approvals/mine',
          element: <ApprovalList />,
          children: [
            { path: `${route}/record`, element: <span>Owner detail</span> },
          ],
        },
      ],
      { initialEntries: [`/approvals/mine?kind=${kind}&search=CENTER#source`] },
    );
    render(
      <TestI18nProvider runtime={runtime}>
        <RouterProvider router={router} />
      </TestI18nProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole('link', { name: 'CENTER-1' })).toBeVisible(),
    );
    expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.getByText(stateLabel)).toBeVisible();
    await userEvent.click(screen.getByRole('link', { name: 'CENTER-1' }));
    expect(router.state.location.pathname).toBe(
      `/approvals/mine/${route}/record`,
    );
    expect(router.state.location.search).toBe(`?kind=${kind}&search=CENTER`);
    expect(router.state.location.hash).toBe('#source');
    expect(await screen.findByText('Owner detail')).toBeVisible();
    expect(api.request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'approvalCenter',
        query: expect.objectContaining({ kind, view: 'mine' }),
      }),
    );
  });
}

it('preserves source query and hash while switching center tabs', async () => {
  state.request.mockResolvedValue({
    data: [],
    meta: {
      total: 0,
      page: 1,
      pageSize: 20,
      kinds: ['oa.recruitment'],
      counts: { drafts: 0, revisions: 0, inProgress: 0 },
    },
  });
  const router = createMemoryRouter(
    [
      {
        path: '/approvals',
        children: ['mine', 'done', 'copied', 'todo'].map((tab) => ({
          path: tab,
          element: <ApprovalList />,
        })),
      },
    ],
    { initialEntries: ['/approvals/mine?kind=oa.recruitment#source'] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  await screen.findByRole('table');
  await userEvent.click(screen.getByRole('tab', { name: 'Done', exact: true }));
  expect(router.state.location.pathname).toBe('/approvals/done');
  expect(router.state.location.search).toBe('?kind=oa.recruitment');
  expect(router.state.location.hash).toBe('#source');
});

it('does not call a submitted recruitment without a source number a draft', async () => {
  state.request.mockResolvedValue({
    data: [
      {
        id: 'submitted',
        kind: 'oa.recruitment',
        number: null,
        applicantId: 'owner',
        applicant: { id: 'owner', name: 'Applicant' },
        status: 'hrDirector',
        createdAt: '2026-10-11T01:00:00Z',
        startDate: null,
        endDate: null,
        amount: null,
        unit: null,
      },
    ],
    meta: {
      total: 1,
      page: 1,
      pageSize: 20,
      kinds: ['oa.recruitment'],
      counts: { drafts: 0, revisions: 0, inProgress: 1 },
    },
  });
  const router = createMemoryRouter(
    [{ path: '/approvals/mine', element: <ApprovalList /> }],
    { initialEntries: ['/approvals/mine?kind=oa.recruitment'] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  expect(
    await screen.findByRole('link', { name: 'View', exact: true }),
  ).toHaveAttribute(
    'href',
    '/approvals/mine/recruitment/submitted?kind=oa.recruitment',
  );
  expect(screen.queryByRole('link', { name: 'Draft', exact: true })).toBeNull();
});
