import { lockAccessWrites } from './access-lock.js';
import { AsyncLocalStorage } from 'node:async_hooks';

import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import type { Application } from '@nocobase/app-server/application';
import { defineHttpMiddleware } from '@nocobase/app-server/router';
import type { MiddlewareHandler } from 'hono';

import type { PermissionSetsApi } from '@nocobase/app-plugin-authorization/server';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';

import type { AuditService } from './index.js';

/** Read lazily: the owning route authenticates after the request context is established. */
export const auditActorContext = new AsyncLocalStorage<() => string | null>();

export const permissionAuditMiddleware = defineHttpMiddleware<Application>({
  name: 'oa/audit-actor',
  register: (router) => {
    // Context only: every owning route still installs its own authentication and authorization.
    const capture: MiddlewareHandler<AuthEnv> = async (context, next) =>
      auditActorContext.run(() => context.get('auth')?.user.id ?? null, next);
    router.use('*', capture);
  },
});

/**
 * The permission plugin has no transactional audit hook. Decorate its public API in place so existing Users role
 * scopes retain the same object, protections and notifications. Never replace the plugin's store or edit its tables.
 */
export function installPermissionSetAudit(
  api: PermissionSetsApi<DatabaseConnection>,
  database: DatabaseManager,
  audit: AuditService,
): () => void {
  const originals = {
    create: api.create.bind(api),
    update: api.update.bind(api),
    delete: api.delete.bind(api),
    assign: api.assign.bind(api),
    revoke: api.revoke.bind(api),
    replaceSubjectAssignments: api.replaceSubjectAssignments.bind(api),
    withTransaction: api.withTransaction.bind(api),
  };
  const bind = originals.withTransaction.bind(api);

  function decorate(
    connection: DatabaseConnection,
  ): PermissionSetsApi<DatabaseConnection> {
    const bound = bind(connection);
    return new Proxy(bound, {
      get(target, property) {
        if (property === 'withTransaction') return decorate;
        if (property === 'create')
          return async (input: Parameters<typeof api.create>[0]) => {
            await lockAccessWrites(connection);
            const result = await target.create(input);
            await record('permissionSet.create', input.key, null, result);
            return result;
          };
        if (property === 'update')
          return async (
            key: string,
            input: Parameters<typeof api.update>[1],
          ) => {
            await lockAccessWrites(connection);
            const before = await target.get(key);
            const result = await target.update(key, input);
            await record('permissionSet.update', key, before, result);
            return result;
          };
        if (property === 'delete')
          return async (key: string) => {
            await lockAccessWrites(connection);
            const before = {
              definition: await target.get(key),
              assignments: await target.listAssignments(key),
            };
            await target.delete(key);
            await record('permissionSet.delete', key, before, null);
          };
        if (property === 'assign')
          return async (input: Parameters<typeof api.assign>[0]) => {
            await lockAccessWrites(connection);
            const before = await target.listAssignments(input.permissionSet);
            const result = await target.assign(input);
            if (!before.some((entry) => entry.id === result.id))
              await record(
                'permissionSet.assign',
                input.permissionSet,
                null,
                result,
              );
            return result;
          };
        if (property === 'revoke')
          return async (id: string) => {
            await lockAccessWrites(connection);
            const before = (await target.listAssignments()).find(
              (entry) => entry.id === id,
            );
            await target.revoke(id);
            if (before)
              await record(
                'permissionSet.revoke',
                before.permissionSet,
                before,
                null,
              );
          };
        if (property === 'replaceSubjectAssignments')
          return async (
            input: Parameters<typeof api.replaceSubjectAssignments>[0],
          ) => {
            await lockAccessWrites(connection);
            const before = (await target.listAssignments()).filter(
              (entry) =>
                entry.subject.type === input.subject.type &&
                entry.subject.id === input.subject.id &&
                input.managedPermissionSets.includes(entry.permissionSet),
            );
            const result = await target.replaceSubjectAssignments(input);
            const beforeIds = new Set(before.map((entry) => entry.id));
            const afterIds = new Set(result.map((entry) => entry.id));
            for (const entry of before)
              if (!afterIds.has(entry.id))
                await record(
                  'permissionSet.revoke',
                  entry.permissionSet,
                  entry,
                  null,
                );
            for (const entry of result)
              if (!beforeIds.has(entry.id))
                await record(
                  'permissionSet.assign',
                  entry.permissionSet,
                  null,
                  entry,
                );
            return result;
          };
        const value: unknown = Reflect.get(target, property);
        if (typeof value !== 'function') return value;
        const method = value as (...args: unknown[]) => unknown;
        return method.bind(target);
      },
    });

    async function record(
      action: string,
      targetId: string,
      before: unknown,
      after: unknown,
    ): Promise<void> {
      await audit.record(
        {
          actorId: auditActorContext.getStore()?.() ?? null,
          action,
          targetType: 'permissionSets',
          targetId,
          before,
          after,
        },
        connection,
      );
    }
  }

  api.create = (input) =>
    database.transaction((connection) => decorate(connection).create(input));
  api.update = (key, input) =>
    database.transaction((connection) =>
      decorate(connection).update(key, input),
    );
  api.delete = (key) =>
    database.transaction((connection) => decorate(connection).delete(key));
  api.assign = (input) =>
    database.transaction((connection) => decorate(connection).assign(input));
  api.revoke = (id) =>
    database.transaction((connection) => decorate(connection).revoke(id));
  api.replaceSubjectAssignments = (input) =>
    database.transaction((connection) =>
      decorate(connection).replaceSubjectAssignments(input),
    );
  api.withTransaction = decorate;
  return () => Object.assign(api, originals);
}
