import type { Application } from '@nocobase/app-server/application';
import {
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  describeRoute,
  emptyResponse,
  listResponse,
} from '@nocobase/app-server/router';
import type { Hono } from 'hono';

import {
  ORG_SETTINGS,
  OrgError,
  type DutyRoleView,
} from '../../providers/org/index.js';
import {
  AddDutyRoleMemberInput,
  DutyRole,
  DutyRoleMember,
  DutyRoleMemberParams,
  DutyRoleParams,
  type DutyRoleBody,
  type DutyRoleMemberBody,
} from './schemas.js';
import {
  createOrgRouter,
  describeSettings,
  notFound,
  orgRouteServices,
  requireSettings,
  type OrgEnv,
} from './shared.js';

const tags = ['DutyRoles'];
const ITEM = ORG_SETTINGS.dutyRoles;
const READ = describeSettings(ITEM, 'read');
const UPDATE = describeSettings(ITEM, 'update');
const roleNotFound = notFound(
  'The duty role does not exist (`DUTY_ROLE_NOT_FOUND`).',
);

/**
 * The duty-role pool (职能角色池), mounted at `/dutyRoles`. Roles are seeded with the codes approval resolution looks
 * up, so they are enabled and disabled rather than created; what a role may do is decided by permission sets
 * assigned to the `org.dutyRole` subject in Settings → Authorization.
 */
export function createDutyRoleRoutes(app: Application): Hono<OrgEnv> {
  const services = orgRouteServices(app);
  const { organization } = services;
  const routes = createOrgRouter(app);
  const read = requireSettings(ITEM, 'read');
  const update = requireSettings(ITEM, 'update');

  async function views(
    roles: readonly DutyRoleView[],
  ): Promise<DutyRoleBody[]> {
    const counts = await organization.dutyRoleMemberCounts();
    return roles.map((role) => ({
      ...role,
      memberCount: counts.get(role.code) ?? 0,
    }));
  }

  async function view(code: string): Promise<DutyRoleBody> {
    const role = await organization.getDutyRole(code);
    if (!role)
      throw new OrgError(
        'DUTY_ROLE_NOT_FOUND',
        `Duty role "${code}" does not exist.`,
      );
    const [result] = await views([role]);
    if (!result) throw new Error('A duty role view is missing.');
    return result;
  }

  async function members(code: string): Promise<DutyRoleMemberBody[]> {
    const ids = await organization.listDutyRoleMembers(code);
    const users = await services.resolveUsers(ids);
    return ids
      .map((userId) => ({
        userId,
        user: services.userOf(users, userId) ?? { id: userId, name: userId },
      }))
      .sort(
        (left, right) =>
          left.user.name.localeCompare(right.user.name) ||
          left.userId.localeCompare(right.userId),
      );
  }

  routes.get(
    '/',
    read,
    describeRoute({
      tags,
      summary: 'List duty roles',
      operationId: 'listDutyRoles',
      description: `Every duty role, active or not, with its member count. A bounded list: not paged, answers \`meta.total\`. ${READ}`,
      responses: { 200: listResponse(DutyRole), ...apiErrorResponses },
    }),
    async (c) => {
      const data = await views(await organization.listDutyRoles());
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.get(
    '/:code',
    read,
    describeRoute({
      tags,
      summary: 'Get a duty role',
      operationId: 'getDutyRole',
      description: READ,
      responses: {
        200: dataResponse(DutyRole),
        ...apiErrorResponses,
        404: roleNotFound,
      },
    }),
    apiValidator('param', DutyRoleParams),
    async (c) => c.json({ data: await view(c.req.valid('param').code) }),
  );

  for (const [verb, active, name] of [
    ['enable', true, 'Enable'],
    ['disable', false, 'Disable'],
  ] as const) {
    routes.post(
      `/:code/${verb}`,
      update,
      describeRoute({
        tags,
        summary: `${name} a duty role`,
        operationId: `${verb}DutyRole`,
        description: `${
          active
            ? 'Its members hold the role again.'
            : 'Its members stop holding the role: approval resolution finds nobody in it and permission sets assigned to it stop applying. Memberships are kept.'
        } Records an audit entry. ${UPDATE}`,
        responses: {
          200: dataResponse(DutyRole),
          ...apiErrorResponses,
          404: roleNotFound,
        },
      }),
      apiValidator('param', DutyRoleParams),
      async (c) => {
        const { code } = c.req.valid('param');
        await organization.setDutyRoleActive(code, active, services.actor(c));
        return c.json({ data: await view(code) });
      },
    );
  }

  routes.get(
    '/:code/members',
    read,
    describeRoute({
      tags,
      summary: 'List duty role members',
      operationId: 'listDutyRoleMembers',
      description: `Active members of the role, by name. A bounded list: not paged, answers \`meta.total\`. ${READ}`,
      responses: {
        200: listResponse(DutyRoleMember),
        ...apiErrorResponses,
        404: roleNotFound,
      },
    }),
    apiValidator('param', DutyRoleParams),
    async (c) => {
      const data = await members(c.req.valid('param').code);
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.post(
    '/:code/members',
    update,
    describeRoute({
      tags,
      summary: 'Add a duty role member',
      operationId: 'addDutyRoleMember',
      description: `Adds the user, or re-activates an earlier membership. Records an audit entry. ${UPDATE}`,
      responses: {
        201: dataResponse(DutyRoleMember, 'The membership.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The user is not an enabled user (`USER_NOT_FOUND`).',
        ),
        404: roleNotFound,
      },
    }),
    apiValidator('param', DutyRoleParams),
    apiValidator('json', AddDutyRoleMemberInput),
    async (c) => {
      const { code } = c.req.valid('param');
      const { userId } = c.req.valid('json');
      await organization.addDutyRoleMember(code, userId, services.actor(c));
      const member = (await members(code)).find((row) => row.userId === userId);
      return c.json({ data: member }, 201);
    },
  );

  routes.delete(
    '/:code/members/:userId',
    update,
    describeRoute({
      tags,
      summary: 'Remove a duty role member',
      operationId: 'removeDutyRoleMember',
      description: `Deactivates the membership; the row is kept for history. Records an audit entry. ${UPDATE}`,
      responses: {
        204: emptyResponse('The member was removed.'),
        ...apiErrorResponses,
        404: notFound(
          'The duty role does not exist (`DUTY_ROLE_NOT_FOUND`), or the user is not its active member (`MEMBER_NOT_FOUND`).',
        ),
      },
    }),
    apiValidator('param', DutyRoleMemberParams),
    async (c) => {
      const { code, userId } = c.req.valid('param');
      await organization.removeDutyRoleMember(code, userId, services.actor(c));
      return c.body(null, 204);
    },
  );

  return routes;
}
