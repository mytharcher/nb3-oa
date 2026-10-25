import type { AppAuthorization } from '@nocobase/app-plugin-authorization/server';
import type { AuthorizationContext } from '@nocobase/authorization/core';
import type { DefaultAccessAuthorizationApi } from '@nocobase/authorization/default-access';
import type { SharingRulesAuthorizationApi } from '@nocobase/authorization/sharing-rules';
import type { RestrictionRulesAuthorizationApi } from '@nocobase/authorization/restriction-rules';
import type { DatabaseConnection } from '@nocobase/db';

/** Only reveal resource counts for independently readable rule administration surfaces. */
export async function ruleSummary(
  authz: AppAuthorization,
  context: AuthorizationContext,
) {
  const result: {
    kind: string;
    resource: { type: string; id: string };
    count: number;
  }[] = [];
  const sources = [
    {
      kind: 'default-access',
      key: 'defaultAccess',
      read: () =>
        (
          authz as AppAuthorization &
            DefaultAccessAuthorizationApi<DatabaseConnection>
        ).defaultAccess.list(),
    },
    {
      kind: 'sharing-rules',
      key: 'sharingRules',
      read: () =>
        (
          authz as AppAuthorization &
            SharingRulesAuthorizationApi<DatabaseConnection>
        ).sharingRules.list(),
    },
    {
      kind: 'restriction-rules',
      key: 'restrictionRules',
      read: () =>
        (
          authz as AppAuthorization &
            RestrictionRulesAuthorizationApi<DatabaseConnection>
        ).restrictionRules.list(),
    },
  ];
  for (const source of sources)
    if (
      source.key in authz &&
      (await context.can({
        resource: { type: 'settings', id: `authorization.${source.kind}` },
        action: 'read',
      }))
    ) {
      for (const rule of await source.read()) {
        const existing = result.find(
          (entry) =>
            entry.kind === source.kind &&
            entry.resource.type === rule.resource.type &&
            entry.resource.id === rule.resource.id,
        );
        if (existing) existing.count += 1;
        else
          result.push({ kind: source.kind, resource: rule.resource, count: 1 });
      }
    }
  return result;
}
