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
  defineApiRoutes,
  describeRoute,
  apiValidator,
  dataResponse,
  apiErrorResponse,
  apiErrorResponses,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import { z } from 'zod';
import { Hono, type Context } from 'hono';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { SupplyError } from '../../providers/supplies/errors.js';
import { supplyServiceToken } from '../../providers/supplies/index.js';
import {
  ActionInput,
  ActionCandidates,
  CreateSupply,
  SupplyInput,
  SupplyParams,
  ListQuery,
  TransitionInput,
  Result,
  Detail,
  List,
  ActionResult,
} from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(supplyServiceToken);
    router.use(
      '/supplyRequests',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/supplyRequests/*',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError((error, c) => {
      if (error instanceof SupplyError)
        return apiErrorHandler(
          new ApiError({
            status:
              error instanceof SupplyError && error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error instanceof SupplyError && error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'supply',
            message: error.message,
          }),
          c,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'supply' }) : error,
          c,
        );
      }
      if (
        error instanceof ApprovalError &&
        ['INTERNAL', 'INVALID_EFFECT'].includes(error.code)
      )
        return apiErrorHandler(error, c);
      if (error instanceof ApprovalError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.code === 'TASK_NOT_FOUND'
                ? 'NOT_FOUND'
                : error.code === 'CONFLICT'
                  ? 'ABORTED'
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
            domain: 'supply',
            reason: error.code,
            message: error.message,
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    async function actionPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
      action: string,
    ): Promise<RepositoryPolicy> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.supplies' },
        action,
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.supplyRequests;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'supply',
          reason: 'SUPPLY_ACTION_DENIED',
          message: 'No grant allows this supply business action.',
        });
      return policy;
    }
    async function readPolicy(
      c: Context<AuthEnv & AuthorizationEnv>,
    ): Promise<RepositoryPolicy | undefined> {
      const decision = await c.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.supplies' },
        action: 'view',
      });
      const policy =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.supplyRequests || undefined;
      if (!policy)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'supply',
          reason: 'SUPPLY_ACCESS_DENIED',
          message: 'No supply reading permission is granted.',
        });
      const id = c.req.param('id');
      if (id) {
        const row = await app.container
          .resolve(databaseManagerToken)
          .repository('supplyRequests')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!row)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'supply',
            reason: 'SUPPLY_ACCESS_DENIED',
            message: 'This supply request is outside the granted scope.',
          });
        const required = [
          'id',
          'applicantId',
          'createdById',
          'number',
          'items',
          'purpose',
          'itemSnapshot',
          'approvedFingerprint',
          'approvedAt',
          'issuedById',
          'forcedClosed',
          'ruleSnapshot',
          'hrRecipients',
          'managerApproverId',
          'status',
          'lifecycleVersion',
          'createdAt',
        ];
        if (required.some((field) => !(field in row)))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'supply',
            reason: 'SUPPLY_FIELDS_RESTRICTED',
            message: 'Approval details require all reviewed business fields.',
          });
      }
      return policy;
    }
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType = Result,
    ) =>
      describeRoute({
        tags: ['Supply'],
        operationId,
        summary,
        responses: {
          '200': dataResponse(schema),
          ...apiErrorResponses,
          '404': apiErrorResponse(404),
          '409': apiErrorResponse(409),
          '400': apiErrorResponse(400),
        },
      });
    router.get(
      '/supplyRequests/ledger',
      doc('supplyIssueLedger', 'Read issued supplies ledger', z.json()),
      apiValidator(
        'query',
        z.strictObject({
          offset: z.coerce.number().int().min(0).default(0),
          limit: z.coerce.number().int().min(1).max(100).default(20),
          applicationId: z.string().min(1).max(64).optional(),
          entryId: z.string().min(1).max(64).optional(),
          sortBy: z
            .enum([
              'createdAt',
              'number',
              'itemCode',
              'requestedQuantity',
              'actualQuantity',
            ])
            .default('createdAt'),
          direction: z.enum(['asc', 'desc']).default('desc'),
          page: z.coerce.number().int().min(1).optional(),
          pageSize: z.coerce.number().int().min(1).max(100).optional(),
        }),
      ),
      async (c) => {
        const decision = await c.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.supplies' },
          action: 'ledger',
        });
        const policy =
          decision.effect === 'deny'
            ? undefined
            : (
                decision.conditions?.database as
                  | Record<string, RepositoryPolicy | false | undefined>
                  | undefined
              )?.supplyIssueLedger;
        if (!policy)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'supply',
            reason: 'SUPPLY_LEDGER_DENIED',
            message: 'A supplies ledger grant is required.',
          });
        const query = c.req.valid('query');
        const limit = query.pageSize ?? query.limit;
        const offset = query.page ? (query.page - 1) * limit : query.offset;
        const { meta, ...data } = await service.ledger(
          { ...query, offset, limit },
          policy,
        );
        return c.json({ data, meta });
      },
    );
    router.get(
      '/supplyRequests/options',
      doc(
        'supplyRequestsOptions',
        'Application calendar zone',
        z.strictObject({
          timeZone: z.string(),
          officeItems: z.array(
            z.object({
              code: z.string(),
              label: z.record(z.string(), z.string()),
              active: z.boolean(),
              extra: z.object({ requiresPrintInfo: z.boolean() }),
            }),
          ),
        }),
      ),
      async (c) => {
        const grant = await c
          .get('authz')
          .authorize({
            resource: { type: 'composite', id: 'oa.supplies' },
            action: 'submit',
          });
        if (grant.effect === 'deny') await readPolicy(c);
        return c.json({ data: await service.options() });
      },
    );
    router.get(
      '/supplyRequests',
      doc(
        'listSupplyRequests',
        'List my supply requests and approval work',
        List,
      ),
      apiValidator('query', ListQuery),
      async (c) =>
        c.json({
          data: await service.list(
            c.get('auth')!.user.id,
            c.req.valid('query').view,
            await readPolicy(c),
          ),
        }),
    );
    router.post(
      '/supplyRequests',
      doc('createSupplyRequest', 'Create a supply draft'),
      apiValidator('json', CreateSupply),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        const policy = await actionPolicy(c, 'submit');
        return c.json({
          data: await service.create(input, actorId, actorId, policy),
        });
      },
    );
    router.get(
      '/supplyRequests/:id',
      doc(
        'getSupplyRequest',
        'Get supply content, stages and offered actions',
        Detail,
      ),
      apiValidator('param', SupplyParams),
      async (c) =>
        c.json({
          data: await service.detail(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await readPolicy(c),
          ),
        }),
    );
    router.post(
      '/supplyRequests/:id/transition',
      doc(
        'transitionSupplyRequest',
        'Edit, submit, withdraw or terminate a supply request',
      ),
      apiValidator('param', SupplyParams),
      apiValidator('json', TransitionInput),
      async (c) => {
        const input = c.req.valid('json');
        const actorId = c.get('auth')!.user.id;
        let mutationPolicy: RepositoryPolicy | undefined;
        if (['submit', 'edit', 'withdraw'].includes(input.transition)) {
          const detail = await service.detail(
            c.req.valid('param').id,
            actorId,
            await readPolicy(c),
          );
          mutationPolicy = await actionPolicy(
            c,
            detail.record.applicantId === actorId ? 'submit' : 'delegate',
          );
        }
        if (input.transition === 'edit') {
          const parsed = SupplyInput.safeParse(input.input);
          if (!parsed.success)
            throw new ApiError({
              status: 'INVALID_ARGUMENT',
              domain: 'supply',
              reason: 'SUPPLY_INVALID_INPUT',
              message: 'The supply form is invalid.',
            });
          input.input = parsed.data;
        }
        return c.json({
          data: await service.transition(
            c.req.valid('param').id,
            input.transition,
            c.get('auth')!.user.id,
            input.version,
            input.requestId,
            input.input,
            await readPolicy(c),
            mutationPolicy,
          ),
        });
      },
    );
    router.post(
      '/supplyRequests/:id/action',
      doc(
        'performSupplyAction',
        'Perform an offered supply approval action',
        ActionResult,
      ),
      apiValidator('param', SupplyParams),
      apiValidator('json', ActionInput),
      async (c) =>
        c.json({
          data: await service.action(
            c.req.valid('param').id,
            c.req.valid('json'),
            c.get('auth')!.user.id,
            await readPolicy(c),
          ),
        }),
    );
    router.get(
      '/supplyRequests/:id/candidates',
      doc(
        'supplyActionCandidates',
        'Eligible recipients for an approval action',
        ActionCandidates,
      ),
      apiValidator('param', SupplyParams),
      apiValidator(
        'query',
        z.strictObject({
          taskId: z.string().min(1),
          action: z.enum(['transfer', 'addSigner']),
          search: z.string().max(200).optional(),
          offset: z.coerce.number().int().nonnegative().default(0),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        }),
      ),
      async (c) => {
        const { taskId, action, ...query } = c.req.valid('query');
        return c.json({
          data: await service.candidates(
            c.req.valid('param').id,
            taskId,
            action,
            c.get('auth')!.user.id,
            query,
            await readPolicy(c),
          ),
        });
      },
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
];
export default routes;
