import { resolveAppClientContributions } from '@nocobase/app-client/plugins';
import { expect, it } from 'vitest';
import routes from '../../client/routes.js';
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
  { packageName: 'nb3-oa', routes, source: 'application' },
]).routes;
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
