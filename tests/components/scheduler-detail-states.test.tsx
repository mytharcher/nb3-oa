import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import scheduler from '../../client/locales/administration/scheduler/en-US.js';
import Details from '../../client/pages/administration/scheduler/pages/schedule-detail-page.js';
const api = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useService: () => api,
}));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ refresh: vi.fn() }),
}));
const ns = '@nocobase/app-plugin-scheduler';
const runtime = await createTestI18nRuntime({
  strict: false,
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: { [ns]: scheduler },
});
const item = {
  id: 's1',
  key: 'oa.departure.daily-execution',
  title: 'Departure execution',
  cron: '30 0 * * *',
  timezone: 'UTC',
  enabled: true,
  lifecycleState: 'active',
  scheduleStatus: 'active',
  targetState: 'ready',
  runCount: 2,
  targetType: 'workflow',
  targetSummary: { targetLabel: 'Departure execution' },
};
const triggers = [
  {
    id: 'old',
    startedAt: '2026-01-01T00:00:00Z',
    finishedAt: '2026-01-01T00:00:20Z',
    status: 'succeeded',
  },
  {
    id: 'new',
    startedAt: '2026-10-01T00:00:00Z',
    finishedAt: '2026-10-01T00:00:02Z',
    status: 'failed',
  },
];
beforeEach(() => {
  api.request.mockReset();
  api.request.mockImplementation(({ path }: { path: string }) =>
    Promise.resolve({ data: path.endsWith('occurrences') ? triggers : item }),
  );
});
function mount() {
  render(
    <TestI18nProvider runtime={runtime} namespace={ns}>
      <MemoryRouter initialEntries={['/schedules/s1']}>
        <Routes>
          <Route path='/schedules/:scheduleId' element={<Details />} />
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
it('sorts trigger dates and durations and refreshes both the schedule and its occurrences', async () => {
  mount();
  const table = await screen.findByRole('table');
  expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
    scheduler.page.triggerStatuses.failed,
  );
  await userEvent.click(
    within(table).getByRole('button', {
      name: scheduler.page.triggerColumns.duration,
    }),
  );
  expect(within(table).getAllByRole('row')[1]).toHaveTextContent(
    scheduler.page.triggerStatuses.succeeded,
  );
  await userEvent.click(
    screen.getByRole('button', { name: scheduler.page.refresh }),
  );
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(4));
});
it.each([403, 404, 500])(
  'handles schedule detail status %s without exposing stale records or raw messages',
  async (status) => {
    api.request.mockRejectedValue(
      new ApiClientError('private scheduler detail', {
        status,
        method: 'GET',
        url: '/api/schedules/s1',
      }),
    );
    mount();
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent('private scheduler detail');
    expect(
      within(alert).queryByRole('button', { name: scheduler.page.retry }) !==
        null,
    ).toBe(status === 500);
    expect(screen.queryByRole('table')).toBeNull();
  },
);
