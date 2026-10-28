import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { MemoryRouter, useNavigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import enUS from '../../client/locales/en-US.js';
import { NavigationMenu } from '../../client/layouts/components/navigation-menu.js';
import { HeaderActions } from '../../client/layouts/components/header-actions.js';
import { AppSidebarProvider } from '../../client/layouts/components/app-sidebar.js';
import { refreshPersonalWork } from '../../client/lib/personal-work-refresh.js';
const state = vi.hoisted(() => ({
  request: vi.fn(),
  can: true,
  user: 'one',
  revision: 0,
  unread: 2,
}));
const api = { request: state.request };
vi.mock('@nocobase/app-client', () => ({ useApiClient: () => api }));
vi.mock('@nocobase/app-plugin-authentication/client', () => ({
  useAuthentication: () => ({ session: { user: { id: state.user } } }),
}));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationRevision: () => state.revision,
  useCan: () => ({ can: state.can, isPending: false }),
}));
vi.mock('@nocobase/app-plugin-notification-in-app/client/inbox', () => ({
  useInboxRefresh: () => {},
  useInboxUnreadCount: () => ({ data: state.unread }),
}));
vi.mock('../../client/layouts/components/demo-account-menu.js', () => ({
  DemoAccountMenu: () => null,
}));
vi.mock('../../client/theme/index.js', () => ({ ThemeSettings: () => null }));
vi.mock('../../client/layouts/components/user-menu.js', () => ({
  UserMenu: () => null,
}));
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function route(
  name: string,
  path: string,
  title: string,
): AppClientRegisteredRoute {
  return {
    id: name,
    name,
    path,
    packageName: 'nb3-oa',
    source: 'application',
    auth: 'required',
    navigation: { title },
    componentLoader: async () => ({ default: () => null }),
  };
}
const items = [
  {
    route: route('oa-task-center', '/taskCenter', 'taskCenter.navigation'),
    children: [],
  },
  { route: route('inbox', '/inbox', 'oa.navigation.inbox'), children: [] },
];
function Navigate() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        void navigate('/inbox');
      }}
    >
      Navigate
    </button>
  );
}
function mount({ header = false } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const tree = () => (
    <QueryClientProvider client={client}>
      <TestI18nProvider runtime={runtime}>
        <MemoryRouter>
          <AppSidebarProvider>
            {header ? (
              <HeaderActions />
            ) : (
              <>
                <NavigationMenu
                  items={items}
                  label='Menu'
                  selectedKey={undefined}
                />
                <Navigate />
              </>
            )}
          </AppSidebarProvider>
        </MemoryRouter>
      </TestI18nProvider>
    </QueryClientProvider>
  );
  const view = render(tree());
  return { ...view, update: () => view.rerender(tree()) };
}
beforeEach(() => {
  state.can = true;
  state.user = 'one';
  state.revision = 0;
  state.unread = 2;
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  state.request.mockReset().mockImplementation(async ({ query }) => ({
    data: {
      pending: query.sourceType === 'approval.task' ? 3 : 1,
      completed: 0,
      cancelled: 0,
    },
  }));
});
it('renders separate menu badges and refreshes pending work after handling', async () => {
  mount();
  expect(
    await screen.findByRole('status', { name: 'Task center, 6 pending' }),
  ).toHaveTextContent('6');
  expect(screen.getByRole('link', { name: 'Task center' })).toHaveAttribute(
    'href',
    '/taskCenter',
  );
  expect(screen.getByRole('status', { name: '2 unread' })).toHaveTextContent(
    '2',
  );
  expect(state.request.mock.calls.map(([r]) => r.query.sourceType)).toEqual(
    expect.arrayContaining([
      'approval.task',
      'approval.cc',
      'oa.workItem',
      'oa.announcementReceipt',
    ]),
  );
  expect(
    state.request.mock.calls.every(
      ([r]) => r.query.sourceType !== 'approval.application',
    ),
  ).toBe(true);
  const calls = state.request.mock.calls.length;
  act(() => refreshPersonalWork());
  await waitFor(() =>
    expect(state.request.mock.calls.length).toBeGreaterThan(calls),
  );
});
it('keeps pending counts independent of inbox read state, hides zero and caps large totals', async () => {
  state.unread = 0;
  state.request.mockResolvedValue({
    data: { pending: 30, completed: 0, cancelled: 0 },
  });
  const view = mount();
  expect(
    await screen.findByRole('status', { name: 'Task center, 120 pending' }),
  ).toHaveTextContent('99+');
  expect(screen.getAllByRole('status')).toHaveLength(1);
  state.request.mockResolvedValue({
    data: { pending: 0, completed: 0, cancelled: 0 },
  });
  act(() => refreshPersonalWork());
  await waitFor(() => expect(screen.queryByRole('status')).toBeNull());
  view.unmount();
});
it('does not fetch or show a task count without the page permission', () => {
  state.can = false;
  mount();
  expect(screen.queryByRole('status', { name: /Task center/ })).toBeNull();
  expect(state.request).not.toHaveBeenCalled();
});
it('shows an unknown pending count on error and recovers on focus', async () => {
  state.request.mockRejectedValue(new Error('offline'));
  mount();
  expect(
    await screen.findByRole('status', {
      name: 'Task center, pending count unavailable',
    }),
  ).toHaveTextContent('—');
  state.request.mockResolvedValue({
    data: { pending: 1, completed: 0, cancelled: 0 },
  });
  act(() => window.dispatchEvent(new Event('focus')));
  expect(
    await screen.findByRole('status', { name: 'Task center, 4 pending' }),
  ).toHaveTextContent('4');
});
it('clears the previous identity and permission-revision count while new statistics are pending', async () => {
  const view = mount();
  await screen.findByRole('status', { name: 'Task center, 6 pending' });
  let complete!: (value: unknown) => void;
  state.request.mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  state.user = 'two';
  state.revision++;
  view.update();
  expect(
    screen.queryByRole('status', { name: 'Task center, 6 pending' }),
  ).toBeNull();
  view.unmount();
  await act(async () => {
    complete?.({ data: { pending: 0, completed: 0, cancelled: 0 } });
  });
});
it('uses the existing icon-rail dot and restores the full number on expansion', async () => {
  localStorage.setItem('nocobase:sidebar:collapsed', 'true');
  mount();
  const badge = await screen.findByRole('status', {
    name: 'Task center, 6 pending',
  });
  expect(badge).toHaveClass('size-2');
  expect(badge).toBeEmptyDOMElement();
  act(() => {
    localStorage.setItem('nocobase:sidebar:collapsed', 'false');
    window.dispatchEvent(new Event('nocobase:sidebar-preference-change'));
  });
  expect(badge).toHaveTextContent('6');
});
it('removes both task and notification shortcuts from the header without starting their counts', () => {
  mount({ header: true });
  expect(
    screen.queryByRole('link', { name: /Task center|Notifications/ }),
  ).toBeNull();
  expect(screen.queryByRole('status')).toBeNull();
  expect(state.request).not.toHaveBeenCalled();
  expect(
    screen.getByRole('button', { name: enUS.globalSearch.title }),
  ).toHaveAttribute('href', '/search');
});
