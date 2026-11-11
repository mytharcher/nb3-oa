import { Hono } from 'hono';
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

const id = z.string().min(1).max(128);
const target = z.object({ lifecycle: id, recordId: id });
const evidence = z.object({
  kind: z.enum(['field', 'knowledge']),
  ref: z.string(),
  location: z.string().optional(),
  quote: z.string().optional(),
});
const report = z.object({
  nextStep: z.string().optional(),
  findings: z.array(
    z.object({
      checkId: z.string(),
      title: z.string(),
      verdict: z.enum([
        'conforms',
        'nonconforming',
        'needs_verification',
        'not_covered',
      ]),
      summary: z.string(),
      evidence: z.array(evidence),
    }),
  ),
  coverage: z.array(
    z.object({
      kind: z.enum(['field', 'knowledge']),
      ref: z.string(),
      label: z.string(),
      status: z.enum(['read', 'missing', 'not_supported']),
      version: z.number().optional(),
      range: z
        .object({ start: z.number(), end: z.number(), total: z.number() })
        .optional(),
      truncated: z.boolean().optional(),
    }),
  ),
  basis: z.string().nullable(),
  model: z.object({ modelService: z.string(), model: z.string() }),
  generatedAt: z.string(),
});
const diagnostics = z.object({
  finishReason: z.string().optional(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
  reasoningTokens: z.number().optional(),
  durationMs: z.number().optional(),
  responseId: z.string().optional(),
  validationCode: z.string().optional(),
  validationPath: z.string().optional(),
});
const state = z.object({
  taskId: id,
  title: z.string(),
  stage: z.string(),
  state: z.enum([
    'ready',
    'model_unconfigured',
    'services_unavailable',
    'not_actionable',
    'not_found',
    'generating',
    'generated',
    'failed',
    'cancelled',
  ]),
  canGenerate: z.boolean(),
  advice: z.object({ report, diagnostics: diagnostics.optional() }).nullable(),
  canRegenerate: z.boolean().optional(),
  canCancel: z.boolean().optional(),
  currentGenerationId: z.string().nullable().optional(),
  generationCount: z.number().optional(),
  versions: z.array(z.object({ id: z.string(), report })).optional(),
  attempts: z
    .array(
      z.object({
        id: z.string(),
        status: z.enum([
          'generating',
          'succeeded',
          'failed',
          'cancelled',
          'unavailable',
        ]),
        createdAt: z.string().nullable(),
        finishedAt: z.string().nullable(),
        errorCode: z.string().nullable(),
        startedAt: z.string().nullable().optional(),
        deadlineAt: z.string().nullable().optional(),
        phase: z.enum(['queued', 'running', 'finished']).optional(),
        diagnostics: diagnostics.optional(),
      }),
    )
    .optional(),
});
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
          getRequestLocale(ctx) ?? i18n.getDefaultLocale(),
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
          status: error.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'ABORTED',
          domain: 'approvalAi',
          reason: error.code,
          message: t('approvalAi.errors.' + error.code),
        }),
        ctx,
      );
    });
    routes.get(
      '/reviews',
      doc('approvalAiReviews', z.array(state)),
      apiValidator(
        'query',
        target.extend({ locale: z.string().max(32).optional() }),
      ),
      async (ctx) => {
        const { lifecycle, recordId } = ctx.req.valid('query');
        return ctx.json({
          data: await service.reviews(
            lifecycle,
            recordId,
            ctx.get('auth')!.user.id,
            await translate(ctx),
          ),
        });
      },
    );
    routes.post(
      '/reviews/:taskId/generate',
      doc('generateApprovalAiReview', state),
      apiValidator('param', z.object({ taskId: id })),
      apiValidator(
        'json',
        target
          .extend({ requestKey: id, previousId: id.nullable().optional() })
          .strict(),
      ),
      async (ctx) => {
        const input = ctx.req.valid('json');
        return ctx.json({
          data: await service.generate(
            input,
            ctx.req.valid('param').taskId,
            ctx.get('auth')!.user.id,
            input,
            await translate(ctx),
          ),
        });
      },
    );
    routes.post(
      '/reviews/:taskId/cancel',
      doc('cancelApprovalAiReview', state),
      apiValidator('param', z.object({ taskId: id })),
      apiValidator('json', target.extend({ generationId: id }).strict()),
      async (ctx) => {
        const input = ctx.req.valid('json');
        return ctx.json({
          data: await service.cancel(
            input,
            ctx.req.valid('param').taskId,
            ctx.get('auth')!.user.id,
            input.generationId,
            await translate(ctx),
          ),
        });
      },
    );
    const root = new Hono();
    root.route('/approvalAi', routes);
    return root;
  }),
];
