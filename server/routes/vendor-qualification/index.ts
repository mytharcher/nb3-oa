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
import { approvalDirectoryServiceToken } from '../../providers/approval-directory/contract.js';
import { vendorQualificationHttpServiceToken } from '../../providers/vendor-qualification/service.js';
import { VendorQualificationError } from '../../providers/vendor-qualification/errors.js';
import * as S from './schemas.js';
import attachments from './attachments.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<Env>(),
      c = app.container,
      service = c.resolve(vendorQualificationHttpServiceToken),
      db = c.resolve(databaseManagerToken);
    router.use(
      '/vendorQualifications',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    router.use(
      '/vendorQualifications/*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    router.onError((error, ctx) => {
      if (error instanceof VendorQualificationError)
        return apiErrorHandler(
          new ApiError({
            status:
              error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : error.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : error.kind === 'conflict'
                    ? 'ABORTED'
                    : 'FAILED_PRECONDITION',
            domain: 'vendorQualification',
            reason: error.code,
            message: error.message,
          }),
          ctx,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields
            ? new ApiError({ ...fields, domain: 'vendorQualification' })
            : error,
          ctx,
        );
      }
      if (error instanceof ApprovalError)
        return apiErrorHandler(
          new ApiError({
            status: ['CONFLICT', 'REQUEST_REUSED'].includes(error.code)
              ? 'ABORTED'
              : error.code === 'TASK_NOT_FOUND'
                ? 'NOT_FOUND'
                : [
                      'NOT_ASSIGNEE',
                      'INACTIVE',
                      'NOT_ALLOWED',
                      'NOT_QUALIFIED',
                      'NOT_IN_POOL',
                    ].includes(error.code)
                  ? 'PERMISSION_DENIED'
                  : 'FAILED_PRECONDITION',
            domain: 'vendorQualification',
            reason: error.code,
            message: error.message,
          }),
          ctx,
        );
      if (error instanceof z.ZodError)
        return apiErrorHandler(
          new ApiError({
            status: 'INVALID_ARGUMENT',
            domain: 'vendorQualification',
            reason: 'INVALID_INPUT',
            message: 'The supplied business facts are invalid.',
          }),
          ctx,
        );
      return apiErrorHandler(error, ctx);
    });
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType = z.json(),
      list = false,
    ) =>
      describeRoute({
        tags: ['SupplierQualification'],
        operationId,
        summary,
        responses: {
          200: list ? listResponse(schema, S.ListMeta) : dataResponse(schema),
          ...apiErrorResponses,
        },
      });
    async function policy(
      ctx: Context<Env>,
      action: string,
      resource = 'oa.vendorQualification',
      collection = 'vendorQualifications',
    ): Promise<RepositoryPolicy> {
      const decision = await ctx
        .get('authz')
        .authorize({ resource: { type: 'composite', id: resource }, action });
      const policies = decision.conditions?.database as
        Record<string, RepositoryPolicy | false | undefined> | undefined;
      if (decision.effect === 'deny' || !policies?.[collection])
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'vendorQualification',
          reason: 'ACTION_DENIED',
          message: 'This operation is outside your granted scope.',
        });
      return policies[collection];
    }
    async function manage(ctx: Context<Env>) {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.vendorQualification' },
        action: 'manage',
      });
      const directory = await c
        .resolve(approvalDirectoryServiceToken)
        .snapshot();
      if (
        decision.effect === 'deny' ||
        !directory.hasRole(ctx.get('auth')!.user.id, 'approval.admin')
      )
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'vendorQualification',
          reason: 'MANAGE_DENIED',
          message:
            'Explicit configuration permission and the approval administrator duty are required.',
        });
    }
    const actor = (ctx: Context<Env>) => ctx.get('auth')!.user.id;
    router.get(
      '/vendorQualifications/options',
      doc(
        'vendorQualificationOptions',
        'Eligible public supplier identities and qualification categories',
      ),
      async (ctx) => {
        await policy(ctx, 'submit');
        return ctx.json({
          data: await service.options(
            actor(ctx),
            await policy(ctx, 'view', 'oa.vendors', 'vendors'),
          ),
        });
      },
    );
    router.get(
      '/vendorQualifications/configuration',
      doc(
        'vendorQualificationConfiguration',
        'Immutable committee versions and current fixed-person assignments',
      ),
      async (ctx) => {
        await manage(ctx);
        return ctx.json({ data: await service.configurationView() });
      },
    );
    router.get(
      '/vendorQualifications/configuration/candidates',
      doc(
        'vendorQualificationConfigurationCandidates',
        'Eligible active people for a fixed committee or purchasing head seat',
      ),
      apiValidator(
        'query',
        z.object({
          source: z.enum(['purchasing', 'finance', 'technical', 'legal']),
          search: z.string().max(255).optional(),
          offset: z.coerce.number().int().min(0).default(0),
          limit: z.coerce.number().int().min(1).max(100).default(20),
        }),
      ),
      async (ctx) => {
        await manage(ctx);
        const { source, ...query } = ctx.req.valid('query');
        return ctx.json({
          data: await service.configurationCandidates(source, query),
        });
      },
    );
    router.post(
      '/vendorQualifications/configuration/versions',
      doc(
        'publishVendorCommittee',
        'Publish a new immutable committee structure; restart required',
      ),
      apiValidator('json', S.Publish),
      async (ctx) => {
        await manage(ctx);
        return ctx.json({
          data: await db.transaction((tx) =>
            service.configuration.publish(
              { ...ctx.req.valid('json'), actorId: actor(ctx) },
              tx,
            ),
          ),
        });
      },
    );
    router.patch(
      '/vendorQualifications/configuration/assignments',
      doc(
        'assignVendorCommitteeSeat',
        'Audit a fixed seat person change; existing tasks use public reassignment',
      ),
      apiValidator('json', S.Assignment),
      async (ctx) => {
        await manage(ctx);
        return ctx.json({
          data: await db.transaction((tx) =>
            service.configuration.assign(
              { ...ctx.req.valid('json'), actorId: actor(ctx) },
              tx,
            ),
          ),
        });
      },
    );
    router.patch(
      '/vendorQualifications/configuration/removalHead',
      doc(
        'assignVendorRemovalHead',
        'Audit the explicit purchasing removal reviewer',
      ),
      apiValidator('json', S.RemovalHead),
      async (ctx) => {
        await manage(ctx);
        return ctx.json({
          data: await db.transaction((tx) =>
            service.configuration.assignRemovalHead(
              { ...ctx.req.valid('json'), actorId: actor(ctx) },
              tx,
            ),
          ),
        });
      },
    );
    router.get(
      '/vendorQualifications',
      doc(
        'listVendorQualifications',
        'Authorized qualification records with stable server pagination',
        S.Record,
        true,
      ),
      apiValidator('query', S.ListQuery),
      async (ctx) =>
        ctx.json(
          await service.list(
            actor(ctx),
            ctx.req.valid('query'),
            await policy(ctx, 'view'),
          ),
        ),
    );
    router.post(
      '/vendorQualifications',
      doc(
        'createVendorQualification',
        'Idempotently create a public draft; private banking is separate',
      ),
      apiValidator('json', S.Create),
      async (ctx) => {
        const body = ctx.req.valid('json');
        return ctx.json({
          data: await service.create(
            body.input,
            actor(ctx),
            body.requestId,
            await policy(ctx, 'submit'),
          ),
        });
      },
    );
    router.get(
      '/vendorQualifications/:id',
      doc(
        'getVendorQualification',
        'Public proposal and real lifecycle and approval offers',
      ),
      apiValidator('param', S.Params),
      async (ctx) =>
        ctx.json({
          data: await service.detail(
            ctx.req.valid('param').id,
            actor(ctx),
            await policy(ctx, 'view'),
          ),
        }),
    );
    router.post(
      '/vendorQualifications/:id/transition',
      doc(
        'transitionVendorQualification',
        'Guarded revision, submit, withdrawal or administrator recovery',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Transition),
      async (ctx) => {
        const body = ctx.req.valid('json');
        return ctx.json({
          data: await service.transition(
            ctx.req.valid('param').id,
            actor(ctx),
            body.name,
            body.version,
            body.requestId,
            body.input,
            await policy(ctx, 'view'),
            await policy(ctx, 'submit'),
          ),
        });
      },
    );
    router.post(
      '/vendorQualifications/:id/action',
      doc(
        'performVendorQualificationAction',
        'Perform a real offered public SDK action on this record',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Action),
      async (ctx) =>
        ctx.json({
          data: await service.action(
            ctx.req.valid('param').id,
            actor(ctx),
            ctx.req.valid('json'),
            await policy(ctx, 'view'),
          ),
        }),
    );
    router.get(
      '/vendorQualifications/:id/candidates',
      doc(
        'vendorQualificationCandidates',
        'Only eligible fixed-seat public appointment or reassignment candidates',
      ),
      apiValidator('param', S.Params),
      apiValidator('query', S.CandidatesQuery),
      async (ctx) => {
        const q = ctx.req.valid('query');
        return ctx.json({
          data: await service.candidates(
            ctx.req.valid('param').id,
            actor(ctx),
            q.runId ? { runId: q.runId } : { taskId: q.taskId! },
            q.action,
            { search: q.search, offset: q.offset, limit: q.limit },
            await policy(ctx, 'view'),
          ),
        });
      },
    );
    router.get(
      '/vendorQualifications/:id/paymentAccount',
      doc(
        'vendorQualificationPaymentAccount',
        'Protected banking requires both bank and ordinary record policies',
      ),
      apiValidator('param', S.Params),
      async (ctx) =>
        ctx.json({
          data: await service.bankInfo(
            ctx.req.valid('param').id,
            actor(ctx),
            await policy(ctx, 'view'),
            await policy(ctx, 'paymentAccount'),
          ),
        }),
    );
    router.patch(
      '/vendorQualifications/:id/paymentAccount',
      doc(
        'updateVendorQualificationPaymentAccount',
        'Applicant-only draft banking update with audit and two versions',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.BankUpdate),
      async (ctx) =>
        ctx.json({
          data: await service.updateBank(
            ctx.req.valid('param').id,
            actor(ctx),
            ctx.req.valid('json'),
            await policy(ctx, 'view'),
            await policy(ctx, 'updatePaymentAccount'),
          ),
        }),
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
  ...attachments,
];
