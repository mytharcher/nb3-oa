import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import applicationRoutes from '../../../client/routes.ts';
import importRoutes from '../../../client/route-modules/import.ts';

// The application's own groups (the first two contributions of client/routes.ts) and this module's page only.
function resolve() {
  return resolveAppClientContributions([
    {
      packageName: 'nb3-oa',
      routes: [applicationRoutes[0]!, applicationRoutes[1]!, ...importRoutes],
      source: 'application',
    },
  ]);
}

function flatten(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
}

describe('import client routes', () => {
  it('places the page in 组织与人员 with the settings item, and the new-import dialog behind `update`', () => {
    const routes = flatten(resolve().settingsRouteTree);
    const page = routes.find((route) => route.name === 'import-data');
    expect(page?.path).toBe('/settings/import');
    expect(page?.authz).toEqual({
      resource: { type: 'settings', id: 'oa.import' },
      action: 'read',
    });
    const dialog = routes.find((route) => route.name === 'import-data-new');
    expect(dialog?.authz).toEqual({
      resource: { type: 'settings', id: 'oa.import' },
      action: 'update',
    });
    const organization = routes.find(
      (route) => route.name === 'oa-organization',
    );
    expect(organization?.children?.map((child) => child.name)).toContain(
      'import-data',
    );
  });

  it('loads the page and its overlays', async () => {
    const loaders = flatten(resolve().settingsRouteTree)
      .filter((route) => route.name.startsWith('import-data'))
      .map((route) => route.componentLoader)
      .filter((loader) => loader !== undefined);
    expect(loaders.length).toBe(3);
    for (const loader of loaders)
      await expect(loader()).resolves.toMatchObject({
        default: expect.any(Function),
      });
  });
});
