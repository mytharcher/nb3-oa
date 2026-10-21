import { render, screen, within } from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import SchedulesPage from '../../client/pages/administration/scheduler/pages/schedules-page.js';
import enUS from '../../client/locales/en-US.js';
import scheduler from '../../client/locales/administration/scheduler/en-US.js';
const { api } = vi.hoisted(() => ({ api: { request: vi.fn() } }));
vi.mock('@nocobase/app-client', async (original) => ({
  ...(await original<typeof import('@nocobase/app-client')>()),
  useService: () => api,
}));
const ns = '@nocobase/app-plugin-scheduler';
// Target kinds arrive from the server and intentionally fall back to their supplied identifier.
const runtime = await createTestI18nRuntime({
  strict: false,
  application: { namespace: 'nb3-oa', resources: enUS },
  namespaces: { [ns]: scheduler },
});
describe('scheduler list', () => {
  it('keeps the target under the name and preserves target issue feedback without a target column', async () => {
    api.request.mockResolvedValue({
      data: [
        {
          id: 's1',
          key: 'oa.departure.daily-execution',
          title: 'Departure execution',
          cron: '30 0 * * *',
          timezone: 'Asia/Shanghai',
          enabled: true,
          lifecycleState: 'active',
          scheduleStatus: 'active',
          targetState: 'missing',
          runCount: 0,
          targetType: 'app.departure-execution',
          targetSummary: { targetLabel: 'Departure execution' },
        },
      ],
      meta: { total: 1 },
    });
    render(
      <TestI18nProvider runtime={runtime} namespace={ns}>
        <MemoryRouter>
          <SchedulesPage />
        </MemoryRouter>
      </TestI18nProvider>,
    );
    const name = await screen.findByRole('link', {
      name: 'Departure execution',
    });
    const cell = name.closest('td')!;
    expect(
      within(cell).getByText('app.departure-execution'),
    ).toBeInTheDocument();
    expect(
      within(cell).getByText(scheduler.page.targetStates.missing),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader')).toHaveLength(5);
    expect(
      screen.queryByRole('columnheader', { name: 'Target' }),
    ).not.toBeInTheDocument();
  });
});

it('restores a failed schedule toggle and explains the failure without backend details', async () => {
  api.request.mockReset();
  const item = {
    id: 's1',
    key: 'oa.departure.daily-execution',
    title: 'Departure execution',
    cron: '30 0 * * *',
    timezone: 'Asia/Shanghai',
    enabled: true,
    lifecycleState: 'active',
    scheduleStatus: 'active',
    targetState: 'ready',
    runCount: 0,
    targetType: 'app.departure-execution',
  };
  api.request.mockImplementation(({ method }: { method?: string }) =>
    method === 'POST'
      ? Promise.reject(new Error('private toggle detail'))
      : Promise.resolve({ data: [item], meta: { total: 1 } }),
  );
  render(
    <TestI18nProvider runtime={runtime} namespace={ns}>
      <MemoryRouter>
        <SchedulesPage />
      </MemoryRouter>
    </TestI18nProvider>,
  );
  const { default: userEvent } = await import('@testing-library/user-event');
  await userEvent.click(
    await screen.findByRole('switch', { name: scheduler.page.actions.disable }),
  );
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(scheduler.errors.toggleFailed);
  expect(alert).not.toHaveTextContent('private toggle detail');
  expect(
    screen.getByRole('switch', { name: scheduler.page.actions.disable }),
  ).toHaveAttribute('aria-checked', 'true');
});
