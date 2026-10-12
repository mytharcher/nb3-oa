import { Hono, type Context } from 'hono';
import { z } from 'zod';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import { employeeServiceToken } from '../../providers/employees/contract.js';
import { probationServiceToken } from '../../providers/probation/contract.js';
import { ProbationError } from '../../providers/probation/service.js';
import {
  CandidatesQuery,
  CandidatesResult,
  Options,
  Params,
  Create,
  ListQuery,
  Transition,
  Action,
  Record,
  Detail,
  Compensation,
  publicRecordFields,
} from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<Env>();
    const service = app.container.resolve(probationServiceToken);
    const auth = app.container.resolve(authenticationToken).required();
    const authz = app.container.resolve(authorizationToken).middleware();
    router.use('/probationRequests', auth, authz);
    router.use('/probationRequests/*', auth, authz);
    router.onError((error, c) => {
      if (error instanceof ProbationError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            domain: 'probation',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'probation' }) : error,
          c,
        );
      }
      if (error instanceof ApprovalError) {
        if (['INTERNAL', 'INVALID_EFFECT'].includes(error.code))
          return apiErrorHandler(error, c);
        return apiErrorHandler(
          new ApiError({
            status:
              error.code === 'CONFLICT'
                ? 'ABORTED'
                : error.code === 'TASK_NOT_FOUND'
                  ? 'NOT_FOUND'
                  : [
                        'NOT_ASSIGNEE',
                        'INACTIVE',
                        'NOT_ALLOWED',
                        'APPLICANT_NOT_ELIGIBLE',
                        'NOT_QUALIFIED',
                        'NOT_IN_POOL',
                      ].includes(error.code)
                    ? 'PERMISSION_DENIED'
                    : 'FAILED_PRECONDITION',
            domain: 'probation',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      }
      if (error instanceof z.ZodError)
        return apiErrorHandler(
          new ApiError({
            status: 'INVALID_ARGUMENT',
            domain: 'probation',
            reason: 'INVALID_APPROVAL_OUTPUT',
            message: 'The approval output is invalid.',
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType,
      list = false,
    ) =>
      describeRoute({
        tags: ['Probation'],
        operationId,
        summary,
        responses: {
          200: list ? listResponse(schema) : dataResponse(schema),
          ...apiErrorResponses,
        },
      });
    async function policies(c: Context<Env>, action: string) {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.probation' },
        action,
      });
      const database =
        decision.effect === 'deny'
          ? undefined
          : (decision.conditions?.database as
              Record<string, RepositoryPolicy | false | undefined> | undefined);
      if (!database?.probationRequests)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'probation',
          reason: 'PROBATION_ACTION_DENIED',
          message: 'No grant allows this operation.',
        });
      return {
        record: database.probationRequests,
        proposal: database.probationCompensationProposals,
      };
    }
    async function viewPolicy(c: Context<Env>) {
      const { record } = await policies(c, 'view');
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('probationRequests')
          .withPolicy(record)
          .findOne({ filter: { id } });
        if (!row || publicRecordFields.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'probation',
            reason: 'PROBATION_RECORD_DENIED',
            message:
              'The record or required fields are outside the granted scope.',
          });
      }
      return record;
    }
    async function compensationPolicy(c: Context<Env>) {
      const result = await policies(c, 'compensation');
      if (!result.proposal)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'probation',
          reason: 'PROBATION_COMPENSATION_DENIED',
          message: 'No private compensation access is granted.',
        });
      return { record: result.record, proposal: result.proposal };
    }
    router.get(
      '/probationRequests/options',
      doc('probationOptions', 'Get probation form context', Options),
      async (c) => {
        await viewPolicy(c);
        return c.json({ data: await service.options(c.get('auth')!.user.id) });
      },
    );
    router.get(
      '/probationRequests',
      doc(
        'listProbationRequests',
        'List authorized probation records',
        Record,
        true,
      ),
      apiValidator('query', ListQuery),
      async (c) =>
        c.json({
          data: await service.list(
            c.get('auth')!.user.id,
            c.req.valid('query').view,
            await viewPolicy(c),
          ),
        }),
    );
    router.post(
      '/probationRequests',
      describeRoute({
        tags: ['Probation'],
        operationId: 'createProbationRequest',
        summary: 'HR creates a probation evaluation draft',
        responses: { 201: dataResponse(z.json()), ...apiErrorResponses },
      }),
      apiValidator('json', Create),
      async (c) => {
        const actor = c.get('auth')!.user.id,
          input = c.req.valid('json');
        const policy = (await policies(c, 'delegate')).record;
        const employee = await app.container
          .resolve(employeeServiceToken)
          .getById(input.employeeId);
        if (!employee)
          throw new ApiError({
            status: 'NOT_FOUND',
            domain: 'probation',
            reason: 'PROBATION_EMPLOYEE_NOT_FOUND',
            message: 'The employee does not exist.',
          });
        return c.json(
          { data: await service.create(input, actor, employee.userId, policy) },
          201,
        );
      },
    );
    router.get(
      '/probationRequests/:id',
      doc(
        'probationRequestDetail',
        'Read a public probation evaluation',
        Detail,
      ),
      apiValidator('param', Params),
      async (c) =>
        c.json({
          data: await service.detail(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await viewPolicy(c),
          ),
        }),
    );
    router.get(
      '/probationRequests/:id/compensation',
      doc(
        'probationPrivateCompensation',
        'Read separately authorized private compensation',
        Compensation,
      ),
      apiValidator('param', Params),
      async (c) =>
        c.json({
          data: await service.compensation(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await viewPolicy(c),
            await compensationPolicy(c),
          ),
        }),
    );
    router.post(
      '/probationRequests/:id/transition',
      doc(
        'transitionProbationRequest',
        'Apply an offered probation lifecycle transition',
        z.json(),
      ),
      apiValidator('param', Params),
      apiValidator('json', Transition),
      async (c) => {
        const input = c.req.valid('json');
        const write = ['edit', 'submit'].includes(input.transition)
          ? (await policies(c, 'submit')).record
          : undefined;
        return c.json({
          data: await service.transition(
            c.req.valid('param').id,
            input.transition,
            c.get('auth')!.user.id,
            input.version,
            input.requestId,
            input.input,
            await viewPolicy(c),
            write,
          ),
        });
      },
    );
    router.post(
      '/probationRequests/:id/action',
      doc(
        'performProbationAction',
        'Perform an offered approval action; HR compensation is isolated before the SDK',
        z.json(),
      ),
      apiValidator('param', Params),
      apiValidator('json', Action),
      async (c) => {
        const { compensation, ...input } = c.req.valid('json');
        const privatePolicy = compensation
          ? await compensationPolicy(c)
          : undefined;
        return c.json({
          data: await service.action(
            c.req.valid('param').id,
            input,
            c.get('auth')!.user.id,
            await viewPolicy(c),
            compensation,
            privatePolicy,
          ),
        });
      },
    );
    router.get(
      '/probationRequests/:id/candidates',
      doc(
        'probationCandidates',
        'Eligible recipients for a current task or run action',
        CandidatesResult,
      ),
      apiValidator('param', Params),
      apiValidator('query', CandidatesQuery),
      async (c) => {
        const { taskId, runId, action, ...query } = c.req.valid('query');
        return c.json({
          data: await service.candidates(
            c.req.valid('param').id,
            runId ? { runId } : { taskId: taskId! },
            action,
            c.get('auth')!.user.id,
            query,
            await viewPolicy(c),
          ),
        });
      },
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
];
