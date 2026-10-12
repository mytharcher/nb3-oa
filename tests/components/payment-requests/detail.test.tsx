import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router';
import { afterEach, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/payment-requests.en-US.js';
import Detail from '../../../client/pages/payment-requests/detail.js';
const { resource, options, offers, orderPermission } = vi.hoisted(() => ({
  orderPermission: { can: true, isPending: false },
  resource: {
    data: {
      record: {
        id: 'p1',
        applicantId: 'owner',
        createdById: 'creator',
        number: 'PAY-1',
        status: 'exception',
        reason: 'Order payment',
        amountCents: 125001,
        sourceMode: 'purchase',
        purchaseOrderId: 'order-1',
        vendorSnapshot: { name: 'Frozen vendor' },
        sourceApprovedCents: 100000,
        sourceCumulativeCents: 125001,
        sourceHeldCents: 125001,
        fullApprovalRequired: true,
        invoiceNumber: 'INV-1',
        paymentMethod: 'bank',
        noPriorApprovalReason: '',
        attachments: ['same-invoice'],
        voucherAttachments: ['same-voucher'],
        ruleSnapshot: { 'spend.vp': 1000 },
      },
      users: [
        { id: 'owner', name: 'Owner' },
        { id: 'creator', name: 'Creator' },
      ],
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
      timeline: { runs: [] },
    },
    loading: false,
    error: undefined,
    reload: vi.fn(),
    update: vi.fn(),
  },
  options: {
    data: {
      timeZone: 'Asia/Shanghai',
      orders: [{ id: 'order-1', number: 'ORDER-1' }],
      vendors: [],
      paymentMethods: [],
    },
    loading: false,
    error: undefined,
    reload: vi.fn(),
  },
  offers: [
    { key: 'urge', name: 'urge', target: { runId: 'native-run' } },
    { key: 'approve', name: 'approve', target: { taskId: 'native-task' } },
    { key: 'force', name: 'forceComplete', target: { runId: 'native-run' } },
  ],
}));
vi.mock('../../../client/pages/approvals/use-resource.js', () => ({
  useResource: (path: string) =>
    path?.endsWith('/options') ? options : resource,
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => 0,
  useCan: () => orderPermission,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'owner' } } }),
}));
vi.mock('@nocobase/app-plugin-approval/client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-plugin-approval/client')>()),
  offeredActions: () => offers,
}));
vi.mock('../../../client/pages/payment-requests/payment-account.js', () => ({
  PaymentAccountSection: () => <div>Private account block</div>,
}));
vi.mock('../../../client/pages/payment-requests/attachments.js', () => ({
  PaymentAttachments: ({
    recordId,
    ids,
    purpose,
    refreshKey,
  }: {
    recordId: string;
    ids: string[];
    purpose: string;
    refreshKey: number;
  }) => (
    <div data-testid={purpose}>
      {recordId}:{ids.join(',')}:{refreshKey}
    </div>
  ),
}));
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
      paymentRequests: {
        ...copy.paymentRequests,
        actionForm: {
          labels: {
            submit: 'Submit for approval',
            forcePayException: 'Record exceptional payment',
            urge: 'Remind',
            approve: 'Approve',
            forceComplete: 'Force payment',
          },
        },
      },
    },
  },
});
afterEach(() => {
  cleanup();
  orderPermission.can = true;
});
function show() {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter
        initialEntries={['/approvals/pending/payment/p1?search=invoice']}
      >
        <Routes>
          <Route
            path='/approvals/pending'
            element={<Outlet context={{ reload: vi.fn() }} />}
          >
            <Route path='payment/:requestId' element={<Detail />}>
              <Route
                path='action/:actionName/:targetId'
                element={<ActionLocation />}
              />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
it('uses real record targets and exposes frozen source facts without bank fields in public content', () => {
  show();
  expect(
    screen.getByRole('link', { name: 'ORDER-1' }).getAttribute('href'),
  ).toBe('/approvals/pending/payment/p1/sourceOrder/order-1?search=invoice');
  expect(
    screen
      .getByRole('button', { name: 'Submit for approval' })
      .getAttribute('href'),
  ).toBe('/approvals/pending/payment/p1/action/submit/p1?search=invoice');
  expect(
    screen
      .getByRole('button', { name: 'Record exceptional payment' })
      .getAttribute('href'),
  ).toBe(
    '/approvals/pending/payment/p1/action/forcePayException/p1?search=invoice',
  );
  expect(screen.getByText('Frozen vendor')).toBeTruthy();
  expect(screen.getByText('ORDER-1')).toBeTruthy();
  expect(screen.getByText('Approved order amount (yuan)')).toBeTruthy();
  expect(screen.getAllByText('1,250.01')).toHaveLength(3);
  expect(screen.getByText('Executive threshold (yuan)')).toBeTruthy();
  expect(screen.getByTestId('invoice').textContent).toBe('p1:same-invoice:0');
  expect(screen.getByTestId('voucher').textContent).toBe('p1:same-voucher:0');
  expect(screen.getByRole('button', { name: 'Close' })).toBeVisible();
});

function ActionLocation() {
  const location = useLocation();
  return (
    <div data-testid='action-location'>
      {location.pathname}
      {location.search}
    </div>
  );
}
it('routes task and run offers to their actual native targets under the current approval tab', async () => {
  show();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Approve' }));
  expect(screen.getByTestId('action-location').textContent).toBe(
    '/approvals/pending/payment/p1/action/approve/native-task?search=invoice',
  );
  cleanup();
  show();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Force payment' }));
  expect(screen.getByTestId('action-location').textContent).toBe(
    '/approvals/pending/payment/p1/action/forceComplete/native-run?search=invoice',
  );
});
it('refreshes options and both attachment purposes even when selected ids remain unchanged', async () => {
  show();
  const user = userEvent.setup();
  const before = options.reload.mock.calls.length;
  await user.click(screen.getByRole('button', { name: 'Refresh' }));
  expect(options.reload.mock.calls.length).toBe(before + 1);
  expect(resource.reload).toHaveBeenCalled();
  expect(screen.getByTestId('invoice').textContent).toBe('p1:same-invoice:1');
  expect(screen.getByTestId('voucher').textContent).toBe('p1:same-voucher:1');
});

it('keeps permitted public order summary without a source-detail link when orders access is denied', () => {
  orderPermission.can = false;
  show();
  expect(screen.getByText('ORDER-1')).toBeTruthy();
  expect(screen.queryByRole('link', { name: 'ORDER-1' })).toBeNull();
});
