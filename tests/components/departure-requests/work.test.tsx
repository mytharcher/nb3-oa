import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { ApiClientError } from '@nocobase/app-client';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/departure.en-US.js';
import { WorkForm } from '../../../client/pages/departure-requests/work-dialog.js';
import { DepartureFacts } from '../../../client/pages/departure-requests/facts.js';
import type {
  DepartureDetail,
  WorkItem,
} from '../../../client/pages/departure-requests/types.js';
const { api, close } = vi.hoisted(() => ({
  api: { request: vi.fn() },
  close: vi.fn(),
}));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
  useToaster: () => ({ show: vi.fn() }),
}));
vi.mock('../../../client/components/use-route-overlay.js', () => ({
  useRouteOverlay: () => ({ close }),
}));
vi.mock('../../../client/components/session-expired-alert.js', () => ({
  SessionExpiredAlert: () => <div>Sign in again</div>,
}));
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: { ...base, departureRequests: copy },
  },
});
const item = {
  id: 'work-1',
  kind: 'admin',
  status: 'claimed',
  lifecycleVersion: 2,
  claimedBy: { id: 'a', name: 'Administrator' },
  receiver: { id: 'e', name: 'Recipient' },
  offers: [
    {
      name: 'complete',
      allowed: false,
      blockers: [{ code: 'DEPARTURE_ASSET_SERVICE_UNAVAILABLE' }],
    },
    { name: 'forceComplete', allowed: true, blockers: [] },
  ],
} as WorkItem;
const detail = {
  record: {
    id: 'd1',
    applicant: { id: 'employee', name: 'Employee' },
    number: 'D-1',
    status: 'completed',
    reason: 'Personal',
    departureType: 'resignation',
    hrInterviewCompleted: true,
  },
  workItems: [item],
  execution: {
    id: 'execution1',
    status: 'blocked',
    failureCode: 'DEPARTURE_REASSIGNMENT_UNAVAILABLE',
  },
  readyForSubmission: true,
  blockedBy: [],
} as unknown as DepartureDetail;
function show(name: string, allowed = true, path = '/') {
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter initialEntries={[path + '?view=pending']}>
        <Routes>
          <Route
            element={
              <Outlet context={{ reload: vi.fn(), reloadDetail: vi.fn() }} />
            }
          >
            <Route
              path={path}
              element={
                <>
                  <WorkForm
                    detail={detail}
                    item={item}
                    name={name}
                    allowed={allowed}
                    onBusy={vi.fn()}
                    onDirty={vi.fn()}
                    onBlocked={vi.fn()}
                    reload={vi.fn()}
                  />
                  <button type='submit' form='departure-work'>
                    Apply
                  </button>
                </>
              }
            />
            <Route
              path='/approvals/pending'
              element={
                <input aria-label='Source search' data-departure-list-focus />
              }
            />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  api.request.mockResolvedValue({ data: {} });
  close.mockResolvedValue(undefined);
});
afterEach(cleanup);
it('normal asset completion stays blocked by the actual missing provider and sends no write', () => {
  show('complete', false);
  expect(
    screen.getByText('Normal asset clearance is not available yet.'),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).not.toHaveBeenCalled();
});
it('HR exemption requires a reason and a named confirmation before the work transition', async () => {
  show('forceComplete');
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(api.request).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Exemption reason *')).toHaveFocus();
  fireEvent.change(screen.getByLabelText('Exemption reason *'), {
    target: { value: 'HR documented exception' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Employee');
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Administrator');
  expect(screen.getByRole('alertdialog')).toHaveTextContent('Recipient');
  expect(api.request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Force completion' }));
  await waitFor(() => expect(api.request).toHaveBeenCalledOnce());
  expect(api.request.mock.calls[0][0]).toMatchObject({
    path: 'departureRequests/d1/workItems/work-1/actions',
    json: {
      action: 'forceComplete',
      version: 2,
      input: { reason: 'HR documented exception' },
    },
  });
});
it('completed settlement with blocked execution still reports the account as enabled', () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <DepartureFacts detail={detail} writable={false} />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  expect(
    screen.getByText(
      'Departure execution is incomplete. The account has not been disabled.',
    ),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(
      'The account and organization memberships have been disabled.',
    ),
  ).toBeNull();
  expect(screen.getByRole('button', { name: 'Complete' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Force completion' }),
  ).toBeDisabled();
});

it.each([401, 403])(
  'permanent work denial %s offers no latest recovery',
  async (status) => {
    api.request.mockRejectedValue(new ApiClientError('SECRET', { status }));
    show('forceComplete');
    fireEvent.change(screen.getByLabelText('Exemption reason *'), {
      target: { value: 'Private reason' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
    fireEvent.click(screen.getByRole('button', { name: 'Force completion' }));
    await waitFor(() => expect(api.request).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByLabelText('Exemption reason *')).toHaveValue(''),
    );
    expect(
      screen.queryByRole('button', { name: 'Read latest version' }),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  },
);

it('a work write 404 exits the stacked overlay to the original source and focuses its search', async () => {
  api.request.mockRejectedValue(new ApiClientError('SECRET', { status: 404 }));
  show(
    'forceComplete',
    true,
    '/approvals/pending/departure/d1/work/forceComplete/work-1',
  );
  fireEvent.change(screen.getByLabelText('Exemption reason *'), {
    target: { value: 'Documented exemption' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply' }));
  fireEvent.click(screen.getByRole('button', { name: 'Force completion' }));
  await screen.findByLabelText('Source search');
  await waitFor(() =>
    expect(screen.getByLabelText('Source search')).toHaveFocus(),
  );
  expect(
    screen.queryByRole('button', { name: 'Read latest version' }),
  ).toBeNull();
  expect(screen.queryByRole('alertdialog')).toBeNull();
});
