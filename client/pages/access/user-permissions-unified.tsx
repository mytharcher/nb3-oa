import { useCallback, useMemo } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Badge } from '#components/ui/badge';
import { useAuthorizationClient } from '../administration/authorization/use-authorization-client.js';
import { titleText } from '../administration/authorization/i18n.js';
import { useCatalog, useLoad } from './hooks.js';
import { UserPermissionTable } from './user-permission-table.js';
import { roleRows, rowValue } from './model.js';
import { ErrorState, Loading } from './ui.js';
import type { PermissionSourceDetails } from './permission-scope-details.js';
import type { AccessSnapshot } from './types.js';

/** Read inheritance separately from the direct snapshot used by the write protocol. */
export default function UnifiedUserPermissions({
  userId,
  canInspect,
  canReadPersonal,
  canEdit,
}: {
  userId: string;
  name?: string;
  canInspect: boolean;
  canReadPersonal: boolean;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const client = useAuthorizationClient();
  const catalog = useCatalog(canReadPersonal ? 'permissionSets' : 'inspector');
  const data = useLoad(
    useCallback(async () => {
      if (!catalog.data) return undefined;
      const [personal, configured, definitions] = await Promise.all([
        canReadPersonal
          ? api
              .request<{ data: AccessSnapshot }>({
                path: `access/subjects/user/${encodeURIComponent(userId)}`,
              })
              .then((r) => r.data)
          : undefined,
        canInspect
          ? client.inspectConfigured({ type: 'user', id: userId })
          : undefined,
        canInspect
          ? api
              .request<{ data: AccessSnapshot }>({ path: 'access/snapshot' })
              .then((r) => r.data)
          : undefined,
      ]);
      const names: Record<string, string> = {};
      const sources = [
        ...new Map(
          (configured?.sets ?? [])
            .flatMap((set) => set.sources)
            .map((source) => [`${source.type}:${source.id}`, source]),
        ).values(),
      ];
      for (const type of new Set(sources.map((source) => source.type))) {
        if (type === 'authenticated' || type === 'user') continue;
        const definition = catalog.data.subjectTypes.find(
          (entry) => entry.type === type,
        );
        if (definition?.selection.type === 'fixed') {
          names[`${type}:${definition.selection.id}`] = titleText(
            definition.title,
            t,
          );
          continue;
        }
        const ids = sources
          .filter((source) => source.type === type)
          .map((source) => source.id);
        for (let offset = 0; offset < ids.length; offset += 100) {
          for (const entry of await client.resolveSubjects(
            'inspector',
            type,
            ids.slice(offset, offset + 100),
          ))
            names[`${type}:${entry.id}`] = titleText(entry.title, t);
        }
      }
      return { personal, configured, definitions, names };
    }, [api, client, userId, canReadPersonal, canInspect, t, catalog.data]),
  );
  const inherited = useMemo(() => {
    const lines = new Map<string, string[]>();
    const details = new Map<string, PermissionSourceDetails[]>();
    if (!data.data || !catalog.options) return { lines, details };
    for (const set of data.data.definitions?.sets ?? []) {
      const configured = data.data.configured?.sets?.find(
        (entry) => entry.key === set.key,
      );
      if (!configured) continue;
      const sources = configured.sources.length
        ? configured.sources.filter(
            (source) => !(source.type === 'user' && source.id === userId),
          )
        : [{ type: 'authenticated', id: '*' }];
      if (!sources.length) continue;
      const names = [
        ...new Set(
          sources.map((source) =>
            source.type === 'authenticated'
              ? t('access.baseline')
              : (data.data!.names[`${source.type}:${source.id}`] ??
                t('access.inherited')),
          ),
        ),
      ];
      // Keep each source's range; merging scopes here would imply an effective decision.
      for (const row of roleRows(catalog.options, [set]).filter(
        (row) => row.enabled,
      )) {
        const line = `${rowValue(row, t('access.deniedAction'), t('access.configuredGrant'), t('access.special'))} · ${names.join(' · ')}`;
        lines.set(row.id, [...new Set([...(lines.get(row.id) ?? []), line])]);
        const scopes = row.resource.dataScopes?.[row.action] ?? [];
        const detail: PermissionSourceDetails = {
          sources: names,
          scopes: scopes.map((scope) => ({
            key: scope.key,
            label: scope.label,
            value: row.scopes[scope.key]
              ? (scope.options.find(
                  (option) => option.value === row.scopes[scope.key],
                )?.label ?? t('access.special'))
              : t('access.systemScope'),
          })),
          ...(row.custom || !scopes.length
            ? {
                summary: rowValue(
                  row,
                  t('access.deniedAction'),
                  t('access.configuredGrant'),
                  t('access.special'),
                ),
              }
            : {}),
        };
        if (
          !(details.get(row.id) ?? []).some(
            (entry) => JSON.stringify(entry) === JSON.stringify(detail),
          )
        )
          details.set(row.id, [...(details.get(row.id) ?? []), detail]);
      }
    }
    return { lines, details };
  }, [data.data, catalog.options, userId, t]);
  const reload = () => {
    data.reload();
    if (!catalog.data || catalog.error) catalog.reload();
  };
  if (data.error || catalog.error)
    return <ErrorState error={data.error ?? catalog.error} retry={reload} />;
  if (!data.data || !catalog.options) return <Loading />;
  const snapshot = data.data.personal ?? {
    sets: [],
    assignments: [],
    revision: '',
  };
  return (
    <div className='flex flex-col gap-4'>
      {!canInspect ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('access.inheritedUnavailable')}
        </p>
      ) : null}
      {!canReadPersonal ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t('access.configurationDenied')}
        </p>
      ) : null}
      {data.data.configured?.unrestricted ? (
        <Badge>{t('access.unrestricted')}</Badge>
      ) : null}
      <UserPermissionTable
        snapshot={snapshot}
        options={catalog.options}
        userId={userId}
        canEdit={canEdit && canReadPersonal}
        canReadPersonal={canReadPersonal}
        canInspect={canInspect}
        inherited={inherited.details}
        saved={(personal) => data.replace({ ...data.data!, personal })}
        refresh={async () => {
          const current = await data.refresh();
          if (!current) throw new Error('Snapshot unavailable');
          return current.personal ?? snapshot;
        }}
      />
    </div>
  );
}
