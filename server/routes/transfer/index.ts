import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import { Hono, type Context } from 'hono';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import {
  authorizationToken,
  type AuthorizationEnv,
} from '@nocobase/app-plugin-authorization/server';
import { type RepositoryPolicy } from '@nocobase/db';
import {
  ApiError,
  apiErrorHandler,
  apiErrorResponses,
  apiErrorResponse,
  defineApiRoutes,
  describeRoute,
  apiValidator,
  dataResponse,
  type AppRouteContribution,
} from '@nocobase/app-server/router';
import type { Application } from '@nocobase/app-server/application';
import { LifecycleError, lifecycleErrorFields } from '@nocobase/lifecycle';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import { transferServiceToken } from '../../providers/transfer/service.js';
import { SalaryRangeError } from '../../providers/job-grades/ranges.js';
import { SalaryTableError } from '../../providers/job-grades/service.js';
import { TransferSalaryError } from '../../providers/transfer/salary.js';
import { TransferError } from '../../providers/transfer/submission.js';
import { HeadcountError } from '../../providers/headcounts/service.js';
import * as S from './schemas.js';
export const routes: readonly AppRouteContribution<Application>[] = [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    const service = app.container.resolve(transferServiceToken);
    const auth = app.container.resolve(authenticationToken),
      authz = app.container.resolve(authorizationToken);
    for (const path of ['/transferRequests', '/transferRequests/*'])
      router.use(path, auth.required(), authz.middleware());
    router.onError(async (error, c) => {
      const i18n = app.container.resolve(i18nToken),
        locale = getRequestLocale(c) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      const key =
        error instanceof TransferError && error.reason.includes('FORBIDDEN')
          ? 'denied'
          : 'failed';
      const translated = i18n.getFixedT(
        'nb3-oa',
        locale,
      )(`transfer.errors.${key}`);
      if (
        error instanceof SalaryRangeError ||
        error instanceof SalaryTableError ||
        error instanceof TransferError ||
        error instanceof TransferSalaryError ||
        error instanceof HeadcountError
      ) {
        const reason =
          error instanceof SalaryRangeError ||
          error instanceof SalaryTableError ||
          error instanceof TransferError ||
          error instanceof TransferSalaryError
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
            domain: 'transfer',
            message: reason,
            localizedMessage: { locale, message: translated },
            metadata: { ns: 'nb3-oa', key: `transfer.errors.${key}` },
            cause: error,
          }),
          c,
        );
      }
      if (error instanceof LifecycleError) {
        const fields = lifecycleErrorFields(error);
        return apiErrorHandler(
          fields ? new ApiError({ ...fields, domain: 'transfer' }) : error,
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
            domain: 'transfer',
            message: error.message,
          }),
          c,
        );
      return apiErrorHandler(error, c);
    });
    async function policy(
      c: Context<AuthEnv & AuthorizationEnv>,
      action: string,
      resource = 'oa.transfer',
      collection = 'transferRequests',
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
          reason: 'TRANSFER_FORBIDDEN',
          domain: 'transfer',
          message: 'Transfer business permission is required.',
          metadata: { ns: 'nb3-oa', key: 'transfer.errors.denied' },
        });
      return result;
    }
    const declaration = (
      operationId: string,
      summary: string,
      schema: Parameters<typeof dataResponse>[0],
      created = false,
    ) =>
      describeRoute({
        tags: ['Transfer'],
        operationId,
        summary,
        responses: {
          [created ? '201' : '200']: dataResponse(schema),
          ...apiErrorResponses,
          '409': apiErrorResponse(409),
        },
      });
    router.get(
      '/transferRequests',
      declaration(
        'listTransferRequests',
        'List authorized transfer requests',
        S.List,
      ),
      apiValidator('query', S.ListQuery),
      async (c) => {
        const query = c.req.valid('query'),
          result = await service.listPage(query, await policy(c, 'view'));
        return c.json({
          data: result.items,
          meta: {
            page: query.page,
            pageSize: query.pageSize,
            total: result.total,
          },
        });
      },
    );
    router.post(
      '/transferRequests',
      declaration(
        'createTransferRequest',
        'Create transfer draft with private salary revision',
        S.Detail,
        true,
      ),
      apiValidator('json', S.Create),
      async (c) => {
        const body = c.req.valid('json'),
          actorId = c.get('auth')!.user.id;
        const ordinary = await policy(c, 'view');
        const record = await service.create(
          body.proposal,
          { actorId, requestKey: body.requestKey, reason: body.reason },
          { view: ordinary, write: await policy(c, 'submit') },
        );
        return c.json(
          {
            data: await service.detail(record.id, actorId, ordinary),
          },
          201,
        );
      },
    );
    router.get(
      '/transferRequests/capabilities',
      declaration(
        'getTransferCapabilities',
        'Get current HR initiation capability',
        S.Capabilities,
      ),
      async (c) => {
        await policy(c, 'view');
        let canCreateAsHR = false;
        try {
          const write = await policy(c, 'submit');
          canCreateAsHR =
            write.create !== false &&
            (await service.canCreateAsHR(c.get('auth')!.user.id));
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
        }
        return c.json({ data: { canCreateAsHR } });
      },
    );
    router.get(
      '/transferRequests/formOptions',
      declaration(
        'getTransferFormOptions',
        'Get current authorized personnel change form options',
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
            query.mode,
            { view, write, salary },
            query.requestId,
          ),
        });
      },
    );
    router.get(
      '/transferRequests/capacityOptions',
      declaration(
        'getTransferCapacityOptions',
        'Resolve actual initialized personnel change account identities',
        S.CapacityOptions,
      ),
      apiValidator('query', S.CapacityOptionsQuery),
      async (c) => {
        const query = c.req.valid('query'),
          view = await policy(c, 'view'),
          write = await policy(
            c,
            query.mode === 'reviewEdit' ? 'reviewEdit' : 'submit',
          );
        return c.json({
          data: await service.capacityOptions(c.get('auth')!.user.id, query, {
            view,
            write,
          }),
        });
      },
    );
    router.get(
      '/transferRequests/:id',
      declaration(
        'getTransferRequest',
        'Get safe transfer approval detail',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      async (c) =>
        c.json({
          data: await service.detail(
            c.req.valid('param').id,
            c.get('auth')!.user.id,
            await policy(c, 'view'),
          ),
        }),
    );
    router.get(
      '/transferRequests/:id/salary',
      declaration(
        'getTransferSalary',
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
      '/transferRequests/:id',
      declaration(
        'editTransferRequest',
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
          { view: await policy(c, 'view'), write: await policy(c, 'submit') },
        );
        return c.json({
          data: await service.detail(id, actorId, await policy(c, 'view')),
        });
      },
    );
    router.post(
      '/transferRequests/:id/reviewEdit',
      declaration(
        'reviewEditTransferRequest',
        'Revise only fields allowed by the current review stage and restart approval',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.ReviewEdit),
      async (c) => {
        const body = c.req.valid('json'),
          id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        const view = await policy(c, 'view'),
          write = await policy(c, 'reviewEdit');
        const salary =
          'targetSalary' in body.patch
            ? await policy(c, 'viewSalary')
            : undefined;
        await service.reviewEdit(
          id,
          body.patch,
          body.version,
          { actorId, requestKey: body.requestKey, reason: body.reason },
          { view, write, salary },
        );
        return c.json({ data: await service.detail(id, actorId, view) });
      },
    );
    router.post(
      '/transferRequests/:id/transitions',
      declaration(
        'transitionTransferRequest',
        'Submit withdraw or terminate transfer with version and replay protection',
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
          {
            view: await policy(c, 'view'),
            write: await policy(
              c,
              body.transition === 'requestCancellation' ? 'cancel' : 'submit',
            ),
          },
        );
        return c.json({
          data: await service.detail(id, actorId, await policy(c, 'view')),
        });
      },
    );
    router.post(
      '/transferRequests/:id/actions',
      declaration(
        'performTransferAction',
        'Perform an offered SDK action for this transfer',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.Action),
      async (c) => {
        const { requestKey, reason, ...input } = c.req.valid('json'),
          id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        const ordinary = await policy(c, 'view');
        await service.detail(id, actorId, ordinary);
        await service.action(
          id,
          { ...input, requestId: requestKey },
          { actorId, requestKey, reason },
          { view: ordinary, write: await policy(c, 'operate') },
        );
        return c.json({ data: await service.detail(id, actorId, ordinary) });
      },
    );
    router.post(
      '/transferRequests/:id/rebind',
      declaration(
        'rebindTransferCapacity',
        'Rebind approved personnel capacity to initialized current-year accounts',
        S.Detail,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.VersionCommand),
      async (c) => {
        const body = c.req.valid('json'),
          id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        const view = await policy(c, 'view');
        await service.rebind(
          id,
          body.version,
          { actorId, requestKey: body.requestKey, reason: body.reason },
          { view, write: await policy(c, 'rebind') },
        );
        return c.json({ data: await service.detail(id, actorId, view) });
      },
    );
    router.get(
      '/transferRequests/:id/candidates',
      declaration(
        'transferCandidates',
        'Search recipients for the current offered approval action',
        S.Candidates,
      ),
      apiValidator('param', S.Params),
      apiValidator('query', S.CandidatesQuery),
      async (c) => {
        const query = c.req.valid('query'),
          id = c.req.valid('param').id,
          actorId = c.get('auth')!.user.id;
        await service.detail(id, actorId, await policy(c, 'view'));
        return c.json({
          data: await service.candidates(
            id,
            query.taskId,
            query.action,
            actorId,
            query,
            await policy(c, 'operate'),
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
