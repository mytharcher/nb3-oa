import {
  resolveAppClientContributions,
  type AppClientRegisteredRoute,
} from '@nocobase/app-client/plugins';
import { describe, expect, it } from 'vitest';

import applicationRoutes from '../../../client/routes.ts';

function flatten(
  routes: readonly AppClientRegisteredRoute[],
): AppClientRegisteredRoute[] {
  return routes.flatMap((route) => [route, ...flatten(route.children ?? [])]);
}

function settingsRoutes(): AppClientRegisteredRoute[] {
  return flatten(
    resolveAppClientContributions([
      {
        packageName: '@nocobase/app-template-default',
        routes: applicationRoutes,
        source: 'application',
      },
    ]).settingsRouteTree,
  );
}

describe('organisation settings routes', () => {
  it('pins each page to its settings item, which the server checks too', () => {
    // A settings page checks its own settings item for `read`; changing an id strands the grants that name it.
    const pages = settingsRoutes()
      .filter((route) => route.name.startsWith('org-'))
      .map((route) => ({
        name: route.name,
        authz:
          typeof route.authz === 'string'
            ? route.authz
            : `${route.authz.resource.type}:${route.authz.resource.id}:${route.authz.action}`,
      }));
    const entry = (name: string, item: string) => ({
      name,
      authz: `settings:${item}:read`,
    });
    expect(pages).toEqual(
      expect.arrayContaining([
        entry('org-departments', 'oa.org.departments'),
        entry('org-department', 'oa.org.departments'),
        entry('org-department-edit', 'oa.org.departments'),
        entry('org-department-member-new', 'oa.org.departments'),
        entry('org-positions', 'oa.org.positions'),
        entry('org-position-edit', 'oa.org.positions'),
        entry('org-grades', 'oa.org.grades'),
        entry('org-grade-new', 'oa.org.grades'),
        entry('org-duty-roles', 'oa.org.dutyRoles'),
        entry('org-duty-role', 'oa.org.dutyRoles'),
        entry('org-duty-role-member-new', 'oa.org.dutyRoles'),
      ]),
    );
  });

  it('places the four pages in the 组织与人员 group with their menu entries', () => {
    const group = settingsRoutes().find(
      (route) => route.name === 'oa-organization',
    );
    const children = (group?.children ?? []).filter((route) =>
      route.name.startsWith('org-'),
    );
    expect(
      children.map((route) => [route.name, route.navigation?.title]),
    ).toEqual([
      ['org-departments', 'org.navigation.departments'],
      ['org-positions', 'org.navigation.positions'],
      ['org-grades', 'org.navigation.grades'],
      ['org-duty-roles', 'org.navigation.dutyRoles'],
    ]);
  });
});
