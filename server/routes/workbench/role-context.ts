import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  apiErrorHandler,
  apiErrorResponse,
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { employeeServiceToken } from '../../providers/employees/contract.js';
import { readWorkbenchTasks } from '../../providers/task-center/workbench.js';
import { Hono } from 'hono';
import { z } from 'zod';
import { orgServiceToken } from '../../providers/org/contract.js';

const groups = {
  hr: ['hr', 'hrbp', 'hrDirector'],
  finance: ['finance', 'financeManager', 'cashier', 'cfo'],
  administration: ['admin', 'sealKeeper', 'it'],
  procurement: ['purchasing', 'legal'],
};
const RoleContext = z.object({
  manager: z.boolean(),
  hr: z.boolean(),
  finance: z.boolean(),
  administration: z.boolean(),
  procurement: z.boolean(),
  teamUserIds: z.array(z.string()),
});
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '/workbench/roleContext',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError(apiErrorHandler);
    router.get(
      '/workbench/roleContext',
      describeRoute({
        tags: ['Workbench'],
        operationId: 'ownWorkbenchRoleContext',
        summary:
          'Current user effective responsibilities and managed team for personal workspace presentation',
        responses: {
          200: dataResponse(RoleContext),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      }),
      async (ctx) => {
        const userId = ctx.get('auth')!.user.id;
        const org = app.container.resolve(orgServiceToken);
        const can = async (
          id: string,
          action: string,
          type: 'composite' | 'page' = 'composite',
        ) =>
          (await ctx.get('authz').authorize({ resource: { type, id }, action }))
            .effect !== 'deny';
        const [
          departments,
          members,
          reports,
          hrAccess,
          financeAccess,
          administrationAccess,
          procurementAccess,
        ] = await Promise.all([
          org.departmentsManagedBy(userId),
          org.dutyRoleMembersByCodes(Object.values(groups).flat()),
          app.container.resolve(employeeServiceToken).reportsOf(userId),
          can('oa.employees.archive', 'manage'),
          can('oa.loan', 'cashRepayment'),
          can('oa.assets', 'manage'),
          can('oa.vendors', 'manage'),
        ]);
        const active = (codes: string[]) =>
          codes.some((code) => members.get(code)?.includes(userId));
        const manager = departments.length > 0 || reports.length > 0;
        const team = new Set([
          ...reports.map((employee) => employee.userId),
          ...(departments.length
            ? await org.primaryMembersOf(departments)
            : []),
        ]);
        // Return only team identities already present in this user's authorized
        // personal task preview, never the complete employee roster.
        const pending =
          manager && (await can('oa.approvals', 'access', 'page'))
            ? (await readWorkbenchTasks(app, userId, 'pending', 100)).data
            : [];
        const teamUserIds = [
          ...new Set(
            pending.map((row) => row.applicantId).filter((id) => team.has(id)),
          ),
        ];
        return ctx.json({
          data: {
            manager,
            hr: active(groups.hr) || hrAccess,
            finance: active(groups.finance) || financeAccess,
            administration:
              active(groups.administration) || administrationAccess,
            procurement: active(groups.procurement) || procurementAccess,
            teamUserIds,
          },
        });
      },
    );
    return new Hono().route('/', router);
  }),
];
