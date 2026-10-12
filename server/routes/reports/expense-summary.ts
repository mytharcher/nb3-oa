import ExcelJS from 'exceljs';
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
import {
  ApiError,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  defineApiRoutes,
  describeRoute,
  listResponse,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import type { Application } from '@nocobase/app-server/application';
import type { RepositoryPolicy } from '@nocobase/db';
import { reimbursementExpenseSummaryToken } from '../../providers/reimbursement/expense-summary.js';
import { ReimbursementError } from '../../providers/reimbursement/errors.js';
const query = z.object({
  locale: z.enum(['en-US', 'zh-CN']).default('en-US'),
  year: z.coerce.number().int().min(1900).max(9999).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const row = z.object({
  id: z.string(),
  year: z.number(),
  month: z.number(),
  category: z.string(),
  settledRequestCount: z.number().int(),
  settledExpenseCents: z.number().int(),
});
const meta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  generatedAt: z.string(),
  filters: z.object({ year: z.number(), month: z.number().optional() }),
});
const mime =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes((app) => {
    const c = app.container,
      service = c.resolve(reimbursementExpenseSummaryToken),
      router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    const load = async (
      ctx: import('hono').Context<AuthEnv & AuthorizationEnv>,
      q: z.infer<typeof query>,
    ) => {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.reimbursement' },
        action: 'view',
      });
      const policy = (
        decision.conditions?.database as
          Record<string, RepositoryPolicy | false | undefined> | undefined
      )?.reimbursementRequests;
      if (decision.effect === 'deny' || !policy || policy.read === false)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'reports',
          reason: 'SOURCE_ACCESS_DENIED',
          message: 'The expense source is outside current scope.',
        });
      try {
        const result = await service.list(q, policy);
        return {
          data: result.data.map((r) => row.parse(r)),
          meta: {
            page: q.page,
            pageSize: q.pageSize,
            total: result.total,
            generatedAt: new Date().toISOString(),
            filters: { year: result.year, month: q.month },
          },
        };
      } catch (error) {
        if (error instanceof ReimbursementError)
          throw new ApiError({
            status:
              error.kind === 'permission'
                ? 'PERMISSION_DENIED'
                : 'FAILED_PRECONDITION',
            httpStatus: error.kind === 'permission' ? 403 : 412,
            domain: 'reports',
            reason: error.code,
            message: error.message,
          });
        throw error;
      }
    };
    router.get(
      '/expense-summary',
      describeRoute({
        tags: ['Reports'],
        operationId: 'listExpenseSummary',
        summary:
          'Summarize settled gross expenses by original line month and category',
        responses: {
          200: listResponse(row, meta),
          ...apiErrorResponses,
          412: {
            ...apiErrorResponse(400),
            description:
              'The source evidence or synchronous report limit prevents generating this report.',
          },
        },
      }),
      apiValidator('query', query),
      async (ctx) => ctx.json(await load(ctx, ctx.req.valid('query'))),
    );
    router.get(
      '/expense-summary/export',
      describeRoute({
        tags: ['Reports'],
        operationId: 'exportExpenseSummary',
        summary: 'Export authorized settled gross expenses',
        responses: {
          200: {
            description: 'Fixed safe columns; gross expense is not cash paid.',
            content: {
              [mime]: { schema: { type: 'string', format: 'binary' } },
            },
          },
          ...apiErrorResponses,
          412: {
            ...apiErrorResponse(400),
            description:
              'The source evidence or synchronous report limit prevents generating this report.',
          },
        },
      }),
      apiValidator('query', query),
      async (ctx) => {
        const result = await load(ctx, {
          ...ctx.req.valid('query'),
          page: 1,
          pageSize: 10000,
        });
        if (result.meta.total > 10000)
          throw new ApiError({
            status: 'FAILED_PRECONDITION',
            domain: 'reports',
            httpStatus: 412,
            reason: 'EXPORT_LIMIT_EXCEEDED',
            message:
              'Expense summaries above 10,000 groups cannot be exported.',
          });
        const book = new ExcelJS.Workbook(),
          sheet = book.addWorksheet('Report');
        const chinese = ctx.req.valid('query').locale === 'zh-CN';
        sheet.columns = [
          { header: chinese ? '年度' : 'Year', key: 'year' },
          { header: chinese ? '费用月份' : 'Expense month', key: 'month' },
          {
            header: chinese ? '费用分类代码' : 'Category code',
            key: 'category',
          },
          {
            header: chinese ? '已结算申请数' : 'Settled request count',
            key: 'settledRequestCount',
          },
          {
            header: chinese
              ? '已结算费用毛额（分，非现金实付）'
              : 'Settled gross expense cents (not cash)',
            key: 'settledExpenseCents',
          },
        ];
        for (const value of result.data) sheet.addRow(value);
        return new Response(Buffer.from(await book.xlsx.writeBuffer()), {
          headers: {
            'content-type': mime,
            'content-disposition':
              'attachment; filename="expense-summary.xlsx"',
            'cache-control': 'no-store',
          },
        });
      },
    );
    const root = new Hono();
    root.route('/reports', router);
    return root;
  }),
];
export default routes;
