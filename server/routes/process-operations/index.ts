import { Hono } from 'hono';
import { z } from 'zod';
import type { Application } from '@nocobase/app-server/application';
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
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { requestSearchRegistryToken } from '../../providers/request-search/contract.js';
import { processOwners } from '../../providers/process-management/owners.js';
import { orgServiceToken } from '../../providers/org/contract.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import { PROCESS_OPERATIONS } from '../../providers/process-operations/index.js';
import {
  processMetrics,
  type ProcessFact,
} from '../../providers/process-operations/metrics.js';
const Query = z
  .object({
    from: z.iso.date(),
    to: z.iso.date(),
    kind: z.string().max(100).optional(),
    departmentId: z.string().max(64).optional(),
  })
  .refine(
    (q) =>
      q.from <= q.to && Date.parse(q.to) - Date.parse(q.from) <= 92 * 86400000,
  );
const Summary = z.object({
  kind: z.string(),
  submitted: z.number(),
  completed: z.number(),
  averageElapsedMs: z.number().nullable(),
  returned: z.number(),
  returnRate: z.number(),
});
const Stage = z.object({
  kind: z.string(),
  stage: z.string(),
  completed: z.number(),
  averageElapsedMs: z.number().nullable(),
  waiting: z.number(),
  oldestWaitingMs: z.number(),
});
const Overdue = z.object({
  kind: z.string(),
  recordId: z.string(),
  number: z.string().nullable(),
  stage: z.string(),
  taskId: z.string(),
  dueAt: z.iso.datetime(),
  overdueMs: z.number(),
});
const Result = z.object({
  processes: z.array(Summary),
  stages: z.array(Stage),
  overdue: z.array(Overdue),
  sourceKinds: z.array(z.string()),
  generatedAt: z.iso.datetime(),
  timeZone: z.string(),
});
function denied(): never {
  throw new ApiError({
    status: 'PERMISSION_DENIED',
    domain: 'processOperations',
    reason: 'ACCESS_DENIED',
    message:
      'Report access is required, together with permission to view its business records.',
  });
}
function tooBroad(): never {
  throw new ApiError({
    status: 'INVALID_ARGUMENT',
    domain: 'processOperations',
    reason: 'REPORT_TOO_BROAD',
    message:
      'Choose a specific process or department and a shorter date range.',
  });
}
function inaccessible(error: unknown) {
  const e = error as {
    code?: string;
    status?: number | string;
    reason?: string;
  };
  return (
    [403, 404, 'PERMISSION_DENIED', 'NOT_FOUND'].includes(e.status ?? '') ||
    /(?:ACCESS_DENIED|FORBIDDEN|NOT_FOUND|FIELDS_RESTRICTED|OUTSIDE_SCOPE)/u.test(
      e.code ?? e.reason ?? '',
    )
  );
}
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      r = new Hono<AuthEnv & AuthorizationEnv>();
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.onError(apiErrorHandler);
    r.get(
      '/reports/process-operations',
      describeRoute({
        tags: ['Reports'],
        operationId: 'processOperationsReport',
        summary:
          'Authorized cross-process elapsed time, stage waiting, return incidence and overdue work',
        responses: {
          200: dataResponse(Result),
          ...apiErrorResponses,
          400: apiErrorResponse(400),
        },
      }),
      apiValidator('query', Query),
      async (ctx) => {
        const access = await ctx
          .get('authz')
          .authorize({
            resource: { type: 'settings', id: PROCESS_OPERATIONS },
            action: 'read',
          });
        if (access.effect === 'deny') denied();
        const query = ctx.req.valid('query'),
          calendar = c.resolve(calendarServiceToken),
          org = c.resolve(orgServiceToken);
        const start = calendar.resolveLocalDateTime(query.from, '00:00');
        const next = new Date(`${query.to}T12:00:00Z`);
        next.setUTCDate(next.getUTCDate() + 1);
        const end = calendar.resolveLocalDateTime(
          next.toISOString().slice(0, 10),
          '00:00',
        );
        const members = query.departmentId
          ? await org.primaryMembersOf([query.departmentId])
          : undefined;
        const actorId = ctx.get('auth')!.user.id,
          facts: ProcessFact[] = [],
          sourceKinds: string[] = [];
        let scanned = 0;
        for (const source of c.resolve(requestSearchRegistryToken).sources()) {
          const owner = processOwners.find((item) => item.kind === source.kind);
          if (!owner) continue;
          const decision = await ctx
            .get('authz')
            .authorize({
              resource: { type: 'composite', id: source.resource },
              action: 'view',
            });
          const policy =
            decision.effect === 'deny'
              ? undefined
              : decision.conditions?.database?.[source.collection];
          if (!policy?.read) continue;
          sourceKinds.push(source.kind);
          if (query.kind && query.kind !== source.kind) continue;
          const sdk = await owner.sdk(app);
          let afterId: string | undefined;
          while (true) {
            const batch = await source.reportingCandidates({
              before: end.toISOString(),
              applicantIds: members,
              afterId,
              limit: 100,
              policy,
            });
            for (let offset = 0; offset < batch.length; offset += 4) {
              const results = await Promise.all(
                batch.slice(offset, offset + 4).map(async (row) => {
                  try {
                    await source.validate(row.id, actorId, policy);
                    const runs = await sdk.read(() =>
                      sdk.approvals.runViewsFor(source.kind, row.id),
                    );
                    const first = Math.min(
                      ...runs.map((view) => Date.parse(view.run.startedAt)),
                    );
                    if (
                      !Number.isFinite(first) ||
                      first < +start ||
                      first >= +end
                    )
                      return null;
                    return {
                      kind: source.kind,
                      recordId: row.id,
                      number: row.number,
                      departmentId: query.departmentId ?? null,
                      runs,
                    } satisfies ProcessFact;
                  } catch (error) {
                    if (inaccessible(error)) return null;
                    throw error;
                  }
                }),
              );
              for (const result of results) if (result) facts.push(result);
              scanned += results.length;
              if (facts.length > 2000 || scanned > 10000) tooBroad();
            }
            if (batch.length < 100) break;
            const nextId = batch.at(-1)!.id;
            if (nextId === afterId)
              throw new Error('Reporting source cursor did not advance');
            afterId = nextId;
          }
        }
        if (!sourceKinds.length) denied();
        const now = new Date();
        ctx.header('Cache-Control', 'no-store');
        return ctx.json({
          data: {
            ...processMetrics(facts, now),
            sourceKinds,
            generatedAt: now.toISOString(),
            timeZone: calendar.timeZone(),
          },
        });
      },
    );
    return new Hono().route('/', r);
  }),
];
