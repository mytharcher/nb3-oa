import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { expect, it } from 'vitest';
import routes from '../../client/routes.js';
import plugins from '../../client/plugins.js';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import locales from '../../client/locales/index.js';
import {
  buildRouteNavigation,
  routeKey,
} from '../../client/routing/route-navigation.js';
import {
  applicationNavigationItems,
  firstNavigationPath,
  isSystemLocation,
  systemNavigationItems,
} from '../../client/routing/system-navigation.js';

const resolved = resolveAppClientContributions([
  ...plugins.plugins,
  { packageName: 'nb3-oa', routes, source: 'application' },
]).routes;
it('integrates the official Foundation page once under system operations with unrestricted access', async () => {
  const flatten = (items: typeof resolved): (typeof resolved)[number][] =>
    items.flatMap((item) => [item, ...flatten(item.children ?? [])]);
  const pages = flatten(resolved).filter(
    (route) => route.path === '/foundation',
  );
  expect(pages).toHaveLength(1);
  const page = pages[0]!;
  expect(page).toMatchObject({
    name: 'foundation',
    auth: 'required',
    authz: 'unrestricted',
    navigation: { title: 'oa.navigation.foundation' },
  });
  const i18n = await createTestI18nRuntime({
    application: { namespace: 'nb3-oa', resources: locales },
  });
  const title = page.navigation!.title;
  expect(i18n.getFixedT(page.packageName)(title)).toBe('App Foundation');
  await i18n.changeLanguage('zh-CN');
  expect(i18n.getFixedT(page.packageName)(title)).toBe('应用底座');
  expect(isSystemLocation(resolved, '/foundation')).toBe(true);
  const visible = systemNavigationItems(
    buildRouteNavigation(resolved, new Set()),
  );
  expect(
    visible
      .find(({ route }) => route.name === 'oa-system-operations')
      ?.children.some(({ route }) => route === page),
  ).toBe(true);
  const denied = systemNavigationItems(
    buildRouteNavigation(resolved, new Set([routeKey(page)])),
  );
  expect(
    denied
      .flatMap((section) => section.children)
      .some(({ route }) => route === page),
  ).toBe(false);
  const { FoundationPage } =
    await import('@nocobase/app-plugin-foundation/client/pages');
  expect((await page.componentLoader!()).default).toBe(FoundationPage);
});
it('registers a standalone authenticated system entry without moving existing management URLs', () => {
  const entry = resolved.find((route) => route.name === 'oa-system-entry');
  expect(entry).toMatchObject({
    path: '/system',
    auth: 'required',
    authz: 'skip',
  });
  expect(entry?.navigation).toBeUndefined();
  for (const path of [
    '/system',
    '/users',
    '/users/42',
    '/users/42/permissions',
    '/permission-sets/edit/example',
    '/access/roles',
    '/schedules/42',
  ]) {
    expect(isSystemLocation(resolved, path)).toBe(true);
  }
  for (const path of ['/', '/inbox', '/employees', '/systematic']) {
    expect(isSystemLocation(resolved, path)).toBe(false);
  }
});
it('projects the complete authorized system group as one link and excludes denied entries from its default', () => {
  const entry = resolved.find((route) => route.name === 'oa-system-entry');
  const raw = buildRouteNavigation(resolved, new Set());
  const system = raw.find(({ route }) => route.name === 'oa-system')!;
  const app = applicationNavigationItems(raw, entry);
  expect(app.find(({ route }) => route.path === '/system')).toMatchObject({
    children: [],
    route: { navigation: system.route.navigation },
  });
  expect(app.some(({ route }) => route.name === 'oa-system')).toBe(false);
  const first = firstNavigationPath(systemNavigationItems(raw));
  expect(first).toBe('/users');
  const users = system.children
    .flatMap((section) => section.children)
    .find(({ route }) => route.path === first)!;
  const denied = buildRouteNavigation(
    resolved,
    new Set([routeKey(users.route)]),
  );
  expect(firstNavigationPath(systemNavigationItems(denied))).not.toBe(first);
});
