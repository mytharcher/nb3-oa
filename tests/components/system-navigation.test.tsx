import type { AppClientRegisteredRoute } from '@nocobase/app-client/plugins';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { act, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { Wrench, UsersRound } from 'lucide-react';
import { AppLayout } from '../../client/layouts/app-layout.js';
import SystemEntry from '../../client/pages/system/index.js';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const auth = vi.hoisted(() => ({ can: vi.fn(), revision: 0 }));
vi.mock('@nocobase/app-plugin-authorization/client', () => ({
  useAuthorizationClient: () => auth,
  useAuthorizationRevision: () => auth.revision,
}));
vi.mock('@nocobase/app-plugin-i18n/client', () => ({
  useSyncServerLocale: () => {},
}));
vi.mock('../../client/layouts/components/header-actions.js', () => ({
  HeaderActions: () => null,
}));
vi.mock('../../client/layouts/components/sidebar-footer.js', () => ({
  AppSidebarFooter: () => null,
}));
vi.mock('../../client/layouts/components/app-brand.js', () => ({
  AppBrand: () => null,
}));

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
const chinese = await createTestI18nRuntime({
  locale: 'zh-CN',
  application: { namespace: 'nb3-oa', resources: zhCN },
});
const page = (
  name: string,
  path: string,
  title: string,
): AppClientRegisteredRoute => ({
  id: name,
  name,
  path,
  packageName: 'nb3-oa',
  source: 'application',
  auth: 'required',
  authz: { resource: { type: 'page', id: name }, action: 'access' },
  componentLoader: async () => ({ default: () => null }),
  navigation: { title, icon: UsersRound },
});
const home = {
  ...page('home', '/', 'navigation.home'),
  authz: 'skip' as const,
};
const entry = {
  ...page('oa-system-entry', '/system', 'oa.navigation.system'),
  navigation: undefined,
  authz: 'skip' as const,
};
const users = {
  ...page('users', '/users', 'oa.navigation.users'),
  children: [{ ...page('detail', '/users/:id', ''), navigation: undefined }],
};
const audit = page('audit', '/audit', 'platform.navigation.auditLogs');
const system = {
  ...page('oa-system', '/', 'oa.navigation.system'),
  componentLoader: undefined,
  navigation: { title: 'oa.navigation.system', icon: Wrench },
  children: [
    {
      ...page('oa-system-people', '/', 'oa.navigation.systemPeople'),
      componentLoader: undefined,
      children: [users, audit],
    },
  ],
};
const routes = [home, entry, system];
function tree(path = '/', locale = runtime) {
  return (
    <TestI18nProvider runtime={locale}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppLayout routes={routes} />}>
            <Route path='/' element={<h1>Workbench</h1>} />
            <Route path='/system' element={<SystemEntry />} />
            <Route path='/users' element={<h1>Accounts</h1>} />
            <Route path='/users/:id' element={<h1>User detail</h1>} />
            <Route path='/audit' element={<h1>Audit</h1>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TestI18nProvider>
  );
}
beforeEach(() => {
  localStorage.clear();
  auth.revision = 0;
  auth.can.mockReset().mockResolvedValue(true);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => vi.unstubAllGlobals());

it('enters through a single link, replaces the menu and returns with a stable focus', async () => {
  const user = userEvent.setup();
  render(tree());
  const link = await screen.findByRole('link', {
    name: 'System administration',
  });
  expect(link).toHaveAttribute('href', '/system');
  expect(
    screen.queryByRole('button', { name: 'System administration' }),
  ).toBeNull();
  expect(screen.queryByRole('link', { name: 'User accounts' })).toBeNull();
  await user.click(link);
  expect(
    await screen.findByRole('heading', { name: 'Accounts' }),
  ).toBeVisible();
  const nav = screen.getByRole('navigation', {
    name: 'System administration navigation',
  });
  expect(
    within(nav).getByRole('link', { name: 'User accounts' }),
  ).toHaveAttribute('aria-current', 'page');
  expect(within(nav).queryByRole('link', { name: 'Home' })).toBeNull();
  expect(screen.getByRole('main')).toHaveFocus();
  await user.click(screen.getByRole('link', { name: 'Back to application' }));
  expect(
    await screen.findByRole('heading', { name: 'Workbench' }),
  ).toBeVisible();
  expect(screen.getByRole('main')).toHaveFocus();
  expect(
    screen.queryByRole('link', { name: 'Back to application' }),
  ).toBeNull();
});

it('recognizes a hidden detail URL independently of permissions', async () => {
  auth.can.mockResolvedValue(false);
  render(tree('/users/42'));
  expect(
    await screen.findByRole('link', { name: 'Back to application' }),
  ).toBeVisible();
  expect(
    screen.getByRole('navigation', {
      name: 'System administration navigation',
    }),
  ).toBeVisible();
  expect(screen.queryByRole('link', { name: 'User accounts' })).toBeNull();
});

it('waits for permissions before choosing the first accessible system page', async () => {
  let resolve!: (allowed: boolean) => void;
  const pending = new Promise<boolean>((done) => {
    resolve = done;
  });
  auth.can.mockImplementation(async (check) =>
    check.resource.id === 'audit' ? pending : false,
  );
  render(tree('/system'));
  expect(screen.getByRole('status', { name: 'Loading page' })).toBeVisible();
  expect(screen.queryByRole('heading', { name: 'Audit' })).toBeNull();
  await act(async () => resolve(true));
  expect(await screen.findByRole('heading', { name: 'Audit' })).toBeVisible();
});

it('hides an empty system entry and supplies a safe exit on direct access', async () => {
  auth.can.mockResolvedValue(false);
  render(tree('/system'));
  expect(
    await screen.findByRole('heading', { name: 'Access denied' }),
  ).toBeVisible();
  expect(
    screen.getByRole('link', { name: 'Back to workbench' }),
  ).toHaveAttribute('href', '/');
});

it('reports authorization failure separately and retries without reloading the app', async () => {
  auth.can.mockRejectedValue(new Error('network'));
  render(tree('/system'));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Unable to load page',
  );
  expect(screen.queryByRole('heading', { name: 'Access denied' })).toBeNull();
  auth.can.mockResolvedValue(true);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Retry' }));
  expect(
    await screen.findByRole('heading', { name: 'Accounts' }),
  ).toBeVisible();
});

it('removes the system entry when the last permission is revoked', async () => {
  const view = render(tree());
  await screen.findByRole('link', { name: 'System administration' });
  auth.can.mockResolvedValue(false);
  auth.revision++;
  view.rerender(tree());
  await waitFor(() =>
    expect(
      screen.queryByRole('link', { name: 'System administration' }),
    ).toBeNull(),
  );
});

it('uses top-level icon buttons for system sections in collapsed mode', async () => {
  localStorage.setItem('nocobase:sidebar:collapsed', 'true');
  render(tree('/users'));
  const nav = screen.getByRole('navigation', {
    name: 'System administration navigation',
  });
  const link = await within(nav).findByRole('link', { name: 'User accounts' });
  expect(link).toHaveAttribute('data-slot', 'sidebar-menu-button');
  expect(screen.getByText('Users and organization')).toHaveClass(
    'group-data-[collapsible=icon]:sr-only',
  );
});

it('translates the system navigation and return link into Chinese', async () => {
  render(tree('/users', chinese));
  expect(await screen.findByRole('link', { name: '返回到应用' })).toBeVisible();
  expect(
    screen.getByRole('navigation', { name: '系统管理导航' }),
  ).toBeVisible();
});

it('closes the mobile sheet when the system entry is chosen', async () => {
  vi.stubGlobal('innerWidth', 375);
  render(tree());
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Open navigation' }));
  const sheet = await screen.findByRole('dialog');
  await user.click(
    await within(sheet).findByRole('link', { name: 'System administration' }),
  );
  expect(
    await screen.findByRole('heading', { name: 'Accounts' }),
  ).toBeVisible();
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  // Focus after the Sheet exit animation is asserted in shell-preview.mjs, in Chromium.
});
