import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';
import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import { TeamStatus } from '../../client/pages/home/team-status.js';
const { state } = vi.hoisted(() => ({
  state: {
    can: true,
    data: {
      meta: { date: '2030-01-02', timeZone: 'Asia/Shanghai' },
      data: Array.from({ length: 8 }, (_, i) => ({
        id: String(i),
        userId: String(i % 7),
        kind: 'leave',
        name: `Colleague ${i}`,
        department: 'Team',
        startAt: '2030-01-02T01:00:00Z',
        endAt: '2030-01-02T05:00:00Z',
      })),
    },
    error: undefined as unknown,
    loading: false,
  },
}));
vi.mock('../../client/pages/personal-schedules/resource.js', () => ({
  useScheduleResource: () => ({ ...state, reload: vi.fn() }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: state.can, isPending: false }),
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function open() {
  return render(
    <TestI18nProvider runtime={runtime}>
      <MemoryRouter>
        <TeamStatus />
      </MemoryRouter>
    </TestI18nProvider>,
  );
}
beforeEach(() => {
  state.can = true;
  state.error = undefined;
});
it('counts unique authorized people before truncating six preview periods', () => {
  state.error = undefined;
  open();
  expect(screen.getByText('Leave · 7')).toBeVisible();
  expect(screen.queryByRole('listitem')).toBeNull();
  expect(screen.queryByText('Colleague 0')).toBeNull();
  expect(
    screen.getByRole('link', { name: 'View team calendar' }),
  ).toHaveAttribute('href', '/team-calendar?day=2030-01-02&scope=managed');
});
it('does not present stale counts as a successful empty or current result after failure', () => {
  state.error = new Error('network');
  open();
  expect(screen.getByRole('alert')).toBeVisible();
  expect(screen.queryByText('Leave · 7')).toBeNull();
});

it('omits the team summary when the calendar permission is absent', () => {
  state.can = false;
  open();
  expect(screen.queryByRole('region')).toBeNull();
});
