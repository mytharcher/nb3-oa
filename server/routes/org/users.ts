import type { Application } from '@nocobase/app-server/application';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import {
  ApiError,
  apiValidator,
  describeRoute,
  dataResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import { z } from 'zod';
import { ORG_SETTINGS } from '../../providers/org/index.js';
import {
  createOrgRouter,
  orgRouteServices,
  requireSettings,
} from './shared.js';
import { organizationOf } from './user-organization.js';

const Params = z.object({ userId: z.string().trim().min(1).max(64) });
const Query = z.object({
  role: z.string().trim().min(1).max(200),
  search: z.string().max(500).optional(),
  status: z.enum(['enabled', 'disabled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const Account = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().optional(),
  email: z.string(),
  emailVerified: z.boolean(),
  disabledAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const Organization = z.object({
  state: z.enum(['unassigned', 'active', 'inactive-chain', 'invalid-chain']),
  primaryDepartment: z
    .object({
      id: z.string(),
      title: z.string().nullable(),
      path: z.array(
        z.object({ id: z.string(), title: z.string(), active: z.boolean() }),
      ),
    })
    .nullable(),
  inactiveDepartmentIds: z.array(z.string()),
});
const Roles = z.object({
  userId: z.string(),
  disabledAt: z.string().nullable(),
  roles: z.array(
    z.object({
      code: z.string(),
      title: z.unknown(),
      active: z.boolean(),
      assigned: z.boolean(),
    }),
  ),
});

export function createOrgUserRoutes(app: Application) {
  const routes = createOrgRouter(app);
  const { organization } = orgRouteServices(app);
  const users = app.container.resolve(userAdministrationServiceToken);
  routes.use('*', async (c, next) => {
    await c
      .get('authz')
      .require({ resource: { type: 'user', id: '*' }, action: 'read' });
    await next();
  });
  async function account(id: string) {
    const user = await users.get(id);
    if (!user)
      throw new ApiError({
        status: 'NOT_FOUND',
        domain: 'org',
        reason: 'USER_NOT_FOUND',
        message: 'Account not found.',
      });
    return user;
  }
  routes.get(
    '/',
    requireSettings(ORG_SETTINGS.dutyRoles, 'read'),
    describeRoute({
      tags: ['Org'],
      summary: 'Page users by configured duty role (at most 500 members)',
      responses: {
        200: dataResponse(
          z.object({
            items: z.array(Account),
            total: z.number(),
            page: z.number(),
            pageSize: z.number(),
          }),
        ),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', Query),
    async (c) => {
      const { role, ...query } = c.req.valid('query');
      const userIds = await organization.dutyRoleMemberIdsForFilter(role);
      const page = userIds.length
        ? await users.list({ ...query, userIds, sort: 'name', order: 'asc' })
        : { items: [], total: 0, page: query.page, pageSize: query.pageSize };
      return c.json({
        data: {
          ...page,
          items: page.items.map((user) => ({
            id: user.id,
            name: user.name,
            ...(user.username ? { username: user.username } : {}),
            email: user.email,
            emailVerified: user.emailVerified,
            disabledAt: user.disabledAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          })),
        },
      });
    },
  );
  routes.get(
    '/:userId/organization',
    requireSettings(ORG_SETTINGS.departments, 'read'),
    describeRoute({
      tags: ['Org'],
      summary: 'Registered primary department and ancestor validity',
      responses: { 200: dataResponse(Organization), ...apiErrorResponses },
    }),
    apiValidator('param', Params),
    async (c) => {
      const { userId } = c.req.valid('param');
      await account(userId);
      const [memberships, departments] = await Promise.all([
        organization.membershipsOf(userId),
        organization.listTree(),
      ]);
      return c.json({ data: organizationOf(memberships, departments) });
    },
  );
  routes.get(
    '/:userId/duty-roles',
    requireSettings(ORG_SETTINGS.dutyRoles, 'read'),
    describeRoute({
      tags: ['Org'],
      summary: 'Duty role catalog and this user’s configured memberships',
      responses: { 200: dataResponse(Roles), ...apiErrorResponses },
    }),
    apiValidator('param', Params),
    async (c) => {
      const { userId } = c.req.valid('param');
      const user = await account(userId);
      const [roles, assigned] = await Promise.all([
        organization.listDutyRoles(),
        organization.dutyRoleMembershipsOf(userId),
      ]);
      return c.json({
        data: {
          userId,
          disabledAt: user.disabledAt,
          roles: roles.map(({ code, title, active }) => ({
            code,
            title,
            active,
            assigned: assigned.includes(code),
          })),
        },
      });
    },
  );
  return routes;
}
