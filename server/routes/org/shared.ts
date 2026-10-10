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
  apiErrorResponse,
  type ApiErrorStatus,
} from '@nocobase/app-server/router';
import { Hono, type Context, type MiddlewareHandler } from 'hono';

import {
  ORG_DOMAIN,
  OrgError,
  organizationServiceToken,
  type OrganizationService,
  type OrgErrorCode,
  type OrgSettingsItem,
  type OrgWriteContext,
} from '../../providers/org/index.js';
import type { OrgUserBody } from './schemas.js';

export type OrgEnv = AuthorizationEnv & AuthEnv;

const STATUS: Record<OrgErrorCode, ApiErrorStatus> = {
  INVALID_INPUT: 'INVALID_ARGUMENT',
  DEPARTMENT_NOT_FOUND: 'NOT_FOUND',
  DEPARTMENT_CODE_EXISTS: 'ALREADY_EXISTS',
  PARENT_NOT_FOUND: 'INVALID_ARGUMENT',
  PARENT_CYCLE: 'INVALID_ARGUMENT',
  EXECUTIVE_TOP_LEVEL_ONLY: 'INVALID_ARGUMENT',
  USER_NOT_FOUND: 'INVALID_ARGUMENT',
  MEMBER_NOT_FOUND: 'NOT_FOUND',
  POSITION_NOT_FOUND: 'NOT_FOUND',
  POSITION_CODE_EXISTS: 'ALREADY_EXISTS',
  GRADE_NOT_FOUND: 'NOT_FOUND',
  GRADE_CODE_EXISTS: 'ALREADY_EXISTS',
  DUTY_ROLE_NOT_FOUND: 'NOT_FOUND',
};

function toApiError(error: OrgError): ApiError {
  return new ApiError({
    status: STATUS[error.code],
    reason: error.code,
    domain: ORG_DOMAIN,
    message: error.message,
    ...(error.field
      ? {
          fieldViolations: [{ field: error.field, description: error.message }],
        }
      : {}),
    cause: error,
  });
}

/**
 * Requires a settings action before anything about the request is looked at. Mounted ahead of the validators, so a
 * caller without it is answered 403 whatever its input holds and whether or not the record exists.
 */
export function requireSettings(
  item: OrgSettingsItem,
  action: 'read' | 'update',
): MiddlewareHandler<OrgEnv> {
  return async (c, next) => {
    await c.get('authz').require({
      resource: { type: 'settings', id: item },
      action,
    });
    await next();
  };
}

export function describeSettings(
  item: OrgSettingsItem,
  action: 'read' | 'update',
): string {
  return `Requires \`settings:${item}\` \`${action}\`.`;
}

export const notFound = (what: string): ReturnType<typeof apiErrorResponse> =>
  apiErrorResponse(404, what);

/** Drops the keys a client omitted, so an omitted field and an explicit `null` stay different. */
export function defined<T extends object>(
  value: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as { [K in keyof T]: Exclude<T[K], undefined> };
}

export interface OrgRouteServices {
  readonly organization: OrganizationService;
  /** Resolves user ids to `{ id, name, username, email }`, batched; a missing user is named by its id. */
  resolveUsers(
    ids: readonly (string | null | undefined)[],
  ): Promise<ReadonlyMap<string, OrgUserBody>>;
  userOf(
    users: ReadonlyMap<string, OrgUserBody>,
    id: string | null,
  ): OrgUserBody | null;
  /** The signed-in actor for audit entries. */
  actor(c: Context<OrgEnv>): OrgWriteContext;
}

export function orgRouteServices(app: Application): OrgRouteServices {
  const organization = app.container.resolve(organizationServiceToken);
  const users = app.container.resolve(userAdministrationServiceToken);
  return {
    organization,
    async resolveUsers(ids) {
      const wanted = [
        ...new Set(ids.filter((id): id is string => typeof id === 'string')),
      ];
      const result = new Map<string, OrgUserBody>();
      // The user directory pages at 100.
      for (let offset = 0; offset < wanted.length; offset += 100) {
        const page = await users.list({
          userIds: wanted.slice(offset, offset + 100),
          page: 1,
          pageSize: 100,
          kind: 'all',
        });
        for (const user of page.items)
          result.set(user.id, {
            id: user.id,
            name: user.name,
            username: user.username ?? null,
            email: user.email,
          });
      }
      return result;
    },
    userOf(map, id) {
      if (id === null) return null;
      return map.get(id) ?? { id, name: id };
    },
    actor(c) {
      return { actorId: c.get('auth')?.user.id ?? null };
    },
  };
}

/**
 * A sub-router whose every route authenticates and initialises authorization on its own, and whose organisation
 * errors are answered as `ApiError`s in the `org` domain.
 */
export function createOrgRouter(app: Application): Hono<OrgEnv> {
  const auth = app.container.resolve(authenticationToken);
  const authz = app.container.resolve(authorizationToken);
  const router = new Hono<OrgEnv>();
  router.use('*', auth.required(), authz.middleware());
  router.onError((error, c) =>
    apiErrorHandler(error instanceof OrgError ? toApiError(error) : error, c),
  );
  return router;
}
