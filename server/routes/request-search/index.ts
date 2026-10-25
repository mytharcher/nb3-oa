import { approvalDirectoryServiceToken } from '../../providers/approval-directory/contract.js';
import { createHash } from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Application } from '@nocobase/app-server/application';
import {
  authenticationToken,
  userAdministrationServiceToken,
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
  apiValidator,
  defineApiRoutes,
  describeRoute,
  listResponse,
} from '@nocobase/app-server/router';
import {
  requestSearchRegistryToken,
  type RequestSearchItem,
} from '../../providers/request-search/index.js';
import {
  readableSearchField,
  searchExpansionLimit,
} from '../../providers/request-search/owned-source.js';
import type { RequestSearchSkippedMatch } from '../../providers/request-search/contract.js';

const Query = z.strictObject({
  q: z.string().trim().min(2).max(200),
  cursor: z.string().max(2000).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
const Cursor = z.strictObject({
  v: z.literal(1),
  query: z.string().regex(/^[a-f0-9]{64}$/u),
  source: z.string().min(1).max(128),
  afterId: z.string().min(1).max(255).nullable(),
});
const Item = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string().nullable(),
  number: z.string().nullable(),
  applicant: z.object({ id: z.string(), name: z.string() }).nullable(),
});
function invalidCursor(): never {
  throw new ApiError({
    status: 'INVALID_ARGUMENT',
    domain: 'requestSearch',
    reason: 'INVALID_CURSOR',
    message: 'Restart this search to load results.',
  });
}
function deniedDetail(error: unknown) {
  if (error instanceof ApiError)
    return ['PERMISSION_DENIED', 'NOT_FOUND'].includes(error.status);
  if (!error || typeof error !== 'object') return false;
  const code =
    'code' in error ? error.code : 'reason' in error ? error.reason : '';
  return (
    typeof code === 'string' &&
    /(?:ACCESS_DENIED|FORBIDDEN|NOT_FOUND|FIELDS_RESTRICTED|SCOPE_VIOLATION|RECORD_OUTSIDE_SCOPE)$/u.test(
      code,
    )
  );
}
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '/requestSearch',
      app.container.resolve(authenticationToken).required(),
      app.container.resolve(authorizationToken).middleware(),
    );
    router.onError(apiErrorHandler);
    router.use('/requestSearch', async (_ctx, next) =>
      app.container
        .resolve(approvalDirectoryServiceToken)
        .withReadSnapshot(next),
    );
    router.get(
      '/requestSearch',
      describeRoute({
        tags: ['Search'],
        operationId: 'searchAuthorizedBusinessRequests',
        summary:
          'Search all authorized request types through their owning public adapters',
        responses: {
          200: listResponse(
            Item,
            z.object({
              nextCursor: z.string().nullable(),
              hasMore: z.boolean(),
              skippedMatches: z.array(z.enum(['applicant', 'relatedNumber'])),
            }),
          ),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', Query),
      async (ctx) => {
        const query = ctx.req.valid('query');
        const actorId = ctx.get('auth')!.user.id;
        const sources = app.container
          .resolve(requestSearchRegistryToken)
          .sources();
        const hash = createHash('sha256')
          .update(query.q.toLocaleLowerCase())
          .digest('hex');
        let start = 0;
        let afterId: string | undefined;
        if (query.cursor) {
          let decoded: z.infer<typeof Cursor>;
          try {
            decoded = Cursor.parse(
              JSON.parse(
                Buffer.from(query.cursor, 'base64url').toString('utf8'),
              ),
            );
          } catch {
            return invalidCursor();
          }
          start = sources.findIndex((source) => source.kind === decoded.source);
          if (start < 0 || decoded.query !== hash) invalidCursor();
          afterId = decoded.afterId ?? undefined;
        }
        const policies = await Promise.all(
          sources.map(async (source) => {
            const decision = await ctx.get('authz').authorize({
              resource: { type: 'composite', id: source.resource },
              action: 'view',
            });
            return decision.effect === 'deny'
              ? undefined
              : decision.conditions?.database?.[source.collection];
          }),
        );
        if (!policies.some((policy) => policy?.read))
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            domain: 'requestSearch',
            reason: 'ACCESS_DENIED',
            message: 'No readable request sources are available.',
          });
        const users = app.container.resolve(userAdministrationServiceToken);
        const applicants: string[] = [];
        const skipped = new Set<RequestSearchSkippedMatch>();
        // Public directory only; source adapters still intersect these identifiers
        // with their own current record and field policies before any match leaks.
        for (
          let page = 1;
          page <= 5 &&
          policies.some(
            (policy) => policy && readableSearchField(policy, 'applicantId'),
          );
          page++
        ) {
          const found = await users.list({
            search: query.q,
            kind: 'all',
            page,
            pageSize: 100,
          });
          if (found.total > searchExpansionLimit) {
            applicants.length = 0;
            skipped.add('applicant');
            break;
          }
          applicants.push(
            ...found.items
              .filter((user) =>
                user.name
                  .toLocaleLowerCase()
                  .includes(query.q.toLocaleLowerCase()),
              )
              .map((user) => user.id),
          );
          if (page * 100 >= found.total) break;
        }
        const results: RequestSearchItem[] = [];
        let inspected = 0;
        let nextCursor: string | null = null;
        const cursor = (index: number, last: string | undefined) =>
          Buffer.from(
            JSON.stringify({
              v: 1,
              query: hash,
              source: sources[index].kind,
              afterId: last ?? null,
            }),
          ).toString('base64url');
        for (let index = start; index < sources.length; index++) {
          const source = sources[index];
          const policy = policies[index];
          if (!policy?.read) {
            afterId = undefined;
            continue;
          }
          let exhausted = false;
          while (!exhausted && inspected < 100) {
            const limit = Math.min(50, 100 - inspected);
            const batch = await source.candidates({
              query: query.q,
              applicantIds: applicants,
              afterId,
              limit,
              policy,
              onSkippedMatch: (match) => skipped.add(match),
            });
            exhausted = batch.length < limit;
            for (let position = 0; position < batch.length; position++) {
              const item = batch[position];
              inspected++;
              afterId = item.id;
              try {
                await source.validate(item.id, actorId, policy);
              } catch (error) {
                if (deniedDetail(error)) continue;
                throw error;
              }
              results.push(item);
              if (results.length === query.pageSize) {
                if (position < batch.length - 1 || !exhausted)
                  nextCursor = cursor(index, afterId);
                else {
                  const next = sources.findIndex(
                    (_, candidate) =>
                      candidate > index && !!policies[candidate]?.read,
                  );
                  if (next >= 0) nextCursor = cursor(next, undefined);
                }
                break;
              }
            }
            if (results.length === query.pageSize) break;
          }
          if (results.length === query.pageSize) break;
          if (inspected >= 100) {
            if (!exhausted) nextCursor = cursor(index, afterId);
            else {
              const next = sources.findIndex(
                (_, candidate) =>
                  candidate > index && !!policies[candidate]?.read,
              );
              if (next >= 0) nextCursor = cursor(next, undefined);
            }
            break;
          }
          afterId = undefined;
        }
        const ids = [
          ...new Set(
            results
              .map((item) => item.applicantId)
              .filter((id): id is string => !!id),
          ),
        ];
        const names = ids.length
          ? await users.list({
              userIds: ids,
              kind: 'all',
              page: 1,
              pageSize: 100,
            })
          : { items: [] };
        const byId = new Map(names.items.map((user) => [user.id, user.name]));
        ctx.header('Cache-Control', 'no-store');
        return ctx.json({
          data: results.map(({ applicantId, ...item }) => ({
            ...item,
            applicant: applicantId
              ? { id: applicantId, name: byId.get(applicantId) ?? '' }
              : null,
          })),
          meta: {
            nextCursor,
            hasMore: nextCursor !== null,
            skippedMatches: [...skipped],
          },
        });
      },
    );
    return new Hono().route('/', router);
  }),
];
