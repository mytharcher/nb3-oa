import { taskReference, taskDate } from '../../providers/task-center/values.js';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiErrorResponses,
  apiValidator,
  defineApiRoutes,
  describeRoute,
  dataResponse,
} from '@nocobase/app-server/router';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { userTaskServiceToken } from '@nocobase/app-plugin-task-center/server';
import { databaseManagerToken } from '@nocobase/db';
import { Hono } from 'hono';
import { z } from 'zod';

const querySchema = z
  .object({
    source: z.string().max(128).default('approval.task'),
    subject: z.string().max(128).optional(),
    status: z.enum(['pending', 'closed', 'all']).default('pending'),
    category: z.enum(['drafts']).optional(),
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
  })
  .strict();
const task = z.object({
  id: z.string(),
  sourceType: z.string(),
  sourceKey: z.string(),
  subject: z.string(),
  title: z.string(),
  recordId: z.string().optional(),
  businessStatus: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string(),
});
const result = z.object({
  tasks: z.array(task),
  total: z.number(),
  counts: z.object({
    pending: z.number(),
    closed: z.number(),
    all: z.number(),
  }),
  facets: z.array(
    z.object({
      sourceType: z.string(),
      subject: z.string(),
      pending: z.number(),
    }),
  ),
});

export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const auth = app.container.resolve(authenticationToken).required();
    const authz = app.container.resolve(authorizationToken).middleware();
    router.use('/taskCenter', auth, authz);
    router.use('/taskCenter/*', auth, authz);
    router.use('/taskCenter*', async (c, next) => {
      const grant = await c.get('authz').authorize({
        resource: { type: 'page', id: 'oa.approvals' },
        action: 'access',
      });
      if (grant.effect === 'deny')
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'oa.taskCenter',
          reason: 'ACCESS_DENIED',
          message: 'Forbidden',
        });
      await next();
    });
    router.get(
      '/taskCenter',
      describeRoute({
        tags: ['TaskCenter'],
        summary: 'Read the personal task index with layered facets',
        operationId: 'oaTaskCenter',
        responses: { 200: dataResponse(result), ...apiErrorResponses },
      }),
      apiValidator('query', querySchema),
      async (c) => {
        const query = c.req.valid('query');
        const userId = c.get('auth')!.user.id;
        if (query.category && query.source !== 'approval.application')
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            domain: 'oa.taskCenter',
            reason: 'INVALID_CATEGORY',
            message: 'Drafts belong to personal applications.',
          });
        const service = app.container.resolve(userTaskServiceToken);
        const [page, counts, categories] = await Promise.all([
          service.list(userId, {
            sourceType: query.source,
            subject: query.subject,
            status:
              query.status === 'all'
                ? undefined
                : query.status === 'closed'
                  ? ['completed', 'cancelled']
                  : 'pending',
            page: query.page,
            pageSize: query.pageSize,
            includeTotal: true,
            orderBy: query.status === 'pending' ? 'createdAt' : 'updatedAt',
            direction: 'desc',
          }),
          service.statistics(userId, {
            sourceType: query.source,
            subject: query.subject,
          }),
          service.categoryStatistics(userId),
        ]);
        const facets = categories.map(({ count, ...category }) => ({
          ...category,
          pending: count,
        }));
        const db = app.container.resolve(databaseManagerToken);
        if (query.category === 'drafts') {
          const summaries = db.repository('oaTaskCenterSummaries');
          const filter = {
            applicantId: userId,
            status: 'draft',
            ...(query.subject ? { subject: query.subject } : {}),
          };
          const [total, drafts] = await Promise.all([
            summaries.count({ filter }),
            query.status === 'closed'
              ? Promise.resolve([])
              : summaries.findMany({
                  filter,
                  sort: (s) => [
                    s.field('createdAt').desc(),
                    s.field('id').desc(),
                  ],
                  offset: (query.page - 1) * query.pageSize,
                  limit: query.pageSize,
                }),
          ]);
          return c.json({
            data: {
              tasks: drafts.map((row) => ({
                id: `draft:${taskReference(row.id)}`,
                sourceType: 'approval.application',
                sourceKey: `${taskReference(row.subject)}:${taskReference(row.recordId)}`,
                subject: taskReference(row.subject),
                recordId: taskReference(row.recordId),
                title: taskReference(row.subject),
                status: 'pending' as const,
                businessStatus: 'draft',
                createdAt: taskDate(row.createdAt).toISOString(),
                updatedAt: taskDate(row.createdAt).toISOString(),
              })),
              total: query.status === 'closed' ? 0 : total,
              counts: { pending: total, closed: 0, all: total },
              facets,
            },
          });
        }
        const rows = page.data;
        const targets = rows.length
          ? await app.container
              .resolve(databaseManagerToken)
              .repository('oaTaskCenterTargets')
              .findMany({
                filter: (f) =>
                  f.or(
                    rows.map((row) =>
                      f.and([
                        f.string('sourceType').eq(row.sourceType),
                        f.string('sourceKey').eq(row.sourceKey),
                      ]),
                    ),
                  ),
                select: (s) => s.fields('sourceType', 'sourceKey', 'recordId'),
              })
          : [];
        const records = new Map(
          targets.map((row) => [
            JSON.stringify([row.sourceType, row.sourceKey]),
            taskReference(row.recordId),
          ]),
        );
        const applications = rows.filter(
          (row) => row.sourceType === 'approval.application',
        );
        const summaries = applications.length
          ? await db.repository('oaTaskCenterSummaries').findMany({
              filter: (f) =>
                f.and([
                  f.string('applicantId').eq(userId),
                  f.or(
                    applications.map((row) =>
                      f.and([
                        f.string('subject').eq(row.subject),
                        f
                          .string('recordId')
                          .eq(row.sourceKey.slice(row.subject.length + 1)),
                      ]),
                    ),
                  ),
                ]),
              select: (s) => s.fields('subject', 'recordId', 'status'),
            })
          : [];
        const states = new Map(
          summaries.map((row) => [
            `${taskReference(row.subject)}:${taskReference(row.recordId)}`,
            taskReference(row.status),
          ]),
        );
        return c.json({
          data: {
            tasks: rows.map(({ userId: _owner, ...row }) => ({
              ...row,
              recordId:
                row.sourceType === 'approval.application'
                  ? row.sourceKey.slice(row.subject.length + 1)
                  : records.get(
                      JSON.stringify([row.sourceType, row.sourceKey]),
                    ),
              businessStatus:
                row.sourceType === 'approval.application'
                  ? states.get(row.sourceKey)
                  : undefined,
              createdAt: taskDate(row.createdAt).toISOString(),
              updatedAt: taskDate(row.updatedAt).toISOString(),
            })),
            total: page.meta.total,
            counts: {
              pending: counts.pending,
              closed: counts.completed + counts.cancelled,
              all: counts.pending + counts.completed + counts.cancelled,
            },
            facets,
          },
        });
      },
    );
    router.get(
      '/taskCenter/:id/target',
      describeRoute({
        tags: ['TaskCenter'],
        summary: 'Resolve an owned task to its business route',
        operationId: 'oaTaskCenterTarget',
        responses: {
          200: dataResponse(
            z.object({ subject: z.string(), recordId: z.string() }),
          ),
          ...apiErrorResponses,
        },
      }),
      async (c) => {
        const item = await app.container
          .resolve(userTaskServiceToken)
          .get(c.get('auth')!.user.id, c.req.param('id'));
        if (!item)
          throw new ApiError({
            status: 'NOT_FOUND',
            domain: 'oa.taskCenter',
            reason: 'NOT_FOUND',
            message: 'Not found',
          });
        if (item.sourceType === 'approval.application') {
          const prefix = `${item.subject}:`;
          if (!item.sourceKey.startsWith(prefix))
            throw new ApiError({
              status: 'NOT_FOUND',
              domain: 'oa.taskCenter',
              reason: 'NOT_FOUND',
              message: 'Not found',
            });
          return c.json({
            data: {
              subject: item.subject,
              recordId: item.sourceKey.slice(prefix.length),
            },
          });
        }
        const target = await app.container
          .resolve(databaseManagerToken)
          .repository('oaTaskCenterTargets')
          .findOne({
            filter: { sourceType: item.sourceType, sourceKey: item.sourceKey },
          });
        if (!target)
          throw new ApiError({
            status: 'NOT_FOUND',
            domain: 'oa.taskCenter',
            reason: 'NOT_FOUND',
            message: 'Not found',
          });
        return c.json({
          data: {
            subject: taskReference(target.subject),
            recordId: taskReference(target.recordId),
          },
        });
      },
    );
    const root = new Hono();
    root.route('/', router);
    return root;
  }),
];
