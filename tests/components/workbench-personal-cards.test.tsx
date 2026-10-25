import { ApiClientError } from '@nocobase/app-client';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import { PersonalCards } from '../../client/pages/home/personal-cards.js';
const state = vi.hoisted(() => ({
  request: vi.fn(),
  actor: 'alice',
  revision: 0,
  meeting: true,
  room: true,
  announcement: true,
}));
// Stable API identity prevents re-running requests from the mock itself.
const api = { request: state.request };
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useApiClient: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({
    session: { user: { id: state.actor } },
    refresh: vi.fn(),
  }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => state.revision,
  useCan: ({ resource }: { resource: { id: string } }) => ({
    can:
      resource.id === 'oa.meetingBookings'
        ? state.meeting
        : resource.id === 'oa.meetingRooms'
          ? state.room
          : state.announcement,
    isPending: false,
  }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function View() {
  return (
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <PersonalCards />
      </MemoryRouter>
    </TestI18nProvider>
  );
}
beforeEach(() => {
  Object.assign(state, {
    actor: 'alice',
    revision: 0,
    meeting: true,
    room: true,
    announcement: true,
  });
  state.request.mockReset();
  state.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve({
      data:
        path === 'personalSchedules'
          ? []
          : path === 'leaveBalances/me'
            ? [
                {
                  employeeId: 'e',
                  leaveType: 'annual',
                  availableUnits: 7,
                  heldUnits: 1,
                },
              ]
            : path === 'leaveRequests/options'
              ? {
                  leaveTypes: [
                    {
                      code: 'annual',
                      label: { 'en-US': 'Annual leave' },
                      active: false,
                    },
                  ],
                }
              : path === 'workbench/meetings'
                ? {
                    date: '2026-10-11',
                    timeZone: 'Asia/Shanghai',
                    total: 17,
                    items: [
                      {
                        id: 'm',
                        title: 'Personal meeting',
                        startAt: '2026-10-11T01:00:00Z',
                        endAt: '2026-10-11T02:00:00Z',
                        status: 'confirmed',
                      },
                    ],
                  }
                : {
                    count: 21,
                    items: Array.from({ length: 8 }, (_, n) => ({
                      id: String(n),
                      announcementId: `a${n}`,
                      title: `Read notice ${n}`,
                      dueAt: '2026-10-12T00:00:00Z',
                    })),
                  },
    }),
  );
});
it('shows half-day balances and complete source totals with bounded preview and legitimate links', async () => {
  render(<View />);
  expect(await screen.findByText('Annual leave')).toBeVisible();
  expect(
    screen.getByText('Available: 3.5 days · Held: 0.5 days'),
  ).toBeVisible();
  expect(await screen.findByText('Oct 11, 2026 · 17 meetings')).toBeVisible();
  expect(screen.getByText('21 confirmations pending')).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Personal meeting' }),
  ).toHaveAttribute('href', '/booking/m');
  expect(screen.queryByText('Read notice 5')).toBeNull();
  expect(state.request).toHaveBeenCalledWith(
    expect.objectContaining({ path: 'workbench/announcementReceipts' }),
  );
  expect(
    state.request.mock.calls.some(
      ([request]) => request.path === 'announcements/pending',
    ),
  ).toBe(false);
});
it('does not request independent denied sources and omits meeting links without the parent page grant', async () => {
  state.announcement = false;
  state.room = false;
  render(<View />);
  expect(await screen.findByText('Personal meeting')).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Personal meeting' })).toBeNull();
  expect(
    state.request.mock.calls.some(
      ([r]) => r.path === 'workbench/announcementReceipts',
    ),
  ).toBe(false);
});
it.each(['actor', 'revision'] as const)(
  'clears private source data immediately on %s change and ignores old completions',
  async (key) => {
    const mounted = render(<View />);
    await screen.findByText('Personal meeting');
    let complete!: (value: unknown) => void;
    const pending = new Promise((resolve) => {
      complete = resolve;
    });
    const previous = state.request.getMockImplementation()!;
    state.request.mockImplementation((input) =>
      input.path === 'workbench/meetings' ? pending : previous(input),
    );
    if (key === 'actor') state.actor = 'bob';
    else state.revision++;
    mounted.rerender(<View />);
    expect(screen.queryByText('Personal meeting')).toBeNull();
    state.meeting = false;
    mounted.rerender(<View />);
    await act(async () => {
      complete({
        data: {
          date: '2026-10-11',
          timeZone: 'Asia/Shanghai',
          total: 1,
          items: [{ id: 'private', title: 'Old private title' }],
        },
      });
      await pending;
    });
    expect(screen.queryByText('Old private title')).toBeNull();
  },
);
it('final refusal clears the old private title and does not claim a zero count or show raw errors', async () => {
  const mounted = render(<View />);
  await screen.findByText('Personal meeting');
  state.request.mockRejectedValue(
    new ApiClientError('secret failure', {
      status: 403,
      method: 'GET',
      url: '/api/workbench/meetings',
    }),
  );
  const card = screen
    .getByRole('heading', { name: enUS.workbench.todayMeetings })
    .closest('[data-slot="card"]') as HTMLElement;
  state.revision++;
  mounted.rerender(<View />);
  await waitFor(() =>
    expect(screen.queryByText('Personal meeting')).toBeNull(),
  );
  expect(screen.queryByText('secret failure')).toBeNull();
  expect(within(card).queryByText('0 meetings')).toBeNull();
  expect(
    within(card).queryByRole('button', { name: enUS.approvals.retry }),
  ).toBeNull();
});
