import { Hono, type Context } from 'hono';
import {
  userAdministrationServiceToken,
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
  apiErrorHandler,
  apiErrorResponses,
  apiValidator,
  dataResponse,
  listResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import {
  VENDOR_BANK_FIELDS,
  vendorServiceToken,
  VendorError,
} from '../../providers/vendors/index.js';
import {
  Params,
  ListQuery,
  CreateInput,
  UpdateInput,
  VendorSchema,
  Meta,
} from './schemas.js';
export default [
  defineApiRoutes<Application>((app) => {
    const c = app.container,
      service = c.resolve(vendorServiceToken),
      db = c.resolve(databaseManagerToken);
    const router = new Hono<AuthEnv & AuthorizationEnv>();
    router.use(
      '*',
      c.resolve(authenticationToken).required(),
      c.resolve(authorizationToken).middleware(),
    );
    router.onError((e, ctx) =>
      apiErrorHandler(
        e instanceof VendorError
          ? new ApiError({
              status:
                e.kind === 'notFound'
                  ? 'NOT_FOUND'
                  : e.kind === 'conflict'
                    ? 'ABORTED'
                    : 'INVALID_ARGUMENT',
              domain: 'vendors',
              reason: e.code,
              message: e.message,
              cause: e,
            })
          : e,
        ctx,
      ),
    );
    async function policy(
      ctx: Context<AuthEnv & AuthorizationEnv>,
      action: 'view' | 'manage' | 'bankRead',
      required = true,
    ) {
      const decision = await ctx.get('authz').authorize({
        resource: { type: 'composite', id: 'oa.vendors' },
        action,
      });
      const scoped =
        decision.effect === 'deny'
          ? undefined
          : (
              decision.conditions?.database as
                Record<string, RepositoryPolicy | false | undefined> | undefined
            )?.vendors || undefined;
      if (!scoped && required)
        throw new ApiError({
          status: 'PERMISSION_DENIED',
          domain: 'vendors',
          reason: 'VENDOR_ACCESS_DENIED',
          message: 'No grant permits this vendor operation.',
        });
      return scoped;
    }
    async function readPolicy(ctx: Context<AuthEnv & AuthorizationEnv>) {
      return (await policy(ctx, 'view'))!;
    }
    async function enrichBanks(
      rows: Partial<import('../../providers/vendors/contract.js').Vendor>[],
      ctx: Context<AuthEnv & AuthorizationEnv>,
    ) {
      const scoped = await policy(ctx, 'bankRead', false);
      if (!scoped) return rows;
      return Promise.all(
        rows.map(async (row) => {
          if (!row.id) return row;
          const bank = await service.get(row.id, undefined, scoped);
          if (!bank) return row;
          const fields: Partial<
            import('../../providers/vendors/contract.js').Vendor
          > = {};
          for (const field of VENDOR_BANK_FIELDS)
            if (typeof bank[field] === 'string') fields[field] = bank[field];
          return { ...row, ...fields };
        }),
      );
    }
    async function enrichPeople(
      rows: Partial<import('../../providers/vendors/contract.js').Vendor>[],
    ) {
      const users = c.resolve(userAdministrationServiceToken);
      return Promise.all(
        rows.map(async (row) => {
          if (!row.createdById) return row;
          const person = await users.get(row.createdById);
          return {
            ...row,
            createdBy: person
              ? { id: person.id, name: person.name }
              : { id: row.createdById, name: row.createdById },
          };
        }),
      );
    }
    const doc = (id: string, summary: string, list = false) =>
      describeRoute({
        tags: ['Vendors'],
        operationId: id,
        summary,
        responses: {
          200: list
            ? listResponse(VendorSchema, Meta)
            : dataResponse(VendorSchema),
          ...apiErrorResponses,
        },
      });
    router.get(
      '/',
      doc('listVendors', 'List authorized vendor fields', true),
      apiValidator('query', ListQuery),
      async (ctx) => {
        const result = await service.list(
          ctx.req.valid('query'),
          await readPolicy(ctx),
        );
        return ctx.json({
          ...result,
          data: await enrichPeople(await enrichBanks(result.data, ctx)),
        });
      },
    );
    router.get(
      '/:vendorId',
      doc('getVendor', 'Read authorized vendor fields'),
      apiValidator('param', Params),
      async (ctx) => {
        const row = await service.get(
          ctx.req.valid('param').vendorId,
          undefined,
          await readPolicy(ctx),
        );
        if (!row)
          throw new ApiError({
            status: 'NOT_FOUND',
            domain: 'vendors',
            reason: 'VENDOR_NOT_FOUND',
            message: 'Vendor not found.',
          });
        return ctx.json({
          data: (await enrichPeople(await enrichBanks([row], ctx)))[0],
        });
      },
    );
    router.post(
      '/',
      doc('createVendor', 'Create a manual vendor with audited bank fields'),
      apiValidator('json', CreateInput),
      async (ctx) => {
        const scoped = await policy(ctx, 'manage');
        return ctx.json({
          data: (
            await enrichPeople([
              await db.transaction((tx) =>
                service.create(
                  {
                    ...ctx.req.valid('json'),
                    actorId: ctx.get('auth')!.user.id,
                  },
                  tx,
                  scoped,
                ),
              ),
            ])
          )[0],
        });
      },
    );
    router.patch(
      '/:vendorId',
      doc(
        'updateVendor',
        'Update or disable a vendor with optimistic version and audit',
      ),
      apiValidator('param', Params),
      apiValidator('json', UpdateInput),
      async (ctx) => {
        const scoped = await policy(ctx, 'manage');
        return ctx.json({
          data: (
            await enrichPeople([
              await db.transaction((tx) =>
                service.update(
                  ctx.req.valid('param').vendorId,
                  {
                    ...ctx.req.valid('json'),
                    actorId: ctx.get('auth')!.user.id,
                  },
                  tx,
                  scoped,
                ),
              ),
            ])
          )[0],
        });
      },
    );
    const root = new Hono();
    root.route('/vendors', router);
    return root;
  }),
];
