import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import applicationRoutes from '../../../client/routes.ts';
import platformRoutes from '../../../client/route-modules/platform.ts';

// The application's own groups (the first two contributions of client/routes.ts) and this module's pages only, so the
// module is checked independently of the other modules' routes.
function resolve() {
  return resolveAppClientContributions([
    {
      packageName: 'nb3-oa',
      routes: [applicationRoutes[0]!, applicationRoutes[1]!, ...platformRoutes],
      source: 'application',
    },
  ]);
}

function flatten(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
}

describe('platform client routes', () => {
  it('places each settings page in its group with its settings item', () => {
    const routes = flatten(resolve().settingsRouteTree);
    const page = (name: string) => routes.find((route) => route.name === name);
    const expected: [string, string, string][] = [
      [
        'platform-work-calendar',
        '/settings/work-calendar',
        'oa.platform.calendar',
      ],
      [
        'platform-dictionaries',
        '/settings/dictionaries',
        'oa.platform.dictionaries',
      ],
      [
        'platform-approval-rules',
        '/settings/approval-rules',
        'oa.platform.rules',
      ],
      ['platform-sequences', '/settings/sequences', 'oa.platform.sequences'],
      ['platform-audit-logs', '/settings/audit-logs', 'oa.platform.auditLogs'],
    ];
    for (const [name, path, item] of expected) {
      const route = page(name);
      expect(route?.path).toBe(path);
      expect(route?.authz).toEqual({
        resource: { type: 'settings', id: item },
        action: 'read',
      });
    }
    const configuration = routes.find(
      (route) => route.name === 'oa-configuration',
    );
    expect(configuration?.children?.map((child) => child.name)).toEqual(
      expect.arrayContaining([
        'platform-work-calendar',
        'platform-dictionaries',
        'platform-approval-rules',
        'platform-sequences',
      ]),
    );
    const system = routes.find((route) => route.name === 'oa-system');
    expect(system?.children?.map((child) => child.name)).toContain(
      'platform-audit-logs',
    );
  });

  it('loads every page and overlay component', async () => {
    const loaders = flatten(resolve().settingsRouteTree)
      .filter((route) => route.name.startsWith('platform-'))
      .map((route) => route.componentLoader)
      .filter((loader) => loader !== undefined);
    expect(loaders.length).toBe(14);
    for (const loader of loaders)
      await expect(loader()).resolves.toMatchObject({
        default: expect.any(Function),
      });
  });
});
