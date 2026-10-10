import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type ApiErrorStatus,
  type AppApiRouteContribution,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { AuthorizationDeniedError } from '@nocobase/authorization/core';
import type { RepositoryPolicy } from '@nocobase/db';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import {
  EMPLOYEES_SETTINGS,
  employeeModuleService,
  employeeServiceToken,
} from '../../providers/employees/index.js';
import {
  EMPLOYEE_ERROR_FIELDS,
  EmployeeError,
  type EmployeeErrorCode,
} from '../../providers/employees/errors.js';
import {
  CorrectStatusInput,
  CreateEmployeeInput,
  DirectoryEntrySchema,
  Employee,
  EmployeeCompensation,
  EmployeeHistory,
  EmployeeParams,
  EmployeeProfile,
  ListDirectoryQuery,
  ListEmployeesQuery,
  PageMeta,
  UpdateEmployeeInput,
  UpdateProfileInput,
} from './schemas.js';

const DOMAIN = 'employees';

type Granted = { action: string; policy: RepositoryPolicy };
type EmployeesEnv = AuthorizationEnv &
  AuthEnv & { Variables: { granted: Granted } };

const STATUS: Record<EmployeeErrorCode, ApiErrorStatus> = {
  EMPLOYEE_NOT_FOUND: 'NOT_FOUND',
  EMPLOYEE_USER_NOT_FOUND: 'INVALID_ARGUMENT',
  EMPLOYEE_USER_DISABLED: 'INVALID_ARGUMENT',
  EMPLOYEE_USER_TAKEN: 'ALREADY_EXISTS',
  EMPLOYEE_CODE_TAKEN: 'ALREADY_EXISTS',
  EMPLOYEE_MANAGER_NOT_FOUND: 'INVALID_ARGUMENT',
  EMPLOYEE_MANAGER_INACTIVE: 'INVALID_ARGUMENT',
  EMPLOYEE_MANAGER_CYCLE: 'INVALID_ARGUMENT',
  EMPLOYEE_POSITION_NOT_FOUND: 'INVALID_ARGUMENT',
  EMPLOYEE_GRADE_NOT_FOUND: 'INVALID_ARGUMENT',
  EMPLOYEE_STATUS_UNCHANGED: 'FAILED_PRECONDITION',
  EMPLOYEE_HISTORY_SALARY: 'INVALID_ARGUMENT',
  EMPLOYEE_INVALID_AMOUNT: 'INVALID_ARGUMENT',
};

function toApiError(error: EmployeeError): ApiError {
  const field = EMPLOYEE_ERROR_FIELDS[error.code];
  return new ApiError({
    status: STATUS[error.code],
    reason: error.code,
    domain: DOMAIN,
    message: error.message,
    ...(field && STATUS[error.code] === 'INVALID_ARGUMENT'
      ? { fieldViolations: [{ field, description: error.message }] }
      : {}),
  });
}

const forbidden = (): ApiError =>
  new ApiError({
    status: 'PERMISSION_DENIED',
    reason: 'EMPLOYEE_ACCESS_DENIED',
    domain: DOMAIN,
    message: 'This employee record is not accessible.',
  });

/** A sub-router whose every route authenticates and initialises authorization itself. */
function createRouter(app: Application): Hono<EmployeesEnv> {
  const auth = app.container.resolve(authenticationToken);
  const authz = app.container.resolve(authorizationToken);
  const router = new Hono<EmployeesEnv>();
  router.use('*', auth.required(), authz.middleware());
  router.onError((error, c) =>
    apiErrorHandler(
      error instanceof EmployeeError ? toApiError(error) : error,
      c,
    ),
  );
  return router;
}

/** Requires `settings:oa.employees` `read` before the request is looked at. */
const archivePage: MiddlewareHandler<EmployeesEnv> = async (c, next) => {
  await c.get('authz').require({
    resource: { type: 'settings', id: EMPLOYEES_SETTINGS },
    action: 'read',
  });
  await next();
};

/**
 * Authorizes the first of `actions` the caller holds on the composite and keeps its policy for `collection`. Runs
 * before validation, so a caller holding none of them is answered 403 whatever the request holds.
 */
function grant(
  resource: string,
  actions: readonly string[],
  collection: string,
): MiddlewareHandler<EmployeesEnv> {
  return async (c, next) => {
    let lastDecision;
    for (const action of actions) {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: resource },
        action,
      });
      const policy = (
        decision.conditions?.database as
          Record<string, RepositoryPolicy | false | undefined> | undefined
      )?.[collection];
      if (decision.effect !== 'deny' && policy) {
        c.set('granted', { action, policy });
        await next();
        return;
      }
      lastDecision = decision;
    }
    throw lastDecision
      ? new AuthorizationDeniedError(lastDecision)
      : forbidden();
  };
}

