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

import { ORG_SETTINGS, OrgError } from '../../providers/org/index.js';
import type { Department as DepartmentRecord } from '../../providers/org/contract.js';
import {
  AddMemberInput,
  CreateDepartmentInput,
  Department,
  DepartmentMember,
  DepartmentMemberParams,
  DepartmentOption,
  DepartmentParams,
  OptionsQuery,
  UpdateDepartmentInput,
  type DepartmentBody,
  type DepartmentMemberBody,
} from './schemas.js';
import {
  createOrgRouter,
  defined,
  describeSettings,
  notFound,
  orgRouteServices,
  requireSettings,
  type OrgEnv,
} from './shared.js';

const tags = ['Departments'];
const ITEM = ORG_SETTINGS.departments;
const READ = describeSettings(ITEM, 'read');
const UPDATE = describeSettings(ITEM, 'update');
const departmentNotFound = notFound(
  'The department does not exist (`DEPARTMENT_NOT_FOUND`).',
);
const memberNotFound = notFound(
  'The department does not exist (`DEPARTMENT_NOT_FOUND`), or the user is not its active member (`MEMBER_NOT_FOUND`).',
);

/** The department tree, its memberships and the department picker, mounted at `/departments`. */
export function createDepartmentRoutes(app: Application): Hono<OrgEnv> {
  const services = orgRouteServices(app);
  const { organization } = services;
  const routes = createOrgRouter(app);
  const read = requireSettings(ITEM, 'read');
  const update = requireSettings(ITEM, 'update');

  async function views(
    departments: readonly DepartmentRecord[],
  ): Promise<DepartmentBody[]> {
    const [users, counts] = await Promise.all([
      services.resolveUsers(
        departments.flatMap((department) => [
          department.managerId,
          department.executiveId,
        ]),
      ),
      organization.memberCounts(),
    ]);
    return departments.map((department) => ({
      ...department,
      manager: services.userOf(users, department.managerId),
      executive: services.userOf(users, department.executiveId),
      memberCount: counts.get(department.id) ?? 0,
    }));
  }

  async function view(department: DepartmentRecord): Promise<DepartmentBody> {
    const [result] = await views([department]);
    if (!result) throw new Error('A department view is missing.');
    return result;
  }

  async function members(
    departmentId: string,
  ): Promise<DepartmentMemberBody[]> {
    const rows = await organization.directMembers(departmentId);
    const users = await services.resolveUsers(rows.map((row) => row.userId));
    return rows.map((row) => ({
      userId: row.userId,
      primary: row.primary,
      user: services.userOf(users, row.userId) ?? {
        id: row.userId,
        name: row.userId,
      },
    }));
  }

  // Fixed segments before `/:departmentId`.
  routes.get(
    '/options',
    describeRoute({
      tags,
      summary: 'List department options',
      operationId: 'listDepartmentOptions',
      description:
        'The department tree for pickers in any form: every effectively active department (with `includeInactive=true`, every department), by sort order. Open to every signed-in user, because the organisation tree is directory information every employee sees in the address book; it carries no heads, executives or members. A bounded list: not paged, answers `meta.total`.',
      responses: {
        200: listResponse(DepartmentOption),
        401: apiErrorResponse(401),
        500: apiErrorResponse(500),
      },
    }),
    apiValidator('query', OptionsQuery),
    async (c) => {
      const { includeInactive } = c.req.valid('query');
      const tree = await organization.listTree();
      const active = new Set(
        await organization.filterActive(tree.map((node) => node.id)),
      );
      const data = tree
        .filter((node) => includeInactive || active.has(node.id))
        .map((node) => ({
          id: node.id,
          title: node.title,
          code: node.code,
          parentId: node.parentId,
          active: active.has(node.id),
        }));
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.get(
    '/',
    read,
    describeRoute({
      tags,
      summary: 'List departments',
      operationId: 'listDepartments',
      description: `Every department, active or not, ordered by \`sortOrder\` and then title, with its head, executive and member count. A bounded list: not paged, answers \`meta.total\`. ${READ}`,
      responses: { 200: listResponse(Department), ...apiErrorResponses },
    }),
    async (c) => {
      const data = await views(await organization.listTree());
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.post(
    '/',
    update,
    describeRoute({
      tags,
      summary: 'Create a department',
      operationId: 'createDepartment',
      description: `Records an audit entry. ${UPDATE}`,
      responses: {
        201: dataResponse(Department, 'The created department.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The parent does not exist (`PARENT_NOT_FOUND`), or the head or executive is not an enabled user (`USER_NOT_FOUND`).',
        ),
        409: apiErrorResponse(
          409,
          'The code is already used (`DEPARTMENT_CODE_EXISTS`).',
        ),
      },
    }),
    apiValidator('json', CreateDepartmentInput),
    async (c) => {
      const department = await organization.createDepartment(
        defined(c.req.valid('json')),
        services.actor(c),
      );
      return c.json({ data: await view(department) }, 201);
    },
  );

  routes.get(
    '/:departmentId',
    read,
    describeRoute({
      tags,
      summary: 'Get a department',
      operationId: 'getDepartment',
      description: READ,
      responses: {
        200: dataResponse(Department),
        ...apiErrorResponses,
        404: departmentNotFound,
      },
    }),
    apiValidator('param', DepartmentParams),
    async (c) => {
      const { departmentId } = c.req.valid('param');
      const department = await organization.getDepartment(departmentId);
      if (!department)
        throw new OrgError(
          'DEPARTMENT_NOT_FOUND',
          `Department "${departmentId}" does not exist.`,
        );
      return c.json({ data: await view(department) });
    },
  );

  routes.patch(
    '/:departmentId',
    update,
    describeRoute({
      tags,
      summary: 'Update or move a department',
      operationId: 'updateDepartment',
      description: `Changes only the fields the body names; \`parentId\` moves the department, and \`null\` clears a code, parent, head or executive. Members and heads whose inherited access moved are told to refresh their permissions. Records an audit entry. ${UPDATE}`,
      responses: {
        200: dataResponse(Department),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The parent does not exist (`PARENT_NOT_FOUND`) or lies below the department (`PARENT_CYCLE`), or the head or executive is not an enabled user (`USER_NOT_FOUND`).',
        ),
        404: departmentNotFound,
        409: apiErrorResponse(
          409,
          'The code is already used (`DEPARTMENT_CODE_EXISTS`).',
        ),
      },
    }),
    apiValidator('param', DepartmentParams),
    apiValidator('json', UpdateDepartmentInput),
    async (c) => {
      const department = await organization.updateDepartment(
        c.req.valid('param').departmentId,
        defined(c.req.valid('json')),
        services.actor(c),
      );
      return c.json({ data: await view(department) });
    },
  );

  // Enabling is a custom method rather than a field update: it changes whose inherited access applies across the
  // whole subtree.
  for (const [verb, active, name] of [
    ['enable', true, 'Enable'],
    ['disable', false, 'Disable'],
  ] as const) {
    routes.post(
      `/:departmentId/${verb}`,
      update,
      describeRoute({
        tags,
        summary: `${name} a department`,
        operationId: `${verb}Department`,
        description: `${
          active
            ? 'Its members and subtree count again, unless an ancestor is still disabled.'
            : 'The department and its whole subtree stop counting: members lose inherited access, heads lose the head subject, and pickers no longer offer them. Child rows are not rewritten.'
        } Records an audit entry. ${UPDATE}`,
        responses: {
          200: dataResponse(Department),
          ...apiErrorResponses,
          404: departmentNotFound,
        },
      }),
      apiValidator('param', DepartmentParams),
      async (c) => {
        const department = await organization.setDepartmentActive(
          c.req.valid('param').departmentId,
          active,
          services.actor(c),
        );
        return c.json({ data: await view(department) });
      },
    );
  }

  routes.get(
    '/:departmentId/members',
    read,
    describeRoute({
      tags,
      summary: 'List department members',
      operationId: 'listDepartmentMembers',
      description: `The department's active direct members, the primary ones first. A bounded list: not paged, answers \`meta.total\`. ${READ}`,
      responses: {
        200: listResponse(DepartmentMember),
        ...apiErrorResponses,
        404: departmentNotFound,
      },
    }),
    apiValidator('param', DepartmentParams),
    async (c) => {
      const data = await members(c.req.valid('param').departmentId);
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.post(
    '/:departmentId/members',
    update,
    describeRoute({
      tags,
      summary: 'Add a department member',
      operationId: 'addDepartmentMember',
      description: `Adds the user, or re-activates or updates an existing membership. A user has at most one active primary department: making this one primary clears the others. Records an audit entry. ${UPDATE}`,
      responses: {
        201: dataResponse(DepartmentMember, 'The membership.'),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The user is not enabled (`USER_NOT_FOUND`), or this write would change an initialized headcount roster (`HEADCOUNT_ROSTER_DRIFT`).',
        ),
        404: departmentNotFound,
      },
    }),
    apiValidator('param', DepartmentParams),
    apiValidator('json', AddMemberInput),
    async (c) => {
      const { departmentId } = c.req.valid('param');
      const input = c.req.valid('json');
      await organization.manageMember(
        { action: 'add', departmentId, ...defined(input) },
        services.actor(c),
      );
      const member = (await members(departmentId)).find(
        (row) => row.userId === input.userId,
      );
      return c.json({ data: member }, 201);
    },
  );

  routes.delete(
    '/:departmentId/members/:userId',
    update,
    describeRoute({
      tags,
      summary: 'Remove a department member',
      operationId: 'removeDepartmentMember',
      description: `Deactivates the membership; the row is kept for history. Records an audit entry. ${UPDATE}`,
      responses: {
        204: emptyResponse('The member was removed.'),
        400: apiErrorResponse(
          400,
          'The initialized roster cannot be changed without a business source (`HEADCOUNT_ROSTER_DRIFT`).',
        ),
        ...apiErrorResponses,
        404: memberNotFound,
      },
    }),
    apiValidator('param', DepartmentMemberParams),
    async (c) => {
      const { departmentId, userId } = c.req.valid('param');
      await organization.manageMember(
        { action: 'remove', departmentId, userId },
        services.actor(c),
      );
      return c.body(null, 204);
    },
  );

  routes.post(
    '/:departmentId/members/:userId/makePrimary',
    update,
    describeRoute({
      tags,
      summary: "Make a member's primary department",
      operationId: 'makeDepartmentMemberPrimary',
      description: `Makes this department the user's primary one, replacing any other. Approvals resolve the head, executive and budget from the primary department. Records an audit entry. ${UPDATE}`,
      responses: {
        200: dataResponse(DepartmentMember),
        400: apiErrorResponse(
          400,
          'The initialized roster cannot be changed without a business source (`HEADCOUNT_ROSTER_DRIFT`).',
        ),
        ...apiErrorResponses,
        404: memberNotFound,
      },
    }),
    apiValidator('param', DepartmentMemberParams),
    async (c) => {
      const { departmentId, userId } = c.req.valid('param');
      await organization.manageMember(
        { action: 'makePrimary', departmentId, userId },
        services.actor(c),
      );
      const member = (await members(departmentId)).find(
        (row) => row.userId === userId,
      );
      return c.json({ data: member });
    },
  );

  return routes;
}
