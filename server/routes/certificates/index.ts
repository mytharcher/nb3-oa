import { Hono, type Context } from 'hono';
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
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import type { Application } from '@nocobase/app-server/application';
import type { RepositoryPolicy } from '@nocobase/db';
import { ApprovalError } from '@nocobase/app-plugin-approval/server';
import { LifecycleError } from '@nocobase/lifecycle';
import {
  certificateRequestServiceToken,
  type CertificateRequest,
} from '../../providers/certificates/contract.js';
import { CertificateError } from '../../providers/certificates/service.js';
import * as S from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const ctn = app.container,
      requests = ctn.resolve(certificateRequestServiceToken),
      users = ctn.resolve(userAdministrationServiceToken),
      router = new Hono<Env>();
    router.use(
      '*',
      ctn.resolve(authenticationToken).required(),
      ctn.resolve(authorizationToken).middleware(),
    );
    router.onError(async (error, c) => {
      if (error instanceof ApprovalError || error instanceof LifecycleError)
        error = new CertificateError('CERTIFICATE_APPROVAL_REFUSED');
      if (!(error instanceof CertificateError))
        return apiErrorHandler(error, c);
      const i18n = ctn.resolve(i18nToken),
        locale = getRequestLocale(c) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return apiErrorHandler(
        new ApiError({
          domain: 'certificates',
          reason: error.code,
          message: i18n.getFixedT(
            'nb3-oa',
            locale,
          )(`certificates.errors.${error.code}`),
          status:
            error.code.includes('DENIED') || error.code.endsWith('REQUIRED')
              ? 'PERMISSION_DENIED'
              : error.code.includes('MISSING')
                ? 'NOT_FOUND'
                : error.code.includes('STALE') ||
                    error.code.includes('CONFLICT')
                  ? 'ABORTED'
                  : 'INVALID_ARGUMENT',
        }),
        c,
      );
    });
    const actor = (c: Context<Env>) => c.get('auth')!.user.id;
    async function policy(
      c: Context<Env>,
      resource: string,
      action: string,
      collection: string,
    ) {
      const decision = await c
        .get('authz')
        .authorize({ resource: { type: 'composite', id: resource }, action });
      const p =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.[collection];
      if (!p) throw new CertificateError('CERTIFICATE_ACCESS_DENIED');
      return p;
    }
    async function access(c: Context<Env>, action: string, issue = false) {
      const view = await policy(
          c,
          'oa.certificateRequests',
          'view',
          'certificateRequests',
        ),
        requests = await policy(
          c,
          'oa.certificateRequests',
          action,
          'certificateRequests',
        );
      let income: RepositoryPolicy | undefined,
        template: RepositoryPolicy | undefined,
        templateRevision: RepositoryPolicy | undefined,
        printSource: RepositoryPolicy | undefined;
      try {
        income = await policy(
          c,
          'oa.certificateRequests',
          'viewIncome',
          'certificatePreparationPrivate',
        );
      } catch (error) {
        if (!(error instanceof CertificateError)) throw error;
      }
      if (issue) {
        printSource = await policy(
          c,
          'oa.templatePrint',
          'printCertificates',
          'certificateRequests',
        );
        templateRevision = await policy(
          c,
          'oa.templatePrint',
          'use',
          'printTemplateRevisions',
        );
        template = await policy(c, 'oa.templatePrint', 'use', 'printTemplates');
      }
      return {
        requests,
        view,
        issue: issue
          ? await policy(
              c,
              'oa.certificateRequests',
              'issue',
              'certificateRequests',
            )
          : requests,
        income,
        template,
        templateRevision,
        printSource,
      };
    }
    const person = async (id: string) => ({
      id,
      name: (await users.get(id))?.name ?? id,
    });
    async function dto(r: CertificateRequest & { number?: string | null }) {
      return {
        id: r.id,
        ...(r.number !== undefined ? { number: r.number } : {}),
        certificateType: r.certificateType,
        purpose: r.purpose,
        copies: r.copies,
        deliveryMethod: r.deliveryMethod,
        applicantId: r.applicantId,
        applicant: await person(r.applicantId),
        createdById: r.createdById,
        createdBy: await person(r.createdById),
        employeeId: r.employeeId,
        departmentId: r.departmentId,
        preparationId: r.preparationId,
        issueId: r.issueId,
        status: r.status,
        lifecycleVersion: r.lifecycleVersion,
        submittedAt: r.submittedAt,
        createdAt: r.createdAt,
        statusChangedAt: r.statusChangedAt,
        exceptionReason: r.exceptionReason,
        administrativeReason: r.administrativeReason,
      };
    }
    const doc = (
      operationId: string,
      schema: Parameters<typeof dataResponse>[0],
    ) =>
      describeRoute({
        tags: ['Certificates'],
        operationId,
        responses: {
          '200': dataResponse(schema),
          ...apiErrorResponses,
          '400': { description: 'Invalid input or approval action' },
          '404': { description: 'Unavailable source' },
          '409': { description: 'Stale source or command conflict' },
        },
      });
    router.get(
      '/certificateRequests',
      doc('certificateList', S.List),
      apiValidator('query', S.Query),
      async (c) => {
        const result = await requests.list(
          await policy(
            c,
            'oa.certificateRequests',
            'view',
            'certificateRequests',
          ),
          c.req.valid('query'),
        );
        return c.json({
          data: {
            items: await Promise.all(result.items.map(dto)),
            total: result.total,
          },
        });
      },
    );
    router.post(
      '/certificateRequests',
      doc('certificateCreate', S.Record),
      apiValidator('json', S.Create),
      async (c) => {
        const { requestKey, ...input } = c.req.valid('json');
        return c.json({
          data: await dto(
            await requests.create(
              actor(c),
              input,
              requestKey,
              await access(c, 'create'),
            ),
          ),
        });
      },
    );
    router.get(
      '/certificateRequests/:id',
      doc('certificateDetail', S.Detail),
      apiValidator('param', S.Params),
      async (c) => {
        const d = await requests.detail(
          c.req.valid('param').id,
          actor(c),
          await policy(
            c,
            'oa.certificateRequests',
            'view',
            'certificateRequests',
          ),
        );
        const optional = async (
          action: string,
          collection = 'certificateRequests',
          resource = 'oa.certificateRequests',
        ) => {
          try {
            return await policy(c, resource, action, collection);
          } catch (error) {
            if (error instanceof CertificateError) return undefined;
            throw error;
          }
        };
        const capabilities = await requests.capabilities(
          d.record.id,
          actor(c),
          {
            view: await policy(
              c,
              'oa.certificateRequests',
              'view',
              'certificateRequests',
            ),
            edit: await optional('edit'),
            operate: await optional('operate'),
            issue: await optional('issue'),
            income: await optional(
              'viewIncome',
              'certificatePreparationPrivate',
            ),
            printSource: await optional(
              'printCertificates',
              'certificateRequests',
              'oa.templatePrint',
            ),
            template: await optional(
              'use',
              'printTemplates',
              'oa.templatePrint',
            ),
            templateRevision: await optional(
              'use',
              'printTemplateRevisions',
              'oa.templatePrint',
            ),
          },
        );
        return c.json({
          data: {
            capabilities,
            record: await dto(d.record),
            tasks: await Promise.all(
              d.tasks.map(async (t) => ({
                id: t.id,
                runId: t.runId,
                status: t.status,
                assigneeId: t.assigneeId,
                assignee: t.assigneeId ? await person(t.assigneeId) : null,
              })),
            ),
            runs: d.runs.map((r) => ({
              id: r.id,
              status: r.status,
              contentHash: r.contentHash,
            })),
            actions: await Promise.all(
              d.actions.map(async (a) => ({
                id: a.id,
                action: a.name,
                actorId: a.actorId,
                actor: await person(a.actorId),
                createdAt: a.at,
              })),
            ),
          },
        });
      },
    );
    router.put(
      '/certificateRequests/:id',
      doc('certificateEdit', S.Record),
      apiValidator('param', S.Params),
      apiValidator('json', S.Edit),
      async (c) => {
        const { requestKey, expectedVersion, ...input } = c.req.valid('json');
        return c.json({
          data: await dto(
            await requests.change(
              c.req.valid('param').id,
              actor(c),
              'edit',
              input,
              requestKey,
              expectedVersion,
              await access(c, 'edit'),
            ),
          ),
        });
      },
    );
    for (const transition of [
      'submit',
      'withdraw',
      'terminate',
      'forceComplete',
      'retry',
    ])
      router.post(
        `/certificateRequests/:id/${transition}`,
        doc(`certificate${transition}`, S.Record),
        apiValidator('param', S.Params),
        apiValidator('json', S.Command),
        async (c) => {
          const { requestKey, expectedVersion, ...input } = c.req.valid('json');
          return c.json({
            data: await dto(
              await requests.change(
                c.req.valid('param').id,
                actor(c),
                transition,
                input,
                requestKey,
                expectedVersion,
                await access(c, transition === 'submit' ? 'edit' : 'operate'),
              ),
            ),
          });
        },
      );
    router.post(
      '/certificateRequests/:id/actions',
      describeRoute({
        tags: ['Certificates'],
        operationId: 'certificateAction',
        responses: {
          '200': { description: 'Accepted approval action' },
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', S.Params),
      apiValidator('json', S.Action),
      async (c) => {
        const input = c.req.valid('json');
        await requests.perform(
          c.req.valid('param').id,
          actor(c),
          input,
          await access(c, 'operate', input.action === 'complete'),
        );
        return c.json({ data: { accepted: true } });
      },
    );
    router.post(
      '/certificateRequests/:id/prepare',
      doc('certificatePrepare', S.Preparation),
      apiValidator('param', S.Params),
      apiValidator('json', S.Prepare),
      async (c) => {
        const p = await requests.prepare(
          c.req.valid('param').id,
          actor(c),
          c.req.valid('json'),
          await access(c, 'operate', true),
        );
        return c.json({
          data: {
            id: p.id,
            number: p.number,
            issueDate: p.issueDate,
            status: p.status,
            revisionId: p.revisionId,
          },
        });
      },
    );
    router.post(
      '/certificatePreparations/:id/generate',
      doc('certificateGenerate', S.Generated),
      apiValidator('param', S.Params),
      apiValidator('json', S.Params.pick({})),
      async (c) =>
        c.json({
          data: await requests.generate(
            c.req.valid('param').id,
            actor(c),
            await access(c, 'operate', true),
          ),
        }),
    );
    router.get(
      '/certificateIssues/:id/content',
      describeRoute({
        tags: ['Certificates'],
        operationId: 'certificateContent',
        responses: {
          '200': {
            description: 'Guarded DOCX bytes',
            content: {
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                { schema: { type: 'string', format: 'binary' } },
            },
          },
          ...apiErrorResponses,
        },
      }),
      apiValidator('param', S.Params),
      async (c) => {
        const content = await requests.content(
          c.req.valid('param').id,
          actor(c),
          await access(c, 'view'),
        );
        c.header('Cache-Control', 'private, no-store');
        c.header('X-Content-Type-Options', 'nosniff');
        c.header('Content-Security-Policy', "sandbox; default-src 'none'");
        c.header(
          'Content-Disposition',
          `attachment; filename*=UTF-8''${encodeURIComponent(content.filename)}`,
        );
        return c.body(new Uint8Array(content.bytes), 200, {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });
      },
    );
    return new Hono().route('/', router);
  }),
];
