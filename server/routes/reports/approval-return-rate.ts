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
import type { Application } from '@nocobase/app-server/application';
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
import type { RepositoryPolicy } from '@nocobase/db';
import { leaveServiceToken } from '../../providers/leave/index.js';
import { LeaveError } from '../../providers/leave/errors.js';

const Query = z.object({
  locale: z.enum(['en-US', 'zh-CN']).default('en-US'),
  year: z.coerce.number().int().min(1900).max(9998),
  month: z.coerce.number().int().min(1).max(12).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const Row = z.object({
  id: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  submittedRunCount: z.number().int(),
  returnedRunCount: z.number().int(),
  returnDecisionCount: z.number().int(),
  returnRateBasisPoints: z.number().int(),
});
const Meta = z.object({
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  generatedAt: z.string(),
  basis: z.literal('leave-returned-runs-over-submitted-runs'),
  dateBasis: z.literal('request-current-start-company-date'),
  includesHistoricalRuns: z.literal(true),
  includesOpenRuns: z.literal(true),
});
const mime =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes((app) => {
    const c = app.container;
    const leave = c.resolve(leaveServiceToken);
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    for (const excel of [false, true])
      router.get(
        excel
          ? '/leave-approval-return-rate/export'
          : '/leave-approval-return-rate',
        describeRoute({
          tags: ['Reports'],
          operationId: excel
            ? 'exportLeaveApprovalReturnRate'
            : 'listLeaveApprovalReturnRate',
          summary:
            'Leave return incidence per submitted run by current request start month; includes open and historical runs',
          responses: {
            200: excel
              ? {
                  description: 'Fixed authorized workbook',
                  content: {
                    [mime]: { schema: { type: 'string', format: 'binary' } },
                  },
                }
              : listResponse(Row, Meta),
            ...apiErrorResponses,
            412: apiErrorResponse(
              400,
              'Source bound or timestamp precondition failed.',
            ),
          },
        }),
        apiValidator('query', Query),
        async (ctx) => {
          const q = ctx.req.valid('query');
          const decision = await ctx.get('authz').authorize({
            resource: { type: 'composite', id: 'oa.leave' },
            action: 'view',
          });
          const policies = decision.conditions?.database as
            Record<string, RepositoryPolicy | false | undefined> | undefined;
          const policy = policies?.leaveRequests;
          if (decision.effect === 'deny' || !policy || policy.read === false)
            throw new ApiError({
              status: 'PERMISSION_DENIED',
              domain: 'reports',
              reason: 'SOURCE_ACCESS_DENIED',
              message: 'The ordinary source is outside the current scope.',
            });
          const result = await leave
            .approvalReturnRateReport(
              excel ? { ...q, page: 1, pageSize: 10000 } : q,
              policy,
            )
            .catch((e: unknown) => {
              if (e instanceof LeaveError)
                throw new ApiError({
                  httpStatus: e.kind === 'permission' ? 403 : 412,
                  status:
                    e.kind === 'permission'
                      ? 'PERMISSION_DENIED'
                      : 'FAILED_PRECONDITION',
                  domain: 'reports',
                  reason: e.code,
                  message: e.message,
                });
              throw e;
            });
          const data = result.data.map((row) => Row.parse(row));
          if (!excel)
            return ctx.json({
              data,
              meta: Meta.parse({
                total: result.total,
                page: q.page,
                pageSize: q.pageSize,
                generatedAt: new Date().toISOString(),
                basis: 'leave-returned-runs-over-submitted-runs',
                dateBasis: 'request-current-start-company-date',
                includesHistoricalRuns: true,
                includesOpenRuns: true,
              }),
            });
          const book = new ExcelJS.Workbook();
          const sheet = book.addWorksheet('Leave return rate');
          sheet.columns = [
            {
              header:
                q.locale === 'zh-CN' ? '当前开始年' : 'Current start year',
              key: 'year',
            },
            {
              header:
                q.locale === 'zh-CN' ? '当前开始月' : 'Current start month',
              key: 'month',
            },
            {
              header:
                q.locale === 'zh-CN'
                  ? '提交批次数（含在途）'
                  : 'Submitted runs (includes open)',
              key: 'submittedRunCount',
            },
            {
              header:
                q.locale === 'zh-CN'
                  ? '发生退回的批次数'
                  : 'Runs with a return',
              key: 'returnedRunCount',
            },
            {
              header:
                q.locale === 'zh-CN'
                  ? '实际退回决策数'
                  : 'Return decision count',
              key: 'returnDecisionCount',
            },
            {
              header:
                q.locale === 'zh-CN'
                  ? '退回率基点'
                  : 'Return rate basis points',
              key: 'returnRateBasisPoints',
            },
          ];
          for (const row of data) sheet.addRow(row);
          return new Response(Buffer.from(await book.xlsx.writeBuffer()), {
            headers: {
              'content-type': mime,
              'content-disposition':
                'attachment; filename="leave-approval-return-rate.xlsx"',
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
