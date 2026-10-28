import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { demoModeServiceToken } from '@nocobase/app-plugin-demo-mode/server/tokens';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { Hono } from 'hono';
import { z } from 'zod';
import { demoDataServiceToken } from '../../providers/demo-data/index.js';

/** Presentation labels only: scenario roles never grant business permissions. */
export async function demoAccountRoles(app: Application) {
  const { accounts } = await app.container
    .resolve(demoDataServiceToken)
    .status();
  const roles = new Map<string, Set<string>>();
  for (const account of accounts) {
    const labels = roles.get(account.id) ?? new Set<string>();
    labels.add(account.role);
    roles.set(account.id, labels);
  }
  const authz = app.container.resolve(authorizationToken);
  const [sets, assignments] = await Promise.all([
    authz.permissionSets.list(),
    authz.permissionSets.listAssignments(),
  ]);
  const rootSets = new Set(
    sets
      .filter((set) => authz.permissionSets.protection(set.key)?.unrestricted)
      .map((set) => set.key),
  );
  const rootIds = [
    ...new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.subject.type === 'user' &&
            rootSets.has(assignment.permissionSet),
        )
        .map((assignment) => assignment.subject.id),
    ),
  ];
  for (const id of rootIds) {
    const labels = roles.get(id) ?? new Set<string>();
    labels.add('administrator');
    roles.set(id, labels);
  }
  const userIds = [...roles.keys()];
  const users = app.container.resolve(userAdministrationServiceToken);
  const result: { username: string; roles: string[] }[] = [];
  for (let offset = 0; offset < userIds.length; offset += 100) {
    const { items } = await users.list({
      userIds: userIds.slice(offset, offset + 100),
      pageSize: 100,
      status: 'enabled',
    });
    for (const user of items) {
      result.push({
        username: user.username || user.email,
        roles: [...roles.get(user.id)!],
      });
    }
  }
  return result;
}

// Register this read surface alone; the sample-data management routes stay disabled.
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv>();
    router.onError(apiErrorHandler);
    router.get(
      '/demoAccountRoles',
      app.container.resolve(authenticationToken).required(),
      describeRoute({
        operationId: 'getDemoAccountRoles',
        tags: ['DemoAccounts'],
        summary: 'Get scenario role labels for switchable demo accounts',
        description:
          'Requires a signed-in session and enabled Demo Mode, where visitors can enter all enabled person accounts. Returns presentation role keys only; grants no business permissions.',
        responses: {
          200: dataResponse(
            z.array(
              z.object({ username: z.string(), roles: z.array(z.string()) }),
            ),
          ),
          ...apiErrorResponses,
        },
      }),
      async (c) => {
        if (!app.container.resolve(demoModeServiceToken).enabled)
          throw new ApiError({
            status: 'NOT_FOUND',
            reason: 'DEMO_MODE_DISABLED',
            domain: 'demoMode',
            message: 'Demo mode is disabled.',
          });
        return c.json({ data: await demoAccountRoles(app) });
      },
    );
    return new Hono().route('/', router);
  }),
];
