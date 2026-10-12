vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => ({ can: false, isPending: false }),
}));
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, Route, Routes } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import en from '../../../client/locales/en-US.js';
import Detail from '../../../client/pages/reimbursement-requests/detail.js';
const { resource, offers } = vi.hoisted(() => ({
  resource: {
    data: {
      record: {
        id: 'r1',
        applicantId: 'owner',
        number: 'R-1',
        status: 'exception',
        reason: 'Frozen trip',
        totalCents: 10000,
        offsetCents: 0,
        lines: [],
        financeLineFacts: {},
        standardSnapshot: {
          linkedKind: 'oa.travel',
          standard: {
            code: 'GRADE-SAVED',
            gradeRank: 2,
            lodgingPerNight: 300,
            allowancePerDay: 80,
          },
          categories: [{ code: 'hotel-saved', standardKind: 'lodging' }],
        },
      },
      users: [{ id: 'owner', name: 'Owner' }],
      timeZone: 'Asia/Shanghai',
      view: {
        available: [
          { name: 'submit', allowed: true },
          { name: 'forcePayException', allowed: true },
        ],
      },
      taskActions: [],
      runActions: [],
      runs: [],
      upcoming: [],
      timeline: {},
    },
    loading: false,
    error: undefined,
    reload: vi.fn(),
  },
  offers: [{ key: 'urge-key', name: 'urge', target: { runId: 'run-1' } }],
}));
vi.mock('../../../client/pages/approvals/use-resource.js', () => ({
  useResource: () => resource,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'owner' } } }),
}));
vi.mock('@nocobase/app-plugin-approval/client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-plugin-approval/client')>()),
  offeredActions: () => offers,
}));
vi.mock(
  '../../../client/pages/reimbursement-requests/payment-account.js',
  () => ({ PaymentAccountSection: () => null }),
);
vi.mock(
  '../../../client/pages/reimbursement-requests/approval-mapping.js',
  () => ({ progressOf: () => [], copiesOf: () => [], timelineOf: () => [] }),
);
vi.mock('#components/route-child-page', () => ({
  RouteChildPage: ({ children }: PropsWithChildren) => children,
}));
vi.mock('#components/back-button', () => ({ BackButton: () => null }));
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
  application: { namespace: 'nb3-oa', resources: en },
});
afterEach(cleanup);
it('links lifecycle offers to the real record and retains urge and frozen standards', () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={['/reimbursementRequests/r1?view=all']}>
        <Routes>
          <Route
            path='/reimbursementRequests'
            element={<Outlet context={{ reload: vi.fn() }} />}
          >
            <Route path=':requestId' element={<Detail />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
  expect(
    screen
      .getByRole('button', { name: 'Submit for approval' })
      .getAttribute('href'),
  ).toBe('/reimbursementRequests/r1/action/submit/r1?view=all');
  expect(
    screen
      .getByRole('button', { name: 'Record exceptional settlement' })
      .getAttribute('href'),
  ).toBe('/reimbursementRequests/r1/action/forcePayException/r1?view=all');
  expect(screen.getByRole('button', { name: /Urge|Remind/i })).toBeTruthy();
  expect(screen.getByText('GRADE-SAVED')).toBeTruthy();
  expect(screen.getByText('hotel-saved')).toBeTruthy();
});
