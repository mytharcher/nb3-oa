import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import { i18nToken } from '@nocobase/app-server/i18n';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponse,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { getRequestLocale } from '@nocobase/i18n/server';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { Hono, type Context } from 'hono';
import { HeadcountError } from '../../providers/headcounts/service.js';
import { SalaryRangeError } from '../../providers/job-grades/ranges.js';
import { SalaryTableError } from '../../providers/job-grades/service.js';
import type { Requisition } from '../../providers/recruitment/requisitions.js';
import { recruitmentServiceToken } from '../../providers/recruitment/service.js';
import { RecruitmentSubmissionError } from '../../providers/recruitment/submission.js';
import * as S from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(recruitmentServiceToken),
      db = app.container.resolve(databaseManagerToken);
    const auth = app.container.resolve(authenticationToken),
      authz = app.container.resolve(authorizationToken);
    for (const path of [
      '/recruitmentRequests',
      '/recruitmentRequests/*',
      '/requisitions',
      '/requisitions/*',
    ])
      router.use(path, auth.required(), authz.middleware());
    router.onError(async (error, c) => {
      const i18n = app.container.resolve(i18nToken),
        locale = getRequestLocale(c) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      const key =
        error instanceof RecruitmentSubmissionError &&
        error.reason.includes('FORBIDDEN')
          ? 'denied'
          : 'failed';
      const translated = i18n.getFixedT(
        'nb3-oa',
        locale,
      )(`recruitment.errors.${key}`);
      if (
        error instanceof RecruitmentSubmissionError ||
        error instanceof SalaryRangeError ||
        error instanceof SalaryTableError ||
        error instanceof HeadcountError
      ) {
        const reason =
          error instanceof RecruitmentSubmissionError ||
          error instanceof SalaryRangeError ||
          error instanceof SalaryTableError
            ? error.reason
            : error.code;
        return apiErrorHandler(
          new ApiError({
            status:
              reason.includes('FORBIDDEN') || reason.includes('TARGET_MISMATCH')
                ? 'PERMISSION_DENIED'
                : reason.includes('CONFLICT')
                  ? 'ABORTED'
                  : reason.includes('INVALID')
                    ? 'INVALID_ARGUMENT'
                    : 'FAILED_PRECONDITION',
            reason,
            domain: 'recruitment',
            message: reason,
            localizedMessage: { locale, message: translated },
            metadata: { ns: 'nb3-oa', key: `recruitment.errors.${key}` },
            cause: error,
          }),
          c,
        );
      }
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'recruitment' }) : error,
          c,
        );
      }
      if (
        error instanceof ApprovalError &&
        !['INTERNAL', 'INVALID_EFFECT'].includes(error.code)
      )
        return apiErrorHandler(
          new ApiError({
            status:
              error.code === 'CONFLICT' ? 'ABORTED' : 'FAILED_PRECONDITION',
            reason: error.code,
            domain: 'recruitment',
            message: error.message,
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    async function policy(
      c: Context<AuthEnv & AuthorizationEnv>,
      action: string,
      resource = 'oa.recruitment',
      collection = 'recruitmentRequests',
    ) {
      const decision = await c
        .get('authz')
        .authorize({ resource: { type: 'composite', id: resource }, action });
      const result =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.[collection];
      if (!result)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          reason: 'RECRUITMENT_FORBIDDEN',
          domain: 'recruitment',
          message: 'Recruitment business permission is required.',
          metadata: { ns: 'nb3-oa', key: 'recruitment.errors.denied' },
        });
      return result;
    }
    const declaration = (
      operationId: string,
      summary: string,
      schema: Parameters<typeof dataResponse>[0],
    ) =>
      describeRoute({
        tags: ['Recruitment'],
        operationId,
        summary,
        responses: {
          '200': dataResponse(schema),
          ...apiErrorResponses,
          '409': apiErrorResponse(409),
        },
      });
    router.get(
      '/recruitmentRequests',
      declaration(
        'listRecruitmentRequests',
        'List authorized recruitment requests',
        S.List,
      ),
      apiValidator('query', S.ListQuery),
      async (c) => {
        const query = c.req.valid('query');
        const page = await service.listPage(query, await policy(c, 'view'));
        return c.json({
          data: page.items,
          meta: {
            page: query.page,
            pageSize: query.pageSize,
            total: page.total,
          },
        });
      },
    );
    router.post(
      '/recruitmentRequests',
      declaration(
        'createRecruitmentRequest',
        'Create recruitment draft with private salary revision',
        S.Detail,
      ),
      apiValidator('json', S.Create),
      async (c) => {
        const body = c.req.valid('json'),
          actorId = c.get('auth')!.user.id;
        const ordinary = await policy(c, 'view');
        const record = await service.create(
          body.proposal,
          { actorId, requestKey: body.requestKey, reason: body.reason },
          await policy(c, 'submit'),
          ordinary,
        );
        return c.json({
          data: await service.detail(record.id, actorId, ordinary),
        });
      },
    );
    router.get(
      '/recruitmentRequests/createOptions',
      declaration(
        'getRecruitmentCreateOptions',
        'Get default department-head browser creation metadata',
        S.CreateOptions,
      ),
      async (c) =>
        c.json({
          data: await service.createOptions(c.get('auth')!.user.id, {
            view: await policy(c, 'view'),
            write: await policy(c, 'submit'),
          }),
        }),
    );
    router.get(
      '/recruitmentRequests/createReplacementCandidates',
      declaration(
        'listRecruitmentCreateReplacementIdentities',
        'Get scoped default head creation identities without certifying occupancy',
        S.ReplacementCandidates,
      ),
      apiValidator('query', S.CreateReplacementQuery),
      async (c) =>
        c.json({
          data: await service.createReplacementCandidates(
            c.get('auth')!.user.id,
            c.req.valid('query'),
            { view: await policy(c, 'view'), write: await policy(c, 'submit') },
            await policy(c, 'view', 'oa.employees.archive', 'employees'),
          ),
        }),
    );
    router.get(
      '/recruitmentRequests/capacityOptions',
      declaration(
        'getRecruitmentCapacityOptions',
        'Get initialized current authorized target account identities only',
        S.CapacityOptions,
      ),
      apiValidator('query', S.CapacityQuery),
      async (c) => {
        const query = c.req.valid('query');
        return c.json({
          data: await service.capacityOptions(c.get('auth')!.user.id, query, {
            view: await policy(c, 'view'),
            write: await policy(
              c,
              query.mode === 'reviewEdit' ? 'reviewEdit' : 'submit',
            ),
          }),
        });
      },
    );
    router.get(
      '/recruitmentRequests/replacementCandidates',
      declaration(
        'listRecruitmentReplacementIdentities',
        'Get scoped employee identities; capacity eligibility is verified only on submission',
        S.ReplacementCandidates,
      ),
      apiValidator('query', S.ReplacementQuery),
      async (c) => {
        const query = c.req.valid('query');
        const policies = {
          view: await policy(c, 'view'),
          write: await policy(
            c,
            query.mode === 'reviewEdit' ? 'reviewEdit' : 'submit',
          ),
        };
        const identities = await policy(
          c,
          'view',
          'oa.employees.archive',
          'employees',
        );
        return c.json({
          data: await service.replacementCandidates(
            c.get('auth')!.user.id,
            query.requestId,
            query.mode,
            query,
            policies,
            identities,
          ),
        });
      },
    );
    router.get(
      '/recruitmentRequests/formOptions',
      declaration(
        'getRecruitmentFormOptions',
        'Get currently authorized reviewer or draft form metadata',
        S.FormOptions,
      ),
      apiValidator('query', S.FormOptionsQuery),
      async (c) => {
        const query = c.req.valid('query');
        const view = await policy(c, 'view');
        const write = await policy(
          c,
          query.mode === 'reviewEdit' ? 'reviewEdit' : 'submit',
        );
        let salary: RepositoryPolicy | undefined;
        try {
          salary = await policy(c, 'viewSalary');
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
        }
        return c.json({
          data: await service.formOptions(
            c.get('auth')!.user.id,
            query.requestId,
            query.mode,
            { view, write, salary },
          ),
        });
      },
    );
    router.get(
      '/recruitmentRequests/:id',
      declaration(
        'getRecruitmentRequest',
        'Get safe recruitment approval detail',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      async (c) => {
        const decision = await c.get('authz').authorize({
          resource: { type: 'composite', id: 'oa.recruitment' },
          action: 'submit',
        });
        const transitionPolicy =
          decision.effect === 'deny'
            ? undefined
            : (
                decision.conditions?.database as
                  | Record<string, RepositoryPolicy | false | undefined>
                  | undefined
              )?.recruitmentRequests;
        return c.json({
          data: await service.detail(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await policy(c, 'view'),
            transitionPolicy || undefined,
          ),
        });
      },
    );
    router.get(
      '/recruitmentRequests/:id/salary',
      declaration(
        'getRecruitmentSalary',
        'Read private salary with ordinary view and salary permissions',
        S.Salary,
      ),
      apiValidator('param', S.Params),
      async (c) =>
        c.json({
          data: await service.salary(
            c.req.valid('param').id,
            await policy(c, 'view'),
            await policy(c, 'viewSalary'),
          ),
        }),
    );
    router.patch(
      '/recruitmentRequests/:id',
      declaration(
        'editRecruitmentRequest',
        'Edit owned draft with a new immutable salary revision',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Edit),
      async (c) => {
        const body = c.req.valid('json'),
          id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        await service.edit(
          id,
          body.proposal,
          body.version,
          { actorId, requestKey: body.requestKey, reason: body.reason },
          await policy(c, 'submit'),
        );
        return c.json({
          data: await service.detail(id, actorId, await policy(c, 'view')),
        });
      },
    );
    router.post(
      '/recruitmentRequests/:id/reviewEdit',
      declaration(
        'reviewEditRecruitmentRequest',
        'Modify permitted current reviewer fields with fresh capacity and review',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.ReviewEdit),
      async (c) => {
        const body = c.req.valid('json'),
          id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        const ordinary = await policy(c, 'view');
        await service.reviewEdit(
          id,
          body.patch,
          body.version,
          { actorId, requestKey: body.requestKey, reason: body.reason },
          {
            view: ordinary,
            write: await policy(c, 'reviewEdit'),
            ...('minimumCents' in body.patch || 'maximumCents' in body.patch
              ? { salary: await policy(c, 'viewSalary') }
              : {}),
          },
        );
        return c.json({ data: await service.detail(id, actorId, ordinary) });
      },
    );
    router.post(
      '/recruitmentRequests/:id/transitions',
      declaration(
        'transitionRecruitmentRequest',
        'Submit withdraw or terminate recruitment with version and replay protection',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Transition),
      async (c) => {
        const body = c.req.valid('json'),
          id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        await service.transition(
          id,
          body.transition,
          body.version,
          { actorId, requestKey: body.requestKey, reason: body.reason },
          await policy(c, 'submit'),
        );
        return c.json({
          data: await service.accessFacts(id, actorId, await policy(c, 'view')),
        });
      },
    );
    router.post(
      '/recruitmentRequests/:id/actions',
      declaration(
        'performRecruitmentAction',
        'Perform an offered SDK action for this recruitment',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Action),
      async (c) => {
        const { requestKey, reason, ...input } = c.req.valid('json'),
          id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        const ordinary = await policy(c, 'view');
        await service.accessFacts(id, actorId, ordinary);
        await service.action(
          id,
          { ...input, requestId: requestKey },
          { actorId, requestKey, reason },
          await policy(c, 'operate'),
        );
        return c.json({ data: await service.detail(id, actorId, ordinary) });
      },
    );
    router.get(
      '/recruitmentRequests/:id/candidates',
      declaration(
        'recruitmentCandidates',
        'Search candidates from the current offered SDK action',
        S.Candidates,
      ),
      apiValidator('param', S.Params),
      apiValidator('query', S.CandidatesQuery),
      async (c) => {
        const query = c.req.valid('query');
        const ordinary = await policy(c, 'view');
        await service.accessFacts(
          c.req.valid('param').id,
          c.get('auth')!.user.id,
          ordinary,
        );
        return c.json({
          data: await service.candidates(
            c.req.valid('param').id,
            query.taskId,
            query.action,
            c.get('auth')!.user.id,
            query,
            await policy(c, 'operate'),
          ),
        });
      },
    );
    router.get(
      '/requisitions',
      declaration(
        'listRequisitions',
        'List authorized recruitment allocations',
        S.Requisition.array(),
      ),
      async (c) => {
        const ordinary = await policy(
          c,
          'view',
          'oa.requisitions',
          'requisitions',
        );
        const rows = await db
          .repository<Requisition>('requisitions')
          .withPolicy(ordinary)
          .findMany();
        return c.json({
          data: await Promise.all(
            rows.map((row) =>
              service.requisitions.get(
                String(row.id),
                db.connection(),
                ordinary,
              ),
            ),
          ),
        });
      },
    );
    router.get(
      '/requisitions/:id',
      declaration(
        'getRequisition',
        'Read authorized recruitment allocation',
        S.Requisition,
      ),
      apiValidator('param', S.Params),
      async (c) => {
        const record = await service.requisitions.get(
          c.req.valid('param').id,
          db.connection(),
          await policy(c, 'view', 'oa.requisitions', 'requisitions'),
        );
        if (!record)
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'RECRUITMENT_FORBIDDEN',
            domain: 'recruitment',
            message: 'Recruitment allocation is outside the readable scope.',
          });
        return c.json({ data: record });
      },
    );
    router.post(
      '/requisitions/:id/close',
      declaration(
        'closeRequisition',
        'Close only remaining allocation with scoped HR permission',
        S.Requisition,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Close),
      async (c) => {
        const input = c.req.valid('json'),
          mutation = await policy(
            c,
            'close',
            'oa.requisitions',
            'requisitions',
          );
        const ordinary = await policy(
          c,
          'view',
          'oa.requisitions',
          'requisitions',
        );
        if (
          !(await service.requisitions.get(
            c.req.valid('param').id,
            db.connection(),
            ordinary,
          ))
        )
          throw new ApiError({
            status: 'PERMISSION_DENIED',
            reason: 'RECRUITMENT_FORBIDDEN',
            domain: 'recruitment',
            message: 'Recruitment allocation is outside the readable scope.',
          });
        return c.json({
          data: await db.transaction((tx) =>
            service.requisitions.close(
              c.req.valid('param').id,
              input.version,
              {
                actorId: c.get('auth')!.user.id,
                requestKey: input.requestKey,
                reason: input.reason,
              },
              tx,
              mutation,
            ),
          ),
        });
      },
    );
    const outer = new Hono();
    outer.route('/', router);
    return outer;
  }),
];
export default routes;
