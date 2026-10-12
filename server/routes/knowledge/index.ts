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
import {
  knowledgeServiceToken,
  KnowledgeError,
} from '../../providers/knowledge/index.js';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import * as S from './schemas.js';
import { organizationServiceToken } from '../../providers/org/index.js';
import type { AuthorizationTitle } from '@nocobase/authorization/core';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const container = app.container,
      db = container.resolve(databaseManagerToken),
      service = container.resolve(knowledgeServiceToken);
    const router = new Hono(),
      routes = new Hono<Env>();
    routes.use(
      '*',
      container.resolve(authenticationToken).required(),
      container.resolve(authorizationToken).middleware(),
    );
    routes.onError(async (error, c) => {
      if (!(error instanceof KnowledgeError)) return apiErrorHandler(error, c);
      const i18n = container.resolve(i18nToken),
        locale = getRequestLocale(c) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return apiErrorHandler(
        new ApiError({
          domain: 'knowledge',
          reason: error.code,
          message: i18n.getFixedT(
            'nb3-oa',
            locale,
          )(`knowledge.errors.${error.code}`),
          status:
            error.code === 'BODY_TOO_LARGE'
              ? 'RESOURCE_EXHAUSTED'
              : error.code === 'ACCESS_DENIED'
                ? 'PERMISSION_DENIED'
                : error.code.endsWith('NOT_FOUND')
                  ? 'NOT_FOUND'
                  : error.code === 'VERSION_CONFLICT' ||
                      error.code === 'COMMAND_CONFLICT'
                    ? 'ABORTED'
                    : 'INVALID_ARGUMENT',
        }),
        c,
      );
    });
    const users = container.resolve(userAdministrationServiceToken);
    async function person(id: string) {
      return { id, name: (await users.get(id))?.name ?? id };
    }
    async function documentDTO(
      row: import('../../providers/knowledge/contract.js').KnowledgeDocument,
    ) {
      return { ...row, owner: await person(row.ownerId) };
    }
    const actor = (c: Context<Env>) => c.get('auth')!.user.id;
    async function policy(
      c: Context<Env>,
      collection:
        'knowledgeDocuments' | 'knowledgeFolders' | 'knowledgeVersions',
      action: string,
    ): Promise<RepositoryPolicy> {
      const decision = await c.get('authz').authorize({
        resource: {
          type: 'composite',
          id:
            collection !== 'knowledgeFolders'
              ? 'oa.knowledgeDocuments'
              : 'oa.knowledgeFolders',
        },
        action,
      });
      const p =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.[collection];
      if (!p) throw new KnowledgeError('ACCESS_DENIED');
      return p;
    }
    const doc = (
      operationId: string,
      summary: string,
      response: ReturnType<typeof dataResponse>,
    ) =>
      describeRoute({
        tags: ['Knowledge'],
        operationId,
        summary,
        responses: {
          '200': response,
          ...apiErrorResponses,
          ...(operationId.startsWith('list')
            ? {}
            : { '404': { description: 'Not found' } }),
          ...(operationId.startsWith('save') ||
          operationId.startsWith('publish')
            ? { '409': { description: 'Version or command conflict' } }
            : {}),
        },
      });
    routes.get(
      '/formOptions',
      doc(
        'getKnowledgeFormOptions',
        'Read current authorized knowledge publishing options',
        dataResponse(S.FormOptions),
      ),
      async (c, next) => {
        await policy(c, 'knowledgeDocuments', 'manage');
        await policy(c, 'knowledgeVersions', 'manage');
        await policy(c, 'knowledgeFolders', 'view');
        return next();
      },
      apiValidator('query', S.OptionsQuery),
      async (c) => {
        const query = c.req.valid('query'),
          p = await policy(c, 'knowledgeDocuments', 'manage'),
          vp = await policy(c, 'knowledgeVersions', 'manage'),
          fp = await policy(c, 'knowledgeFolders', 'view');
        const read = query.documentId
            ? await policy(c, 'knowledgeDocuments', 'view')
            : undefined,
          vr = query.documentId
            ? await policy(c, 'knowledgeVersions', 'view')
            : undefined;
        const context = await db.transaction(async (tx) => {
          const folders = await service.folders(tx, fp);
          if (!query.documentId) {
            if (!p.create || !vp.create)
              throw new KnowledgeError('ACCESS_DENIED');
            return {
              folders,
              canCreate: true,
              canEdit: false,
              departmentIds: [] as string[],
              dutyRoleCodes: [] as string[],
            };
          }
          if (!read || !vr) throw new KnowledgeError('ACCESS_DENIED');
          const detail = await service.detail(
            query.documentId,
            actor(c),
            tx,
            read,
            vr,
          );
          const checked = await tx
            .repository('knowledgeDocuments')
            .withPolicy(p)
            .validateMutation({
              operation: 'updateOne',
              filter: { id: query.documentId },
              values: { ...detail.document },
            });
          if (!checked.valid || !vp.create)
            throw new KnowledgeError('ACCESS_DENIED');
          return {
            folders,
            canCreate: !!p.create && !!vp.create,
            canEdit: true,
            departmentIds: detail.document.departmentIds,
            dutyRoleCodes: detail.document.dutyRoleCodes,
          };
        });
        // Publishing managers choose audience identities, not organization membership.
        // This controlled facade exposes only active option names via the public service.
        const organization = container.resolve(organizationServiceToken);
        const page = await (query.kind === 'department'
          ? organization.listDepartmentOptions(query)
          : organization.listDutyRoleOptions(query));
        const activeDepartments = await organization.filterActive(
            context.departmentIds,
          ),
          activeRoles = await organization.filterActiveDutyRoles(
            context.dutyRoleCodes,
          );
        const selectedDepartments =
            await organization.resolveDepartments(activeDepartments),
          selectedRoles = await organization.resolveDutyRoles(activeRoles);
        const locale =
            getRequestLocale(c) ??
            container.resolve(i18nToken).getDefaultLocale(),
          i18n = container.resolve(i18nToken);
        await i18n.ensureLocaleLoaded(locale);
        const title = (value: AuthorizationTitle) =>
          typeof value === 'string'
            ? value
            : i18n.getFixedT(value.ns ?? 'nb3-oa', locale)(value.key);
        const option = (value: { id: string; title: AuthorizationTitle }) => ({
          id: value.id,
          title: title(value.title),
        });
        return c.json({
          data: {
            canCreate: context.canCreate,
            canEdit: context.canEdit,
            folders: context.folders,
            audience: {
              kind: query.kind,
              items: page.items.map(option),
              total: page.total,
              page: query.page,
              pageSize: query.pageSize,
            },
            selected: {
              departments: selectedDepartments.map(option),
              dutyRoles: selectedRoles.map(option),
            },
            restrictedSelected:
              context.departmentIds.length +
              context.dutyRoleCodes.length -
              selectedDepartments.length -
              selectedRoles.length,
          },
        });
      },
    );
    routes.get(
      '/folders',
      doc(
        'listKnowledgeFolders',
        'List knowledge directory tree',
        listResponse(S.Folder, S.Meta),
      ),
      async (c) => {
        const p = await policy(c, 'knowledgeFolders', 'view');
        const rows = await db.transaction((tx) => service.folders(tx, p));
        return c.json({ data: rows, meta: { total: rows.length } });
      },
    );
    routes.post(
      '/folders',
      doc(
        'saveKnowledgeFolder',
        'Create or move a knowledge folder',
        dataResponse(S.Folder),
      ),
      apiValidator('json', S.FolderInput),
      async (c) => {
        const p = await policy(c, 'knowledgeFolders', 'manage');
        return c.json({
          data: await db.transaction((tx) =>
            service.saveFolder(
              { ...c.req.valid('json'), actorId: actor(c) },
              tx,
              p,
            ),
          ),
        });
      },
    );
    routes.get(
      '/documents',
      doc(
        'listKnowledgeDocuments',
        'List visible knowledge documents',
        listResponse(S.Document, S.Meta),
      ),
      async (c, next) => {
        await policy(c, 'knowledgeDocuments', 'view');
        return next();
      },
      apiValidator('query', S.ListQuery),
      async (c) => {
        const p = await policy(c, 'knowledgeDocuments', 'view'),
          query = c.req.valid('query');
        const result = await db.transaction((tx) =>
          service.listPage(actor(c), tx, p, {
            ...query,
            folderId: query.folderId === 'root' ? null : query.folderId,
          }),
        );
        return c.json({
          data: await Promise.all(result.items.map(documentDTO)),
          meta: {
            total: result.total,
            page: query.page,
            pageSize: query.pageSize,
          },
        });
      },
    );
    routes.get(
      '/documents/:id',
      doc(
        'getKnowledgeDocument',
        'Read visible document and immutable versions',
        dataResponse(S.Detail),
      ),
      apiValidator('param', S.DocumentParams),
      async (c) => {
        const p = await policy(c, 'knowledgeDocuments', 'view'),
          vp = await policy(c, 'knowledgeVersions', 'view');
        const detail = await db.transaction((tx) =>
          service.detail(c.req.valid('param').id, actor(c), tx, p, vp),
        );
        return c.json({
          data: {
            document: await documentDTO(detail.document),
            versions: await Promise.all(
              detail.versions.map(async (v) => ({
                ...v,
                author: await person(v.authorId),
              })),
            ),
          },
        });
      },
    );
    routes.post(
      '/documents',
      doc(
        'publishKnowledgeDocument',
        'Publish an immutable document version',
        dataResponse(S.Document),
      ),
      apiValidator('json', S.SaveInput),
      async (c) => {
        const p = await policy(c, 'knowledgeDocuments', 'manage'),
          vp = await policy(c, 'knowledgeVersions', 'manage'),
          fp = await policy(c, 'knowledgeFolders', 'view');
        const row = await db.transaction((tx) =>
          service.save(
            { ...c.req.valid('json'), actorId: actor(c) },
            tx,
            p,
            vp,
            fp,
          ),
        );
        return c.json({ data: await documentDTO(row) });
      },
    );
    // This is the only upload exposure: stored bytes have no public content contribution.
    routes.post(
      '/files',
      describeRoute({
        tags: ['Knowledge'],
        operationId: 'uploadKnowledgeFile',
        summary: 'Upload knowledge source owned by caller',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  requestKey: { type: 'string', maxLength: 128 },
                },
                required: ['file', 'requestKey'],
              },
            },
          },
        },
        responses: {
          '200': dataResponse(S.File),
          ...apiErrorResponses,
          '400': { description: 'Invalid upload' },
          '413': { description: 'Upload too large' },
        },
      }),
      async (c, next) => {
        const p = await policy(c, 'knowledgeDocuments', 'manage');
        if (!p.create) throw new KnowledgeError('ACCESS_DENIED');
        return next();
      },
      bodyLimit({
        maxSize: 21 * 1024 * 1024,
        onError: () => {
          throw new KnowledgeError('BODY_TOO_LARGE');
        },
      }),
      apiValidator('form', S.UploadInput),
      async (c) => {
        const { file, requestKey } = c.req.valid('form');
        return c.json({
          data: await service.upload(actor(c), file, requestKey),
        });
      },
    );
    routes.get(
      '/documents/:id/versions/:versionId/file',
      doc(
        'getKnowledgeVersionFile',
        'Read currently authorized version file preview metadata',
        dataResponse(S.VersionFile),
      ),
      async (c, next) => {
        await policy(c, 'knowledgeDocuments', 'view');
        await policy(c, 'knowledgeVersions', 'view');
        return next();
      },
      apiValidator('param', S.ContentParams),
      async (c) => {
        const p = await policy(c, 'knowledgeDocuments', 'view'),
          vp = await policy(c, 'knowledgeVersions', 'view'),
          { id, versionId } = c.req.valid('param');
        const file = await db.transaction((tx) =>
          service.versionFile(id, versionId, actor(c), tx, p, vp),
        );
        return c.json({
          data: {
            ...file,
            // API contribution requests are relative to the application mount.
            // Browser byte URLs must include its public deployment base path.
            contentUrl: `${app.publicBasePath.replace(/\/$/, '')}/api/knowledge/documents/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/content`,
          },
        });
      },
    );
    routes.get(
      '/documents/:id/versions/:versionId/content',
      describeRoute({
        tags: ['Knowledge'],
        operationId: 'downloadKnowledgeVersion',
        summary:
          'Download or locally preview authorized immutable document bytes',
        responses: {
          '200': {
            description: 'Authorized file bytes',
            content: {
              'application/octet-stream': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          ...apiErrorResponses,
          '404': { description: 'Not found' },
        },
      }),
      apiValidator('param', S.ContentParams),
      async (c) => {
        const p = await policy(c, 'knowledgeDocuments', 'view'),
          vp = await policy(c, 'knowledgeVersions', 'view'),
          { id, versionId } = c.req.valid('param');
        const result = await db.transaction((tx) =>
          service.content(id, versionId, actor(c), tx, p, vp),
        );
        const filename = encodeURIComponent(
          result.filename.replace(/[\r\n]/g, '_'),
        ).replace(
          /['()*]/g,
          (x) => `%${x.charCodeAt(0).toString(16).toUpperCase()}`,
        );
        return new Response(new Uint8Array(result.bytes), {
          headers: {
            'content-type': result.mimeType,
            'content-disposition': `attachment; filename="document"; filename*=UTF-8''${filename}`,
            'cache-control': 'private, no-store',
            'x-content-type-options': 'nosniff',
            'content-security-policy': "sandbox; default-src 'none'",
          },
        });
      },
    );
    router.route('/knowledge', routes);
    return router;
  }),
];