const actorOf = (c: Context<EmployeesEnv>): string => c.get('auth')!.user.id;

function describeNeeds(...needs: string[]): string {
  return `Requires ${needs.map((need) => `\`${need}\``).join(' and ')}.`;
}

const ARCHIVE_PAGE = `settings:${EMPLOYEES_SETTINGS} read`;
const notFound = apiErrorResponse(
  404,
  'The employee does not exist (`EMPLOYEE_NOT_FOUND`).',
);

function createEmployeeRoutes(app: Application): Hono<EmployeesEnv> {
  const service = employeeModuleService(
    app.container.resolve(employeeServiceToken),
  );
  const routes = createRouter(app);
  const tags = ['Employees'];

  /** 403 when the record exists but the scope hides it, 404 when it does not exist at all. */
  async function missing(id: string): Promise<never> {
    if (await service.exists(id)) throw forbidden();
    throw new EmployeeError(
      'EMPLOYEE_NOT_FOUND',
      `Employee ${id} does not exist.`,
    );
  }

  // ---- the signed-in person's own archive: identity is the permission ----------------------------------------

  routes.get(
    '/me',
    describeRoute({
      tags,
      summary: 'Get my employee archive',
      operationId: 'getMyEmployee',
      description:
        "The signed-in user's own basic archive. Everyone may read their own; no permission set is needed.",
      responses: {
        200: dataResponse(Employee),
        401: apiErrorResponse(401),
        404: apiErrorResponse(
          404,
          'The user has no archive (`EMPLOYEE_NOT_FOUND`).',
        ),
        500: apiErrorResponse(500),
      },
    }),
    async (c) => {
      const view = await service.getOwnView(actorOf(c));
      if (!view)
        throw new EmployeeError(
          'EMPLOYEE_NOT_FOUND',
          'No archive for this user.',
        );
      return c.json({ data: view });
    },
  );

  routes.get(
    '/me/profile',
    describeRoute({
      tags,
      summary: 'Get my controlled employee profile',
      operationId: 'getMyEmployeeProfile',
      description: "The signed-in user's own controlled data.",
      responses: {
        200: dataResponse(EmployeeProfile),
        401: apiErrorResponse(401),
        404: apiErrorResponse(
          404,
          'The user has no archive (`EMPLOYEE_NOT_FOUND`).',
        ),
        500: apiErrorResponse(500),
      },
    }),
    async (c) => {
      const employee = await service.getByUserId(actorOf(c));
      if (!employee)
        throw new EmployeeError(
          'EMPLOYEE_NOT_FOUND',
          'No archive for this user.',
        );
      const profile = (await service.getProfile(employee.id, true)) ?? {
        employeeId: employee.id,
      };
      return c.json({ data: { ...profile, access: 'full' as const } });
    },
  );

  routes.get(
    '/me/compensation',
    describeRoute({
      tags,
      summary: 'List my compensation',
      operationId: 'listMyEmployeeCompensation',
      description:
        "The signed-in user's own compensation rows, newest first. A bounded list: not paged.",
      responses: {
        200: listResponse(EmployeeCompensation),
        401: apiErrorResponse(401),
        404: apiErrorResponse(
          404,
          'The user has no archive (`EMPLOYEE_NOT_FOUND`).',
        ),
        500: apiErrorResponse(500),
      },
    }),
    async (c) => {
      const employee = await service.getByUserId(actorOf(c));
      if (!employee)
        throw new EmployeeError(
          'EMPLOYEE_NOT_FOUND',
          'No archive for this user.',
        );
      const data = await service.listCompensation(employee.id, true);
      return c.json({ data, meta: { total: data.length } });
    },
  );

  // ---- HR archive ----------------------------------------------------------------------------------------------

  routes.get(
    '/',
    archivePage,
    grant('oa.employees.archive', ['view'], 'employees'),
    describeRoute({
      tags,
      summary: 'List employee archives',
      operationId: 'listEmployees',
      description: describeNeeds(
        ARCHIVE_PAGE,
        'composite:oa.employees.archive view',
      ),
      responses: {
        200: listResponse(Employee, PageMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ListEmployeesQuery),
    async (c) => {
      const query = c.req.valid('query');
      const { items, total } = await service.listEmployees(
        query,
        c.get('granted').policy,
      );
      return c.json({
        data: items,
        meta: { page: query.page, pageSize: query.pageSize, total },
      });
    },
  );

  routes.post(
    '/',
    archivePage,
    grant('oa.employees.archive', ['manage'], 'employees'),
    describeRoute({
      tags,
      summary: 'Create an employee archive',
      operationId: 'createEmployee',
      description: describeNeeds(
        ARCHIVE_PAGE,
        'composite:oa.employees.archive manage',
      ),
      responses: {
        201: dataResponse(Employee),
        ...apiErrorResponses,
        409: apiErrorResponse(
          409,
          'The account or the code already has an archive (`EMPLOYEE_USER_TAKEN`, `EMPLOYEE_CODE_TAKEN`).',
        ),
      },
    }),
    apiValidator('json', CreateEmployeeInput),
    async (c) => {
      const data = await service.createEmployee(
        c.req.valid('json'),
        c.get('granted').policy,
        actorOf(c),
      );
      return c.json({ data }, 201);
    },
  );

  routes.get(
    '/:employeeId',
    archivePage,
    grant('oa.employees.archive', ['view'], 'employees'),
    describeRoute({
      tags,
      summary: 'Get an employee archive',
      operationId: 'getEmployee',
      description: describeNeeds(
        ARCHIVE_PAGE,
        'composite:oa.employees.archive view',
      ),
      responses: {
        200: dataResponse(Employee),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', EmployeeParams),
    async (c) => {
      const { employeeId } = c.req.valid('param');
      const view = await service.getEmployeeView(
        employeeId,
        c.get('granted').policy,
      );
      return c.json({ data: view ?? (await missing(employeeId)) });
    },
  );

  routes.patch(
    '/:employeeId',
    archivePage,
    grant('oa.employees.archive', ['manage'], 'employees'),
    describeRoute({
      tags,
      summary: 'Update an employee archive',
      operationId: 'updateEmployee',
      description: `${describeNeeds(ARCHIVE_PAGE, 'composite:oa.employees.archive manage')} Status changes only through flows or the status correction.`,
      responses: {
        200: dataResponse(Employee),
        ...apiErrorResponses,
        404: notFound,
        409: apiErrorResponse(
          409,
          'The code is already used (`EMPLOYEE_CODE_TAKEN`).',
        ),
      },
    }),
    apiValidator('param', EmployeeParams),
    apiValidator('json', UpdateEmployeeInput),
    async (c) => {
      const { employeeId } = c.req.valid('param');
      try {
        const data = await service.updateEmployee(
          employeeId,
          c.req.valid('json'),
          c.get('granted').policy,
          actorOf(c),
        );
        return c.json({ data });
      } catch (error) {
        if (
          error instanceof EmployeeError &&
          error.code === 'EMPLOYEE_NOT_FOUND'
        )
          await missing(employeeId);
        throw error;
      }
    },
  );

  routes.post(
    '/:employeeId/correctStatus',
    archivePage,
    grant('oa.employees.archive', ['correctStatus'], 'employees'),
    describeRoute({
      tags,
      summary: 'Correct an employee status',
      operationId: 'correctEmployeeStatus',
      description: `${describeNeeds(ARCHIVE_PAGE, 'composite:oa.employees.archive correctStatus')} An administrator's data correction with a mandatory reason; audited and recorded in the history.`,
      responses: {
        200: dataResponse(Employee),
        ...apiErrorResponses,
        400: apiErrorResponse(
          400,
          'The correction changes nothing (`EMPLOYEE_STATUS_UNCHANGED`).',
        ),
        404: notFound,
      },
    }),
    apiValidator('param', EmployeeParams),
    apiValidator('json', CorrectStatusInput),
    async (c) => {
      const { employeeId } = c.req.valid('param');
      try {
        const data = await service.correctStatus(
          employeeId,
          c.req.valid('json'),
          c.get('granted').policy,
          actorOf(c),
        );
        return c.json({ data });
      } catch (error) {
        if (
          error instanceof EmployeeError &&
          error.code === 'EMPLOYEE_NOT_FOUND'
        )
          await missing(employeeId);
        throw error;
      }
    },
  );

  routes.get(
    '/:employeeId/profile',
    // Bank-only readers have this business action without access to the archive settings page.
    grant('oa.employees.profile', ['view', 'viewBank'], 'employeeProfiles'),
    describeRoute({
      tags,
      summary: 'Get an employee controlled profile',
      operationId: 'getEmployeeProfile',
      description:
        'Requires `composite:oa.employees.profile view` or `viewBank`; archive settings access is not required. With `viewBank` instead, only the bank fields are returned (`access: bank`).',
      responses: {
        200: dataResponse(EmployeeProfile),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', EmployeeParams),
    async (c) => {
      const { employeeId } = c.req.valid('param');
      const { action, policy } = c.get('granted');
      const profile = await service.getProfile(employeeId, policy);
      if (!profile) return missing(employeeId);
      return c.json({
        data: {
          ...profile,
          access: action === 'view' ? 'full' : 'bank',
        } as const,
      });
    },
  );

  routes.patch(
    '/:employeeId/profile',
    archivePage,
    grant('oa.employees.profile', ['update'], 'employeeProfiles'),
    describeRoute({
      tags,
      summary: 'Update an employee controlled profile',
      operationId: 'updateEmployeeProfile',
      description: `${describeNeeds(ARCHIVE_PAGE, 'composite:oa.employees.profile update')} Audited with identity and bank numbers masked.`,
      responses: {
        200: dataResponse(EmployeeProfile),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', EmployeeParams),
    apiValidator('json', UpdateProfileInput),
    async (c) => {
      const { employeeId } = c.req.valid('param');
      try {
        const profile = await service.updateProfile(
          employeeId,
          c.req.valid('json'),
          c.get('granted').policy,
          actorOf(c),
        );
        return c.json({ data: { ...profile, access: 'full' as const } });
      } catch (error) {
        if (
          error instanceof EmployeeError &&
          error.code === 'EMPLOYEE_NOT_FOUND'
        )
          await missing(employeeId);
        throw error;
      }
    },
  );

  routes.get(
    '/:employeeId/compensation',
    archivePage,
    grant('oa.employees.compensation', ['view'], 'employeeCompensation'),
    describeRoute({
      tags,
      summary: 'List an employee compensation',
      operationId: 'listEmployeeCompensation',
      description: `${describeNeeds(ARCHIVE_PAGE, 'composite:oa.employees.compensation view')} Newest first; a bounded list, not paged.`,
      responses: {
        200: listResponse(EmployeeCompensation),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', EmployeeParams),
    async (c) => {
      const { employeeId } = c.req.valid('param');
      if (!(await service.exists(employeeId))) await missing(employeeId);
      const data = await service.listCompensation(
        employeeId,
        c.get('granted').policy,
      );
      return c.json({ data, meta: { total: data.length } });
    },
  );

  routes.get(
    '/:employeeId/history',
    archivePage,
    grant('oa.employees.archive', ['view'], 'employees'),
    describeRoute({
      tags,
      summary: 'List an employee change history',
      operationId: 'listEmployeeHistory',
      description: `${describeNeeds(ARCHIVE_PAGE, 'composite:oa.employees.archive view')} Readable with the archive itself: the employee must be within the caller's archive scope. History never carries salary amounts. Newest first; a bounded list, not paged.`,
      responses: {
        200: listResponse(EmployeeHistory),
        ...apiErrorResponses,
        404: notFound,
      },
    }),
    apiValidator('param', EmployeeParams),
    async (c) => {
      const { employeeId } = c.req.valid('param');
      const visible = await service.getEmployeeView(
        employeeId,
        c.get('granted').policy,
      );
      if (!visible) await missing(employeeId);
      const data = await service.listHistory(employeeId);
      return c.json({ data, meta: { total: data.length } });
    },
  );

  return routes;
}

function createDirectoryRoutes(app: Application): Hono<EmployeesEnv> {
  const service = employeeModuleService(
    app.container.resolve(employeeServiceToken),
  );
  const routes = createRouter(app);

  routes.get(
    '/',
    grant('oa.employees.directory', ['view'], 'employees'),
    describeRoute({
      tags: ['Directory'],
      summary: 'List the company directory',
      operationId: 'listDirectory',
      description:
        "Requires `composite:oa.employees.directory view`. Active employees with their primary department, position and manager. Phone and email appear only on the people the caller's `viewContact` scope reaches.",
      responses: {
        200: listResponse(DirectoryEntrySchema, PageMeta),
        ...apiErrorResponses,
      },
    }),
    apiValidator('query', ListDirectoryQuery),
    async (c) => {
      const query = c.req.valid('query');
      const contact = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.employees.directory' },
        action: 'viewContact',
      });
      const contactPolicy =
        contact.effect === 'deny'
          ? false
          : ((
              contact.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.employees ?? false);
      const { items, total } = await service.listDirectory(
        query,
        c.get('granted').policy,
        contactPolicy,
      );
      return c.json({
        data: items,
        meta: { page: query.page, pageSize: query.pageSize, total },
      });
    },
  );

  return routes;
}

const employeesApiRoutes: AppApiRouteContribution<Application> =
  defineApiRoutes((app) => {
    const router = new Hono();
    router.route('/employees', createEmployeeRoutes(app));
    router.route('/directory', createDirectoryRoutes(app));
    return router;
  });

/** HTTP routes of the `employees` OA module, registered through `server/routes/index.ts`. */
const employeesRoutes: readonly AppRouteContribution<Application>[] = [
  employeesApiRoutes,
];

export default employeesRoutes;
