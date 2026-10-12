import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
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
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import {
  templatePrintServiceToken,
  printSourceRegistryToken,
} from '../../providers/template-print/contract.js';
import { TemplatePrintError } from '../../providers/template-print/validation.js';
import { authorizeCompleteDetail } from '../../providers/template-print/sources.js';
import { DOCX_MIME } from '../../providers/template-print/renderer.js';
import * as S from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
const docxResponse = {
  description: 'Authorized DOCX bytes',
  content: { [DOCX_MIME]: { schema: { type: 'string', format: 'binary' } } },
} as const;
function disposition(filename: string) {
  const clean = [...filename]
    .map((c) =>
      c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 || /[/\\]/.test(c)
        ? '_'
        : c,
    )
    .join('')
    .slice(0, 180);
  return `attachment; filename="document.docx"; filename*=UTF-8''${encodeURIComponent(clean).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())}`;
}
export default [
  defineApiRoutes<Application>((app) => {
    const container = app.container,
      service = container.resolve(templatePrintServiceToken),
      sources = container.resolve(printSourceRegistryToken),
      db = container.resolve(databaseManagerToken),
      i18n = container.resolve(i18nToken);
    const router = new Hono(),
      routes = new Hono<Env>();
    routes.use(
      '*',
      container.resolve(authenticationToken).required(),
      container.resolve(authorizationToken).middleware(),
    );
    routes.onError(async (error, c) => {
      if (!(error instanceof TemplatePrintError))
        return apiErrorHandler(error, c);
      const status = error.code.endsWith('DENIED')
        ? 'PERMISSION_DENIED'
        : error.code.endsWith('CONFLICT')
          ? 'ABORTED'
          : error.code === 'PRINT_SOURCE_UNAVAILABLE'
            ? 'FAILED_PRECONDITION'
            : 'INVALID_ARGUMENT';
      const locale = getRequestLocale(c) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      const t = i18n.getFixedT('nb3-oa', locale);
      return apiErrorHandler(
        new ApiError({
          status,
          domain: 'templatePrint',
          reason: error.code,
          message: t(`templatePrint.errors.${error.code}`),
        }),
        c,
      );
    });
    async function policy(
      c: Pick<Context<Env>, 'get'>,
      resource: string,
      action: string,
      collection: string,
    ): Promise<RepositoryPolicy> {
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
      if (!result) throw new TemplatePrintError('PRINT_PERMISSION_DENIED');
      return result;
    }
    const actor = (c: Pick<Context<Env>, 'get'>) => c.get('auth')!.user.id;
    const description = (
      summary: string,
      operationId: string,
      response: ReturnType<typeof dataResponse> | typeof docxResponse,
    ) =>
      describeRoute({
        tags: ['Template printing'],
        summary,
        operationId,
        responses: {
          '200': response,
          ...apiErrorResponses,
          '409': { description: 'Version or command conflict' },
        },
      });
    routes.get(
      '/',
      description(
        'List authorized print templates',
        'listPrintTemplates',
        listResponse(S.TemplateSchema, S.ListMeta),
      ),
      apiValidator('query', S.ListQuery),
      async (c) => {
        const q = c.req.valid('query');
        return c.json(
          await service.list(
            await policy(c, 'oa.templatePrint', q.mode, 'printTemplates'),
            q.page,
            q.pageSize,
            q.source,
          ),
        );
      },
    );
    routes.post(
      '/',
      describeRoute({
        tags: ['Template printing'],
        summary: 'Create print template metadata',
        operationId: 'createPrintTemplate',
        responses: {
          '201': dataResponse(S.CommandSchema),
          ...apiErrorResponses,
        },
      }),
      apiValidator('json', S.CreateInput),
      async (c) =>
        c.json(
          {
            data: await service.create(
              actor(c),
              c.req.valid('json'),
              await policy(c, 'oa.templatePrint', 'manage', 'printTemplates'),
            ),
          },
          201,
        ),
    );
    routes.get(
      '/:templateId',
      description(
        'Get authorized print template and revisions',
        'getPrintTemplate',
        dataResponse(S.DetailSchema),
      ),
      apiValidator('param', S.Params),
      apiValidator('query', S.DetailQuery),
      async (c) =>
        c.json({
          data: await service.detail(
            c.req.valid('param').templateId,
            await policy(
              c,
              'oa.templatePrint',
              c.req.valid('query').mode,
              'printTemplates',
            ),
          ),
        }),
    );
    routes.patch(
      '/:templateId',
      description(
        'Update template metadata with version checking',
        'updatePrintTemplate',
        dataResponse(S.CommandSchema),
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.UpdateInput),
      async (c) =>
        c.json({
          data: await service.update(
            c.req.valid('param').templateId,
            actor(c),
            c.req.valid('json'),
            await policy(c, 'oa.templatePrint', 'manage', 'printTemplates'),
          ),
        }),
    );
    // Authorization precedes multipart parsing and its size limit. No generated public File Repository content route is mounted.
    routes.use('/:templateId/revisions', async (c, next) => {
      await policy(c, 'oa.templatePrint', 'manage', 'printTemplates');
      await next();
    });
    routes.post(
      '/:templateId/revisions',
      description(
        'Validate and upload an immutable DOCX revision',
        'uploadPrintTemplateRevision',
        dataResponse(S.CommandSchema),
      ),
      apiValidator('param', S.Params),
      bodyLimit({
        maxSize: 5 * 1024 * 1024 + 65536,
        onError: () => {
          throw new TemplatePrintError('PRINT_TEMPLATE_INVALID');
        },
      }),
      apiValidator('form', S.UploadInput),
      async (c) =>
        c.json({
          data: await service.upload(
            c.req.valid('param').templateId,
            actor(c),
            c.req.valid('form'),
            await policy(c, 'oa.templatePrint', 'manage', 'printTemplates'),
          ),
        }),
    );
    routes.get(
      '/:templateId/revisions/:revisionId/content',
      description(
        'Download a managed template revision',
        'downloadPrintTemplateRevision',
        docxResponse,
      ),
      apiValidator('param', S.RevisionParams),
      async (c) => {
        const p = c.req.valid('param');
        const result = await service.download(
          p.templateId,
          p.revisionId,
          await policy(c, 'oa.templatePrint', 'manage', 'printTemplates'),
        );
        return new Response(result.bytes, {
          headers: {
            'Content-Type': DOCX_MIME,
            'Cache-Control': 'private, no-store',
            'Content-Disposition': disposition(result.filename),
            'X-Content-Type-Options': 'nosniff',
          },
        });
      },
    );
    routes.post(
      '/:templateId/render',
      description(
        'Render one authorized business record into DOCX',
        'renderPrintTemplate',
        docxResponse,
      ),
      apiValidator('param', S.Params),
      apiValidator('json', S.RenderInput),
      async (c) => {
        const id = c.req.valid('param').templateId,
          use = await policy(c, 'oa.templatePrint', 'use', 'printTemplates');
        const detail = await service.detail(id, use);
        const source = sources.get(detail.record.source);
        if (!source) throw new TemplatePrintError('PRINT_SOURCE_UNAVAILABLE');
        const print = await policy(
          c,
          'oa.templatePrint',
          `print${source.name[0].toUpperCase()}${source.name.slice(1)}`,
          'printTemplates',
        );
        if (
          !(await db
            .repository('printTemplates')
            .withPolicy(print)
            .exists({ filter: { id } }))
        )
          throw new TemplatePrintError('PRINT_TEMPLATE_DENIED');
        const printSource = await policy(
          c,
          'oa.templatePrint',
          `print${source.name[0].toUpperCase()}${source.name.slice(1)}`,
          source.collection,
        );
        await authorizeCompleteDetail(
          db,
          source.collection,
          c.req.valid('json').recordId,
          printSource,
        );
        const view = await policy(
          c,
          source.viewResource,
          'view',
          source.collection,
        );
        const result = await service.render(
          id,
          actor(c),
          { ...c.req.valid('json'), signal: c.req.raw.signal },
          use,
          view,
        );
        return new Response(result.bytes, {
          headers: {
            'Content-Type': result.mimeType,
            'Cache-Control': 'private, no-store',
            'Content-Disposition': disposition(result.filename),
            'X-Content-Type-Options': 'nosniff',
          },
        });
      },
    );
    router.route('/printTemplates', routes);
    return router;
  }),
];
