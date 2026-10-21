import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import en from '../../client/locales/en-US.js';
import { LoanFacts } from '../../client/pages/loan-requests/facts.js';
import { PaymentFacts } from '../../client/pages/payment-requests/facts.js';
import { ReimbursementFacts } from '../../client/pages/reimbursement-requests/facts.js';
import { ExpenseFacts } from '../../client/pages/expense-plan/facts.js';
import type {
  LoanRequestDetail,
  LoanRequestRecord,
} from '../../client/pages/loan-requests/types.js';
import type { PaymentDetail } from '../../client/pages/payment-requests/types.js';
import type { ReimbursementDetail } from '../../client/pages/reimbursement-requests/types.js';
import type {
  ExpensePlanDetail,
  ExpensePlanRecord,
} from '../../client/pages/expense-plan/types.js';

vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: false }),
}));
vi.mock('../../client/pages/payment-requests/attachments.js', () => ({
  PaymentAttachments: () => null,
}));
vi.mock('../../client/pages/reimbursement-requests/attachments.js', () => ({
  ReimbursementAttachments: () => null,
}));
vi.mock('../../client/pages/approvals/use-resource.js', () => ({
  useResource: () => ({
    data: {
      authorizations: [{ id: 'auth-private', sourceReference: 'EP-42' }],
      categories: [],
      matterTypes: [],
      subjects: [],
    },
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: en },
});
function show(element: React.ReactNode) {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>{element}</MemoryRouter>
    </TestI18nProvider>,
  );
}
afterEach(cleanup);

it('shows authorized travel number and unavailable rather than its internal ID', () => {
  const record = {
    travelId: 'trip-private',
    amountCents: 100,
    dueDate: '2026-10-20',
    heldCents: 0,
  } as LoanRequestRecord;
  const detail = { travelName: 'TR-42' } as LoanRequestDetail;
  const view = show(
    <LoanFacts record={record} applicant='Owner' detail={detail} />,
  );
  expect(screen.getByText('TR-42')).toBeInTheDocument();
  expect(screen.queryByText('trip-private')).not.toBeInTheDocument();
  view.unmount();
  show(
    <LoanFacts
      record={record}
      applicant='Owner'
      detail={{ travelName: null } as LoanRequestDetail}
    />,
  );
  expect(screen.getByText('Related record unavailable')).toBeInTheDocument();
  expect(screen.queryByText('trip-private')).not.toBeInTheDocument();
});

it('shows payment contract number and keeps inaccessible sources unnamed', () => {
  const detail = {
    contractName: 'CON-42',
    users: [],
    record: {
      id: 'payment',
      contractId: 'contract-private',
      purchaseOrderId: 'order-private',
      amountCents: 100,
      sourceApprovedCents: null,
      sourceCumulativeCents: null,
      sourceHeldCents: null,
      sourceMode: 'contract',
      attachments: [],
      voucherAttachments: [],
    },
  } as unknown as PaymentDetail;
  show(<PaymentFacts detail={detail} />);
  expect(screen.getByText('CON-42')).toBeInTheDocument();
  expect(screen.getByText('Related record unavailable')).toBeInTheDocument();
  expect(screen.queryByText('contract-private')).not.toBeInTheDocument();
  expect(screen.queryByText('order-private')).not.toBeInTheDocument();
});

it('shows reimbursement authorization source and independently authorized loan number', () => {
  const detail = {
    loanName: 'LOAN-42',
    users: [],
    record: {
      id: 'r1',
      applicantId: 'owner',
      authorizationId: 'auth-private',
      loanId: 'loan-private',
      totalCents: 100,
      offsetCents: 0,
      lines: [],
      financeLineFacts: {},
      standardSnapshot: null,
    },
  } as unknown as ReimbursementDetail;
  show(<ReimbursementFacts detail={detail} />);
  expect(screen.getByText('EP-42')).toBeInTheDocument();
  expect(screen.getByText('LOAN-42')).toBeInTheDocument();
  expect(screen.queryByText('auth-private')).not.toBeInTheDocument();
  expect(screen.queryByText('loan-private')).not.toBeInTheDocument();
});

it('uses the returned quota source reference instead of the allowance UUID', () => {
  const record = {
    applicantId: 'owner',
    amountCents: 100,
    heldCents: 0,
    eventDate: '2026-10-20',
  } as ExpensePlanRecord;
  const detail = {
    users: [],
    authorization: {
      id: 'quota-private',
      sourceReference: 'EP-42',
      grantedCents: 100,
      issuedAt: '2026-10-20T00:00:00Z',
      deadline: '2026-10-21',
      state: 'open',
    },
    timeZone: 'UTC',
  } as unknown as ExpensePlanDetail;
  show(<ExpenseFacts record={record} applicant='Owner' detail={detail} />);
  expect(screen.getByText('EP-42')).toBeInTheDocument();
  expect(screen.queryByText('quota-private')).not.toBeInTheDocument();
});
