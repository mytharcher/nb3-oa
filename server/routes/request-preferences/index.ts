import { Hono } from 'hono';
import { z } from 'zod';
import {
  authenticationToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import {
  apiErrorHandler,
  apiErrorResponse,
  apiValidator,
  dataResponse,
  defineApiRoutes,
  describeRoute,
} from '@nocobase/app-server/router';
import { employeeRequestKeys } from '../../../shared/request-catalog.js';
import {
  getRequestPreferences,
  saveRequestPreferences,
} from '../../providers/request-preferences/service.js';

const Key = z.enum(employeeRequestKeys);
const Favorites = z.strictObject({
  favorites: z
    .array(Key)
    .max(6)
    .refine((keys) => new Set(keys).size === keys.length)
    .nullable(),
});
const Preferences = z.object({
  favorites: z.array(Key).nullable(),
  recent: z.array(Key),
});
export default [
  defineApiRoutes<Application>((app) => {
    const router = new Hono<AuthEnv>();
    const db = app.container.resolve(databaseManagerToken);
    router.use('*', app.container.resolve(authenticationToken).required());
    router.onError(apiErrorHandler);
    const doc = (operationId: string) =>
      describeRoute({
        tags: ['Personal preferences'],
        operationId,
        summary: operationId,
        responses: {
          200: dataResponse(Preferences),
          400: apiErrorResponse(400),
          401: apiErrorResponse(401),
          500: apiErrorResponse(500),
        },
      });
    router.get('/', doc('getOwnRequestPreferences'), async (ctx) =>
      ctx.json({
        data: await getRequestPreferences(
          db.connection(),
          ctx.get('auth')!.user.id,
        ),
      }),
    );
    router.put(
      '/',
      doc('saveOwnRequestFavorites'),
      apiValidator('json', Favorites),
      async (ctx) =>
        ctx.json({
          data: await saveRequestPreferences(
            db.connection(),
            ctx.get('auth')!.user.id,
            { type: 'favorites', ...ctx.req.valid('json') },
          ),
        }),
    );
    router.post(
      '/migrate',
      doc('migrateOwnRequestFavorites'),
      apiValidator('json', Favorites),
      async (ctx) =>
        ctx.json({
          data: await saveRequestPreferences(
            db.connection(),
            ctx.get('auth')!.user.id,
            { type: 'migrate', ...ctx.req.valid('json') },
          ),
        }),
    );
    router.post(
      '/recent',
      doc('recordOwnRecentRequest'),
      apiValidator('json', z.strictObject({ key: Key })),
      async (ctx) =>
        ctx.json({
          data: await saveRequestPreferences(
            db.connection(),
            ctx.get('auth')!.user.id,
            { type: 'recent', ...ctx.req.valid('json') },
          ),
        }),
    );
    return new Hono().route('/requestPreferences', router);
  }),
];
