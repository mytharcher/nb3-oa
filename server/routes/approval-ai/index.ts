import type { RepositoryPolicy } from '@nocobase/db';
import { Hono, type Context, type Next } from 'hono';
import { z } from 'zod';
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
  defineApiRoutes,
  apiValidator,
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  describeRoute,
  dataResponse,
} from '@nocobase/app-server/router';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import {
  approvalAiServiceToken,
  ApprovalAiError,
} from '../../providers/approval-ai/service.js';
import { settingsInput, findingSchema } from '../../../shared/approval-ai.js';
const id = z.string().min(1).max(128);
const model = z.object({ modelService: z.string(), model: z.string() });
const settings = settingsInput
  .omit({ expectedVersion: true })
  .extend({ definitionId: z.string(), version: z.number() });
const definition = z.object({
  id: z.string(),
  title: z.string(),
  stages: z.array(z.string()),
  checks: z.array(z.object({ id: z.string(), title: z.string() })),
  basis: z.array(
    z.object({ key: z.string(), title: z.string(), required: z.boolean() }),
  ),
  settings,
});
const review = z.object({
  taskId: z.string(),
  via: z.enum(['assignee', 'delegate']),
  definitionId: z.string(),
  title: z.string(),
  stage: z.string(),
  taskOpen: z.boolean(),
  status: z.enum([
    'none',
    'queued',
    'running',
    'succeeded',
    'failed',
    'skipped',
  ]),
  errorCode: z.string().nullable(),
  canGenerate: z.boolean(),
  generatedAt: z.string().nullable(),
  model: model.nullable(),
  findings: z.array(findingSchema.extend({ title: z.string() })).nullable(),
  coverage: z.array(
    z.object({
      kind: z.string(),
      ref: z.string(),
      label: z.string(),
      status: z.enum(['read', 'not_supported', 'missing']),
      version: z.number().optional(),
      slot: z.string().optional(),
    }),
  ),
  basis: z.string().nullable(),
  feedback: z
    .object({ rating: z.string(), note: z.string().nullable() })
    .nullable(),
});
const done = z.object({ taskId: z.string() });
function doc(operationId: string, schema: z.ZodType) {
  return describeRoute({
    tags: ['Approval AI'],
    operationId,
    summary: operationId,
    responses: { 200: dataResponse(schema), ...apiErrorResponses },
  });
}
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      service = c.resolve(approvalAiServiceToken),
      routes = new Hono<AuthEnv & AuthorizationEnv>();
    routes.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    async function translate(ctx: Parameters<typeof getRequestLocale>[0]) {
      const i18n = c.resolve(i18nToken),
        locale = i18n.resolveLocale(
          ctx.req.query('locale') ??
            getRequestLocale(ctx) ??
            i18n.getDefaultLocale(),
        );
      await i18n.ensureLocaleLoaded(locale);
      return i18n.getFixedT('nb3-oa', locale);
    }
    routes.onError(async (error, ctx) => {
      if (!(error instanceof ApprovalAiError))
        return apiErrorHandler(error, ctx);
      const t = await translate(ctx);
      return apiErrorHandler(
        new ApiError({
          status:
            error.code === 'NOT_FOUND'
              ? 'NOT_FOUND'
              : error.code === 'CONFLICT'
                ? 'ABORTED'
                : 'INVALID_ARGUMENT',
          domain: 'approvalAi',
          reason: error.code,
          message: t('approvalAi.errors.' + error.code),
        }),
        ctx,
      );
    });
    routes.get(
      '/reviews',
      doc('approvalAiReviews', z.array(review)),
      apiValidator(
        'query',
        z.object({
          lifecycle: id,
          recordId: id,
          locale: z.string().max(32).optional(),
        }),
      ),
      async (ctx) => {
        const q = ctx.req.valid('query');
        return ctx.json({
          data: await service.reviews(
            q.lifecycle,
            q.recordId,
            ctx.get('auth')!.user.id,
            await translate(ctx),
          ),
        });
      },
    );
    routes.post(
      '/reviews/:taskId/generate',
      doc('generateApprovalAiReview', done),
      apiValidator('param', z.object({ taskId: id })),
      apiValidator(
        'json',
        z.object({ requestKey: z.string().min(1).max(128) }),
      ),
      async (ctx) =>
        ctx.json({
          data: await service.generate(
            ctx.req.valid('param').taskId,
            ctx.get('auth')!.user.id,
            ctx.req.valid('json').requestKey,
          ),
        }),
    );
    routes.put(
      '/reviews/:taskId/feedback',
      doc('approvalAiFeedback', done),
      apiValidator('param', z.object({ taskId: id })),
      apiValidator(
        'json',
        z.object({
          rating: z.enum(['useful', 'false_positive', 'missed']),
          note: z.string().max(1000).optional(),
        }),
      ),
      async (ctx) => {
        const body = ctx.req.valid('json');
        return ctx.json({
          data: await service.feedback(
            ctx.req.valid('param').taskId,
            ctx.get('auth')!.user.id,
            body.rating,
            body.note,
          ),
        });
      },
    );
    const policies = new WeakMap<object, RepositoryPolicy>();
    // Configuration permissions are independent from task ownership.
    for (const path of ['/definitions', '/definitions/*', '/models'])
      routes.use(
        path,
        async (ctx: Context<AuthEnv & AuthorizationEnv>, next: Next) => {
          const decision = await ctx.get('authz').authorize({
            resource: { type: 'composite', id: 'oa.approvalAi' },
            action: 'configure',
          });
          const policy = (
            decision.conditions?.database as
              Record<string, RepositoryPolicy | false> | undefined
          )?.oaApprovalAiSettings;
          if (decision.effect === 'deny' || !policy)
            throw new ApiError({
              status: 'PERMISSION_DENIED',
              domain: 'approvalAi',
              reason: 'CONFIGURE_DENIED',
              message: (await translate(ctx))('approvalAi.unavailable'),
            });
          policies.set(ctx, policy);
          await next();
        },
      );
    routes.get(
      '/definitions',
      doc('approvalAiDefinitions', z.array(definition)),
      apiValidator(
        'query',
        z.object({ locale: z.string().max(32).optional() }),
      ),
      async (ctx) =>
        ctx.json({
          data: await service.definitions(
            await translate(ctx),
            policies.get(ctx),
          ),
        }),
    );
    routes.get(
      '/models',
      doc('approvalAiModels', z.array(model)),
      async (ctx) => ctx.json({ data: await service.models() }),
    );
    routes.put(
      '/definitions/:id/settings',
      doc('saveApprovalAiSettings', settings),
      apiValidator('param', z.object({ id })),
      apiValidator('json', settingsInput),
      async (ctx) =>
        ctx.json({
          data: await service.saveSettings(
            ctx.req.valid('param').id,
            ctx.req.valid('json'),
            ctx.get('auth')!.user.id,
            policies.get(ctx),
          ),
        }),
    );
    const root = new Hono();
    root.route('/approvalAi', routes);
    return root;
  }),
];
