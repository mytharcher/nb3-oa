import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  createMemoryRouter,
  RouterProvider,
  Outlet,
  useLocation,
} from 'react-router';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/probation.en-US.js';
import Detail from '../../../client/pages/probation-requests/detail.js';
import { calendarDateLabel } from '../../../client/pages/probation-requests/types.js';
const { resource, grades, offers, parent, showToast } = vi.hoisted(() => ({
  resource: {
    data: {
      record: {
        id: 'r1',
        employeeId: 'e1',
        applicantId: 'employee',
        createdById: 'hr',
        number: 'PRO-1',
        status: 'gm',
        probationEndDate: '2026-11-01',
        selfEvaluation: 'Original assessment',
        evaluation: 'Manager assessment',
        conclusion: 'declined',
        deferredTo: null,
        gradeId: 'g1',
        compensationProposalId: 'OPAQUE-PROPOSAL',
        ruleSnapshot: { 'grade.managerRank': 3 },
        baseSalary: 'PUBLIC-ACCIDENTAL-SECRET',
      },
      timeZone: 'Asia/Shanghai',
      users: [
        { id: 'employee', name: 'Employee' },
        { id: 'hr', name: 'HR' },
      ],
      view: { available: [{ name: 'terminate', allowed: true }] },
      taskActions: [],
      runActions: [],
      runs: [],
      upcoming: [],
      timeline: { runs: [] },
    },
    loading: false,
    error: undefined as unknown,
    reload: vi.fn(),
    update: vi.fn(),
  },
  grades: {
    data: [
      { id: 'g1', title: 'Saved grade', code: 'G1', rank: 3, active: false },
    ],
    loading: false,
    error: undefined,
    reload: vi.fn(),
  },
  offers: [
    {
      key: 'approve',
      name: 'approve',
      target: { taskId: 'gm-task' },
      primary: true,
    },
    { key: 'cc', name: 'cc', target: { runId: 'native-run' } },
  ],
  parent: { reload: vi.fn(), focusList: vi.fn() },
  showToast: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useToaster: () => ({ show: showToast }),
}));
vi.mock('../../../client/pages/approvals/use-resource.js', () => ({
  useResource: (path: string) =>
    path === 'grades/options' ? grades : resource,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'gm' } } }),
}));
vi.mock('@nocobase/app-plugin-approval/client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-plugin-approval/client')>()),
  offeredActions: () => offers,
}));
vi.mock(
  '../../../client/pages/probation-requests/private-compensation.js',
  () => ({
    PrivateCompensationSection: ({ refreshKey }: { refreshKey: number }) => (
      <div data-testid='private-block'>Compensation denied:{refreshKey}</div>
    ),
  }),
);
vi.mock('#components/route-child-page', () => ({
  RouteChildPage: ({ children }: PropsWithChildren) => children,
}));
vi.mock('#components/approval-progress', () => ({
  ApprovalProgress: () => null,
}));
vi.mock('#extensions/nocobase-approval-ui', () => ({
  ApprovalUiProvider: ({ children }: PropsWithChildren) => children,
  ApprovalProgress: () => null,
  ApprovalTimeline: () => null,
  ApprovalActionBar: ({
    actions,
  }: {
    actions: { key: string; label: string; run: () => void }[];
  }) =>
    actions.map((a) => (
      <button key={a.key} onClick={a.run}>
        {a.label}
      </button>
    )),
}));
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: {
      ...base,
      probationRequests: {
        ...copy.probationRequests,
        actionForm: {
          labels: { approve: 'Approve', cc: 'Copy', terminate: 'Terminate' },
        },
      },
    },
  },
});
function ActionLocation() {
  const location = useLocation();
  return (
    <div data-testid='location'>
      {location.pathname}
      {location.search}
    </div>
  );
}
function show() {
  const router = createMemoryRouter(
    [
      {
        path: '/approvals/copied',
        element: (
          <>
            <div>Source tab</div>
            <Outlet context={parent} />
          </>
        ),
        children: [
          {
            path: 'probation/:requestId',
            element: <Detail />,
            children: [
              {
                path: 'action/:actionName/:targetId',
                element: <ActionLocation />,
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: ['/approvals/copied/probation/r1?search=assessment'] },
  );
  render(
    <TestI18nProvider runtime={runtime}>
      <RouterProvider router={router} />
    </TestI18nProvider>,
  );
  return router;
}
afterEach(cleanup);
beforeEach(() => {
  resource.error = undefined;
  resource.loading = false;
  vi.clearAllMocks();
});
it('keeps public GM decisions available despite a denied compensation block and never renders proposal ids or accidental salary fields', async () => {
  show();
  expect(screen.getByText('Saved grade')).toBeTruthy();
  expect(screen.queryByText('OPAQUE-PROPOSAL')).toBeNull();
  expect(screen.queryByText('PUBLIC-ACCIDENTAL-SECRET')).toBeNull();
  expect(screen.getByText('Decline regularization')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Close' })).toBeVisible();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Approve' }));
  expect(screen.getByTestId('location').textContent).toBe(
    '/approvals/copied/probation/r1/action/approve/gm-task?search=assessment',
  );
});
it('routes run and lifecycle operations to real native run and record ids', async () => {
  show();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Copy' }));
  expect(screen.getByTestId('location').textContent).toContain(
    '/action/cc/native-run?search=assessment',
  );
  cleanup();
  show();
  expect(
    screen.getByRole('button', { name: 'Terminate' }).getAttribute('href'),
  ).toContain('/action/terminate/r1?search=assessment');
});
it('refreshes grades and the private section without changing public record contents', async () => {
  show();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Refresh' }));
  expect(resource.reload).toHaveBeenCalledOnce();
  expect(grades.reload).toHaveBeenCalledOnce();
  expect(screen.getByTestId('private-block').textContent).toBe(
    'Compensation denied:1',
  );
  expect(screen.getByText('Manager assessment')).toBeTruthy();
});
it('returns a missing record to its source tab with search retained and refreshes the list', async () => {
  resource.error = new ApiClientError('Missing', { status: 404 });
  const router = show();
  await waitFor(() =>
    expect(router.state.location.pathname).toBe('/approvals/copied'),
  );
  expect(router.state.location.search).toBe('?search=assessment');
  expect(parent.reload).toHaveBeenCalled();
  expect(showToast).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'error',
      title: copy.probationRequests.errors.notFound,
    }),
  );
});
it('formats a company calendar date without shifting it to the browser timezone', () => {
  expect(calendarDateLabel('2026-11-01', 'en-US')).toBe('Nov 1, 2026');
  expect(calendarDateLabel(null, 'en-US')).toBe('—');
});

it('closes the record to the original approval tab and search', async () => {
  const router = show();
  await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }));
  expect(router.state.location.pathname).toBe('/approvals/copied');
  expect(router.state.location.search).toBe('?search=assessment');
});
