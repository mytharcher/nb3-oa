import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { PersonalCards } from '../../client/pages/home/personal-cards.js';
import { ApplicationTableEmpty } from '../../client/components/application-table-empty.js';

vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: 'employee' } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useCan: () => ({ can: true, isPending: false }),
}));
vi.mock('../../client/pages/approvals/use-resource.js', () => ({
  useResource: (path: string) => ({
    loading: false,
    reload: vi.fn(),
    data:
      path === 'leaveBalances/me'
        ? []
        : path === 'leaveRequests/options'
          ? { leaveTypes: [] }
          : path === 'workbench/meetings'
            ? {
                date: '2026-10-11',
                timeZone: 'Asia/Shanghai',
                total: 1,
                items: [
                  {
                    id: 'booking-one',
                    title: 'Planning meeting',
                    startAt: '2026-10-11T01:00:00Z',
                    endAt: '2026-10-11T02:00:00Z',
                    status: 'confirmed',
                  },
                ],
              }
            : {
                count: 1,
                items: [
                  {
                    id: 'receipt-one',
                    announcementId: 'notice-one',
                    title: 'Office notice',
                    dueAt: '2026-10-11',
                  },
                ],
              },
  }),
}));
const english = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const chinese = await createTestI18nRuntime({
  locale: 'zh-CN',
  application: { namespace: 'nb3-oa', resources: zhCN },
});
afterEach(cleanup);
it.each([
  { runtime: english, date: 'Oct 11, 2026' },
  { runtime: chinese, date: '2026年10月11日' },
])(
  'keeps personal records over the workbench and localizes the calendar date ($date)',
  ({ runtime, date }) => {
    render(
      <TestI18nProvider runtime={runtime}>
        <MemoryRouter initialEntries={['/?mode=mine']}>
          <PersonalCards />
        </MemoryRouter>
      </TestI18nProvider>,
    );
    expect(
      screen.getByRole('link', { name: 'Planning meeting' }),
    ).toHaveAttribute('href', '/booking/booking-one?mode=mine');
    expect(screen.getByRole('link', { name: 'Office notice' })).toHaveAttribute(
      'href',
      '/announcement/notice-one?mode=mine',
    );
    expect(screen.getByText((value) => value.includes(date))).toBeVisible();
  },
);
it('renders the owner action and lets no-results clear filters', async () => {
  const clear = vi.fn();
  render(
    <TestI18nProvider runtime={english}>
      <ApplicationTableEmpty
        title='No matches'
        action={<button>Create task</button>}
        clearFilters={{ label: 'Clear filters', onClick: clear }}
      />
    </TestI18nProvider>,
  );
  expect(screen.getByRole('button', { name: 'Create task' })).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(clear).toHaveBeenCalledOnce();
});
