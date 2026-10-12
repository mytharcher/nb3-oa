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
import type { RepositoryPolicy } from '@nocobase/db';
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
import { contractHttpServiceToken } from '../../providers/contracts/service.js';
import { ContractError } from '../../providers/contracts/errors.js';
import * as S from './schemas.js';
import attachments from './attachments.js';
import { localizedContractError } from './localization.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<Env>(),
      c = app.container,
      service = c.resolve(contractHttpServiceToken);
    for (const path of [
      '/contractRequests',
      '/contractRequests/*',
      '/contracts',
      '/contracts/*',
    ])
      router.use(
        path,
        c.resolve(authenticationToken).required(),
        c.resolve(authorizationToken).middleware(),
      );
    router.onError(async (error, ctx) => {
      if (error instanceof ContractError)
        return apiErrorHandler(
          new ApiError({
            status: [
              'CONTRACT_ACCESS_DENIED',
              'CONTRACT_FIELDS_RESTRICTED',
              'CONTRACT_TARGET_MISMATCH',
            ].includes(error.code)
              ? 'PERMISSION_DENIED'
              : [
                    'CONTRACT_IDEMPOTENCY_CONFLICT',
                    'CONTRACT_VERSION_CONFLICT',
                  ].includes(error.code)
                ? 'ABORTED'
                : 'FAILED_PRECONDITION',
            domain: 'contract',
            reason: error.code,
            message: error.message,
            localizedMessage: await localizedContractError(
              app,
              ctx,
              error.code,
              error.message,
            ),
            metadata: { ns: 'nb3-oa', key: `contracts.errors.${error.code}` },
          }),
          ctx,
        );
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'contract' }) : error,
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
                      'NOT_ALLOWED',
                      'NOT_ASSIGNEE',
                      'NOT_QUALIFIED',
                      'NOT_IN_POOL',
                      'INACTIVE',
                    ].includes(error.code)
                  ? 'PERMISSION_DENIED'
                  : 'FAILED_PRECONDITION',
            domain: 'contract',
            reason: error.code,
            message: error.message,
          }),
          ctx,
        );
      if (error instanceof z.ZodError)
        return apiErrorHandler(
          new ApiError({
            status: 'INVALID_ARGUMENT',
            domain: 'contract',
            reason: 'INPUT_INVALID',
            message: 'Contract input is invalid.',
            fieldViolations: error.issues.map((issue) => ({
              field: issue.path.join('.'),
              description: issue.message,
            })),
          }),
          ctx,
        );
      return apiErrorHandler(error, ctx);
    });
    const doc = (
      operationId: string,
      summary: string,
      schema: z.ZodType = S.Data,
      list = false,
    ) =>
      describeRoute({
        tags: ['Contracts'],
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
      resource = 'oa.contract',
      collection = 'contractRequests',
    ): Promise<RepositoryPolicy> {
      const decision = await ctx
        .get('authz')
        .authorize({ resource: { type: 'composite', id: resource }, action });
      const policies = decision.conditions?.database as
        Record<string, RepositoryPolicy | false | undefined> | undefined;
      if (decision.effect === 'deny' || !policies?.[collection])
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'contract',
          reason: 'ACTION_DENIED',
          message: 'This operation is outside your granted scope.',
        });
      return policies[collection];
    }
    const actor = (ctx: Context<Env>) => ctx.get('auth')!.user.id;
    router.get(
      '/contracts',
      doc('contractLedger', 'List readable approved contracts', S.Data, true),
      apiValidator('query', S.LedgerQuery),
      async (ctx) =>
        ctx.json(
          await service.ledgerList(
            ctx.req.valid('query'),
            await policy(ctx, 'ledger', 'oa.contract', 'contracts'),
            await policy(ctx, 'ledger', 'oa.contract', 'contractVersions'),
          ),
        ),
    );
    router.get(
      '/contracts/:id',
      doc(
        'contractLedgerDetail',
        'Read immutable contract versions and current payment quantities',
      ),
      apiValidator('param', S.Params),
      async (ctx) =>
        ctx.json({
          data: await service.ledgerDetail(
            ctx.req.valid('param').id,
            await policy(ctx, 'ledger', 'oa.contract', 'contracts'),
            await policy(ctx, 'ledger', 'oa.contract', 'contractVersions'),
          ),
        }),
    );
    router.get(
      '/contractRequests/options',
      doc(
        'contractOptions',
        'Eligible qualified suppliers, active contract types and readable approved sources',
      ),
      async (ctx) => {
        await policy(ctx, 'submit');
        const vendorPolicy = await policy(ctx, 'view', 'oa.vendors', 'vendors'),
          ledgerPolicy = await policy(
            ctx,
            'ledger',
            'oa.contract',
            'contracts',
          );
        return ctx.json({
          data: await service.options(actor(ctx), vendorPolicy, ledgerPolicy),
        });
      },
    );
    router.get(
      '/contractRequests',
      doc(
        'listContractRequests',
        'List authorized contract applications',
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
      '/contractRequests',
      describeRoute({
        tags: ['Contracts'],
        operationId: 'createContractRequest',
        summary: 'Create an idempotent contract or change draft',
        responses: { 201: dataResponse(S.Data), ...apiErrorResponses },
      }),
      apiValidator('json', S.Create),
      async (ctx) => {
        const body = ctx.req.valid('json');
        return ctx.json(
          {
            data: await service.create(
              body.input,
              actor(ctx),
              body.requestId,
              await policy(ctx, 'submit'),
              body.input.contractId
                ? await policy(ctx, 'ledger', 'oa.contract', 'contracts')
                : undefined,
            ),
          },
          201,
        );
      },
    );
    router.get(
      '/contractRequests/:id',
      doc(
        'contractRequestDetail',
        'Read a contract application and its public approval history',
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
      '/contractRequests/:id/transition',
      doc(
        'transitionContractRequest',
        'Apply a versioned durable contract transition',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Transition),
      async (ctx) => {
        const body = ctx.req.valid('json');
        const writePolicy = await policy(ctx, 'submit');
        return ctx.json({
          data: await service.transition(
            ctx.req.valid('param').id,
            actor(ctx),
            body.name,
            body.input,
            body.requestId,
            body.version,
            await policy(ctx, 'view'),
            writePolicy,
          ),
        });
      },
    );
    router.post(
      '/contractRequests/:id/action',
      doc(
        'actOnContractRequest',
        'Perform an approval action with the displayed content hash',
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
      '/contractRequests/:id/candidates',
      doc(
        'contractApprovalCandidates',
        'Resolve only eligible approval recipients',
      ),
      apiValidator('param', S.Params),
      apiValidator('query', S.Candidates),
      async (ctx) => {
        const q = ctx.req.valid('query');
        return ctx.json({
          data: await service.candidates(
            ctx.req.valid('param').id,
            actor(ctx),
            q.runId ? { runId: q.runId } : { taskId: q.taskId! },
            q.action,
            q,
            await policy(ctx, 'view'),
          ),
        });
      },
    );
    router.post(
      '/contractRequests/:id/historicalEntry',
      doc(
        'registerHistoricalContract',
        'Register a historical legal contract with explicit authorization and immutable audit',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Rebase),
      async (ctx) => {
        const body = ctx.req.valid('json');
        return ctx.json({
          data: await service.historicalEntry(
            ctx.req.valid('param').id,
            actor(ctx),
            body.requestId,
            body.version,
            await policy(ctx, 'view'),
            await policy(ctx, 'historicalEntry'),
          ),
        });
      },
    );
    router.get(
      '/contractRequests/:id/textVersions',
      doc(
        'selectedContractText',
        'Read the selected immutable text file mapping under application view permissions',
        S.SelectedText,
      ),
      apiValidator('param', S.Params),
      async (ctx) =>
        ctx.json({
          data: await service.selectedText(
            ctx.req.valid('param').id,
            actor(ctx),
            await policy(ctx, 'view'),
          ),
        }),
    );
    router.post(
      '/contractRequests/:id/textVersions',
      doc(
        'appendContractText',
        'Append an immutable uploaded PDF text version',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.AppendText),
      async (ctx) => {
        const body = ctx.req.valid('json');
        const writePolicy = await policy(ctx, 'submit');
        return ctx.json({
          data: await service.appendText(
            ctx.req.valid('param').id,
            actor(ctx),
            body.fileId,
            body.requestId,
            await policy(ctx, 'view'),
            writePolicy,
          ),
        });
      },
    );
    router.post(
      '/contractRequests/:id/rebase',
      doc(
        'rebaseContractChange',
        'Explicitly rebase a returned change against the current approved version',
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Rebase),
      async (ctx) => {
        const body = ctx.req.valid('json');
        const writePolicy = await policy(ctx, 'submit');
        return ctx.json({
          data: await service.rebase(
            ctx.req.valid('param').id,
            actor(ctx),
            body.requestId,
            body.version,
            await policy(ctx, 'view'),
            writePolicy,
          ),
        });
      },
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
  ...attachments,
];
