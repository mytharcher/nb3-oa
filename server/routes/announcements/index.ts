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
import type { Application } from '@nocobase/app-server/application';
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
import { databaseManagerToken } from '@nocobase/db';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import {
  announcementServiceToken,
  AnnouncementError,
  type Announcement,
  type Receipt,
} from '../../providers/announcements/index.js';
import { knowledgeServiceToken } from '../../providers/knowledge/contract.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import {
  organizationServiceToken,
  ORG_SETTINGS,
} from '../../providers/org/index.js';
import * as S from './schemas.js';
import attachmentRoutes from './attachments.js';
type Env = AuthEnv & AuthorizationEnv;
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      db = c.resolve(databaseManagerToken),
      service = c.resolve(announcementServiceToken),
      r = new Hono<Env>();
    r.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    r.onError(async (error, ctx) => {
      if (!(error instanceof AnnouncementError))
        return apiErrorHandler(error, ctx);
      const code = error.code,
        i18n = c.resolve(i18nToken),
        locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
      await i18n.ensureLocaleLoaded(locale);
      return apiErrorHandler(
        new ApiError({
          domain: 'announcements',
          reason: code,
          message: code,
          status:
            code === 'ACCESS_DENIED'
              ? 'PERMISSION_DENIED'
              : code === 'NOT_FOUND'
                ? 'NOT_FOUND'
                : code.includes('CONFLICT')
                  ? 'ABORTED'
                  : 'FAILED_PRECONDITION',
          localizedMessage: {
            locale,
            message: i18n.getFixedT(
              'nb3-oa',
              locale,
            )(`announcements.errors.${code}`),
          },
        }),
        ctx,
      );
    });
    const actor = (ctx: Context<Env>) => ctx.get('auth')!.user.id;
    async function policy(
      ctx: Context<Env>,
      action: string,
      knowledge = false,
    ) {
      const result = await ctx.get('authz').authorize({
        resource: {
          type: 'composite',
          id: knowledge ? 'oa.knowledgeDocuments' : 'oa.announcements',
        },
        action,
      });
      const p =
        result.effect === 'deny'
          ? undefined
          : result.conditions?.database?.[
              knowledge ? 'knowledgeDocuments' : 'announcements'
            ];
      if (!p) throw new AnnouncementError('ACCESS_DENIED');
      return p;
    }
    async function rosterPolicy(ctx: Context<Env>) {
      const result = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.announcements' },
        action: 'receipts',
      });
      const p =
        result.effect === 'deny'
          ? undefined
          : result.conditions?.database?.announcementReceipts;
      const announcement =
        result.effect === 'deny'
          ? undefined
          : result.conditions?.database?.announcements;
      if (!p || !announcement) throw new AnnouncementError('ACCESS_DENIED');
      return { announcement, receipt: p };
    }
    async function dto(a: Announcement, ctx: Context<Env>) {
      const user = await c
        .resolve(userAdministrationServiceToken)
        .list({ userIds: [a.publisherUserId], pageSize: 1, kind: 'all' });
      let knowledgeLink: Announcement['knowledgeLink'] = null,
        hasNewVersion = false;
      if (a.knowledgeLink) {
        try {
          const result = await c
            .resolve(knowledgeServiceToken)
            .compareAnnouncementVersion(
              {
                documentId: a.knowledgeLink.documentId,
                versionId: a.knowledgeLink.versionId,
                actorId: actor(ctx),
              },
              db.connection(),
              await policy(ctx, 'view', true),
            );
          if (result.visible) {
            knowledgeLink = a.knowledgeLink;
            hasNewVersion = result.hasNewVersion;
          }
        } catch {
          /* Knowledge revocation never leaks the stored private title or version. */
        }
      }
      return S.Announcement.parse({
        ...a,
        publisher: {
          id: a.publisherUserId,
          name: user.items[0]?.name ?? a.publisherUserId,
        },
        knowledgeLink,
        hasNewVersion,
        validFrom: new Date(a.validFrom).toISOString(),
        validUntil: new Date(a.validUntil).toISOString(),
        publishedAt: a.publishedAt
          ? new Date(a.publishedAt).toISOString()
          : null,
      });
    }
    const receiptDto = (x: Receipt) =>
      S.Receipt.parse({
        ...x,
        user: { id: x.userId, name: x.name },
        confirmedAt: x.confirmedAt
          ? new Date(x.confirmedAt).toISOString()
          : null,
      });
    const gate =
      (action: string) =>
      async (ctx: Context<Env>, next: () => Promise<void>) => {
        await policy(ctx, action);
        await next();
      };
    const doc = (
      id: string,
      summary: string,
      schema:
        | typeof S.Detail
        | typeof S.Announcement
        | typeof S.Receipt
        | typeof S.Pending
        | ReturnType<typeof S.Receipt.array>,
      list = false,
    ) =>
      describeRoute({
        tags: ['Announcements'],
        operationId: id,
        summary,
        responses: {
          '200': list ? listResponse(schema, S.Meta) : dataResponse(schema),
          ...apiErrorResponses,
        },
      });
    r.get(
      '/context',
      describeRoute({
        tags: ['Announcements'],
        operationId: 'getAnnouncementContext',
        summary:
          'Read company time zone and independently authorized duty-role options',
        responses: { 200: dataResponse(S.Context), ...apiErrorResponses },
      }),
      async (ctx) => {
        await policy(ctx, 'view');
        const roles = await ctx.get('authz').authorize({
          resource: { type: 'settings', id: ORG_SETTINGS.dutyRoles },
          action: 'read',
        });
        return ctx.json({
          data: {
            timeZone: c.resolve(calendarServiceToken).timeZone(),
            dutyRoles:
              roles.effect === 'deny'
                ? null
                : (await c.resolve(organizationServiceToken).listDutyRoles())
                    .filter((role) => role.active)
                    .map((role) => ({ code: role.code, title: role.title })),
          },
        });
      },
    );
    r.get(
      '/pending',
      doc(
        'pendingAnnouncementReceipts',
        'Read own effective confirmation work items',
        S.Pending,
      ),
      async (ctx) => {
        const result = await service.pending(
          actor(ctx),
          db.connection(),
          await policy(ctx, 'view'),
        );
        return ctx.json({
          data: {
            ...result,
            items: result.items.map((i) => ({
              ...i,
              dueAt: i.dueAt.toISOString(),
            })),
          },
        });
      },
    );
    r.get(
      '/',
      doc(
        'listAnnouncements',
        'List authorized effective announcements or own drafts',
        S.Announcement,
        true,
      ),
      gate('view'),
      apiValidator('query', S.List),
      async (ctx) => {
        const q = ctx.req.valid('query'),
          p = await policy(ctx, 'view');
        const rows = await db
          .repository<Announcement>('announcements')
          .withPolicy(p)
          .findMany({
            sort: (s) => s.field('publishedAt').desc(),
          });
        const visible = [];
        for (const row of rows) {
          if (q.status && row.status !== q.status) continue;
          if (q.mode === 'mine' && row.publisherUserId !== actor(ctx)) continue;
          if (q.mode === 'received' && row.status !== 'published') continue;
          const a = await service.get(row.id!, actor(ctx), db.connection(), p);
          if (
            a &&
            !(
              q.mode === 'received' &&
              (new Date(a.validFrom) > new Date() ||
                new Date(a.validUntil) <= new Date())
            )
          )
            if (
              !q.q ||
              `${a.title} ${a.body}`
                .toLocaleLowerCase()
                .includes(q.q.toLocaleLowerCase())
            )
              visible.push(a);
        }
        visible.sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          const left =
            q.sort === 'title'
              ? a.title
              : q.sort === 'validUntil'
                ? new Date(a.validUntil).toISOString()
                : a.publishedAt
                  ? new Date(a.publishedAt).toISOString()
                  : '';
          const right =
            q.sort === 'title'
              ? b.title
              : q.sort === 'validUntil'
                ? new Date(b.validUntil).toISOString()
                : b.publishedAt
                  ? new Date(b.publishedAt).toISOString()
                  : '';
          return (
            (q.direction === 'asc' ? 1 : -1) * left.localeCompare(right) ||
            a.id.localeCompare(b.id)
          );
        });
        return ctx.json({
          data: await Promise.all(
            visible
              .slice((q.page - 1) * q.pageSize, q.page * q.pageSize)
              .map((a) => dto(a, ctx)),
          ),
          meta: { page: q.page, pageSize: q.pageSize, total: visible.length },
        });
      },
    );
    r.get(
      '/:id',
      doc(
        'getAnnouncement',
        'Read announcement with current knowledge version visibility and authorized current actions',
        S.Detail,
      ),
      gate('view'),
      apiValidator('param', S.Params),
      async (ctx) => {
        const a = await service.get(
          ctx.req.valid('param').id,
          actor(ctx),
          db.connection(),
          await policy(ctx, 'view'),
        );
        if (!a) throw new AnnouncementError('NOT_FOUND');
        const own = await service.ownReceipt(
          a.id,
          actor(ctx),
          db.connection(),
          await policy(ctx, 'view'),
        );
        const active =
          a.status === 'published' &&
          new Date(a.validFrom) <= new Date() &&
          new Date(a.validUntil) > new Date();
        const owned = a.publisherUserId === actor(ctx);
        const candidates = [
          ...(owned && a.status === 'draft'
            ? [
                'edit',
                ...(new Date(a.validUntil) > new Date() ? ['publish'] : []),
              ]
            : []),
          ...(owned && ['scheduled', 'published'].includes(a.status)
            ? ['revoke']
            : []),
          ...(owned && active && a.requiresConfirmation ? ['remind'] : []),
          ...(owned && a.status !== 'draft' ? ['receipts'] : []),
          ...(active && a.requiresConfirmation && own?.status === 'pending'
            ? ['confirm']
            : []),
        ];
        const actions: string[] = [];
        for (const action of candidates) {
          try {
            if (action === 'receipts') {
              const rp = await rosterPolicy(ctx);
              await service.receipts(
                a.id,
                actor(ctx),
                db.connection(),
                rp.announcement,
                rp.receipt,
              );
            } else {
              const p = await policy(ctx, action);
              const permitted = await service.get(
                a.id,
                actor(ctx),
                db.connection(),
                p,
              );
              if (!permitted) continue;
              if (action === 'publish' && a.knowledgeLink)
                await c.resolve(knowledgeServiceToken).snapshotForAnnouncement(
                  {
                    documentId: a.knowledgeLink.documentId,
                    actorId: actor(ctx),
                  },
                  db.connection(),
                  await policy(ctx, 'view', true),
                );
              if (action !== 'confirm') {
                const values =
                  action === 'edit'
                    ? {
                        title: a.title,
                        body: a.body,
                        audience: {
                          all: a.audience.all,
                          departmentIds: [...a.audience.departmentIds],
                          dutyRoleCodes: [...a.audience.dutyRoleCodes],
                        },
                        requiresConfirmation: a.requiresConfirmation,
                        pinned: a.pinned,
                        attachments: a.attachments,
                        knowledgeLink: a.knowledgeLink,
                        validFrom: a.validFrom,
                        validUntil: a.validUntil,
                        status: 'draft',
                        version: a.version + 1,
                        statusChangedAt: new Date(),
                      }
                    : {
                        status:
                          action === 'revoke'
                            ? 'revoked'
                            : action === 'publish' &&
                                new Date(a.validFrom) > new Date()
                              ? 'scheduled'
                              : 'published',
                        version: a.version + 1,
                        statusChangedAt: new Date(),
                        ...(action === 'publish'
                          ? { publishedAt: new Date() }
                          : {}),
                      };
                if (
                  !(
                    await db
                      .repository('announcements')
                      .withPolicy(p)
                      .validateMutation({
                        operation: 'updateOne',
                        filter: { id: a.id },
                        values,
                      })
                  ).valid
                )
                  continue;
              }
            }
            actions.push(action);
          } catch {
            /* A missing or narrowed independent grant never exposes an operation. */
          }
        }
        return ctx.json({
          data: S.Detail.parse({
            ...(await dto(a, ctx)),
            capabilities: {
              actions,
              ownReceipt: own
                ? {
                    status: own.status,
                    confirmedAt: own.confirmedAt
                      ? new Date(own.confirmedAt).toISOString()
                      : null,
                  }
                : null,
            },
          }),
        });
      },
    );
    r.post(
      '/',
      doc(
        'createAnnouncement',
        'Create audited notification draft',
        S.Announcement,
      ),
      gate('create'),
      apiValidator('json', S.Draft),
      async (ctx) => {
        const input = ctx.req.valid('json'),
          p = await policy(ctx, 'create'),
          kp = input.knowledgeDocumentId
            ? await policy(ctx, 'view', true)
            : undefined;
        const a = await db.transaction((tx) =>
          service.save({ ...input, actorId: actor(ctx) }, tx, p, kp),
        );
        return ctx.json({ data: await dto(a, ctx) });
      },
    );
    r.patch(
      '/:id',
      doc(
        'editAnnouncement',
        'Edit publisher draft with expected version',
        S.Announcement,
      ),
      gate('edit'),
      apiValidator('param', S.Params),
      apiValidator('json', S.Draft),
      async (ctx) => {
        const input = ctx.req.valid('json'),
          p = await policy(ctx, 'edit'),
          kp = input.knowledgeDocumentId
            ? await policy(ctx, 'view', true)
            : undefined;
        const a = await db.transaction((tx) =>
          service.save(
            { ...input, id: ctx.req.valid('param').id, actorId: actor(ctx) },
            tx,
            p,
            kp,
          ),
        );
        return ctx.json({ data: await dto(a, ctx) });
      },
    );
    for (const action of ['publish', 'revoke', 'remind'] as const)
      r.post(
        `/:id/${action}`,
        doc(
          `announcement${action}`,
          'Perform authorized publisher notification transition',
          S.Announcement,
        ),
        gate(action),
        apiValidator('param', S.Params),
        apiValidator('json', S.Action),
        async (ctx) => {
          const p = await policy(ctx, action);
          const current =
            action === 'publish'
              ? await service.get(
                  ctx.req.valid('param').id,
                  actor(ctx),
                  db.connection(),
                  p,
                )
              : undefined;
          const kp = current?.knowledgeLink
            ? await policy(ctx, 'view', true)
            : undefined;
          const a = await db.transaction((tx) =>
            service.act(
              {
                ...ctx.req.valid('json'),
                id: ctx.req.valid('param').id,
                actorId: actor(ctx),
                action,
              },
              tx,
              p,
              kp,
            ),
          );
          return ctx.json({ data: await dto(a, ctx) });
        },
      );
    r.post(
      '/:id/confirm',
      doc(
        'confirmAnnouncement',
        'Confirm only own effective receipt',
        S.Receipt,
      ),
      gate('confirm'),
      apiValidator('param', S.Params),
      apiValidator('json', S.Command),
      async (ctx) => {
        const p = await policy(ctx, 'confirm');
        return ctx.json({
          data: receiptDto(
            await db.transaction((tx) =>
              service.confirm(
                {
                  ...ctx.req.valid('json'),
                  id: ctx.req.valid('param').id,
                  actorId: actor(ctx),
                },
                tx,
                p,
              ),
            ),
          ),
        });
      },
    );
    r.get(
      '/:id/receipts',
      describeRoute({
        tags: ['Announcements'],
        operationId: 'listAnnouncementReceipts',
        summary: 'Read and filter authorized frozen publisher recipients',
        responses: {
          200: listResponse(S.Receipt, S.RosterMeta),
          ...apiErrorResponses,
        },
      }),
      async (ctx, next) => {
        await rosterPolicy(ctx);
        await next();
      },
      apiValidator('param', S.Params),
      apiValidator('query', S.RosterQuery),
      async (ctx) => {
        const policies = await rosterPolicy(ctx),
          q = ctx.req.valid('query');
        const rows = await service.receipts(
          ctx.req.valid('param').id,
          actor(ctx),
          db.connection(),
          policies.announcement,
          policies.receipt,
        );
        const pending = rows.filter((row) => row.status === 'pending').length;
        const confirmed = rows.length - pending;
        const filtered = rows
          .filter(
            (row) =>
              (q.status === 'all' || row.status === q.status) &&
              (!q.q ||
                row.name.toLocaleLowerCase().includes(q.q.toLocaleLowerCase())),
          )
          .sort(
            (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
          );
        return ctx.json({
          data: filtered
            .slice((q.page - 1) * q.pageSize, q.page * q.pageSize)
            .map(receiptDto),
          meta: {
            page: q.page,
            pageSize: q.pageSize,
            total: filtered.length,
            pending,
            confirmed,
          },
        });
      },
    );
    const mount = new Hono();
    mount.route('/announcements', r);
    return mount;
  }),
  ...attachmentRoutes,
];
