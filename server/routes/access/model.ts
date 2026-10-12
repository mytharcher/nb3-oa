import { dataScopeTarget } from '@nocobase/authorization/core';
import { createHash } from 'node:crypto';
import type {
  AppAuthorization,
  PermissionSetsApi,
} from '@nocobase/app-plugin-authorization/server';
import type { PermissionGrant } from '@nocobase/authorization/core';
import { ApiError } from '@nocobase/app-server/router';
import type { DatabaseConnection } from '@nocobase/db';
import type { z } from 'zod';
import type { Changes } from './schemas.js';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canonical(entry)]),
    );
  return value;
}
export function revision(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex');
}
export function fail(
  reason: string,
  status:
    | 'INVALID_ARGUMENT'
    | 'NOT_FOUND'
    | 'ABORTED'
    | 'FAILED_PRECONDITION' = 'INVALID_ARGUMENT',
): never {
  throw new ApiError({ status, reason, domain: 'access', message: reason });
}
export async function snapshot(sets: PermissionSetsApi<DatabaseConnection>) {
  const definitions = (await sets.list())
    .filter((set) => !sets.protection(set.key)?.hidden)
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((set) => ({
      ...set,
      protection: sets.protection(set.key),
      unrestricted: sets.protection(set.key)?.unrestricted ?? false,
    }));
  const visible = new Set(definitions.map((set) => set.key));
  const assignments = [...(await sets.listAssignments())]
    .sort((a, b) => a.id.localeCompare(b.id))
    .filter((entry) => visible.has(entry.permissionSet));
  return {
    sets: definitions,
    assignments,
    revision: revision({ definitions, assignments }),
  };
}
export async function setSnapshot(
  sets: PermissionSetsApi<DatabaseConnection>,
  key: string,
) {
  const definition = await sets.get(key);
  if (!definition || sets.protection(key)?.hidden)
    fail('NOT_FOUND', 'NOT_FOUND');
  const assignments = [...(await sets.listAssignments(key))].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  return {
    definition: { ...definition, protection: sets.protection(key) },
    assignments,
    revision: revision({ definition, assignments }),
  };
}

/** Patch only explicit supported actions. Preserve unrelated or custom policies byte-for-byte in the public DTO. */
export function applyChanges(
  authz: AppAuthorization,
  existing: readonly PermissionGrant[],
  changes: z.infer<typeof Changes>['changes'],
): readonly PermissionGrant[] {
  let grants = [...existing];
  const seen = new Set<string>();
  for (const change of changes) {
    const { resource, action } = change;
    const identity = JSON.stringify([resource, action]);
    if (seen.has(identity)) fail('DUPLICATE_CHANGE');
    seen.add(identity);
    const matching = grants.filter(
      (grant) =>
        grant.resource.type === resource.type &&
        grant.resource.id === resource.id,
    );
    const previous = matching.flatMap((grant) =>
      grant.actions.filter((entry) => entry.action === action),
    );
    if (previous.length > 1) fail('CUSTOM_POLICY_READ_ONLY');
    let policy: PermissionGrant['actions'][number]['policy'];
    if (resource.type === 'composite') {
      const definition = authz.compositeResources.getAction(
        resource.id,
        action,
      );
      if (!definition) fail('UNSUPPORTED_ACTION');
      const scopes = definition.dataScopes ?? [];
      const old = previous[0]?.policy;
      if (
        old &&
        (old.type !== 'composite' ||
          Object.keys(old).some((key) => !['type', 'scopes'].includes(key)))
      )
        fail('CUSTOM_POLICY_READ_ONLY');
      const oldScopes = (old?.scopes ?? {}) as Record<string, unknown>;
      if (
        Object.values(oldScopes).some((value) => typeof value !== 'string') ||
        Object.keys(oldScopes).some(
          (key) => !scopes.some((scope) => scope.key === key),
        )
      )
        fail('CUSTOM_POLICY_READ_ONLY');
      for (const [key, value] of Object.entries(oldScopes)) {
        const scope = scopes.find((entry) => entry.key === key)!;
        const supported =
          scope.options ??
          authz.recordAccess
            .listFor(dataScopeTarget(definition, scope.key).id)
            .map((entry) => entry.key);
        if (value !== '' && !supported.includes(value as string))
          fail('CUSTOM_POLICY_READ_ONLY');
      }
      if (change.enabled) {
        if (
          Object.keys(change.scopes ?? {}).some(
            (key) => !scopes.some((scope) => scope.key === key),
          )
        )
          fail('UNSUPPORTED_SCOPE');
        const selected: Record<string, string> = {};
        for (const scope of scopes) {
          const value = change.scopes?.[scope.key];
          if (value === undefined) fail('SCOPE_REQUIRED');
          if (
            value !== '' &&
            !(
              scope.options ??
              authz.recordAccess
                .listFor(dataScopeTarget(definition, scope.key).id)
                .map((entry) => entry.key)
            ).includes(value)
          )
            fail('UNSUPPORTED_SCOPE');
          selected[scope.key] = value;
        }
        policy = { type: 'composite', scopes: selected };
        if (
          authz.compositeResources.validateGrant({ resource, action, policy })
        )
          fail('UNSUPPORTED_SCOPE');
      }
    } else {
      if (previous[0]?.policy) fail('CUSTOM_POLICY_READ_ONLY');
      const type = authz.resourceTypes.get(resource.type);
      const actions = type.items
        ? type.items.get(resource.id)?.actions
        : type.actions;
      if (
        !actions?.some((entry) => entry.name === action) ||
        (change.scopes && Object.keys(change.scopes).length)
      )
        fail('UNSUPPORTED_ACTION');
      if (resource.type === 'page' && action !== 'access')
        fail('UNSUPPORTED_ACTION');
    }
    grants = grants
      .map((grant) =>
        grant.resource.type === resource.type &&
        grant.resource.id === resource.id
          ? {
              ...grant,
              actions: grant.actions.filter((entry) => entry.action !== action),
            }
          : grant,
      )
      .filter((grant) => grant.actions.length);
    if (change.enabled) {
      const index = grants.findIndex(
        (grant) =>
          grant.resource.type === resource.type &&
          grant.resource.id === resource.id,
      );
      const entry = { action, ...(policy ? { policy } : {}) };
      if (index < 0) grants.push({ resource, actions: [entry] });
      else
        grants[index] = {
          ...grants[index],
          actions: [...grants[index].actions, entry],
        };
    }
  }
  return grants;
}
