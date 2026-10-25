import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useApiClient } from '@nocobase/app-client';
import type { AccessSnapshot } from './types.js';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { useAuthorizationClient } from '../administration/authorization/use-authorization-client.js';
import { titleText } from '../administration/authorization/i18n.js';
import { useCatalog, useLoad } from './hooks.js';
import { roleRows, rowValue, sensitiveSummary } from './model.js';
import { ErrorState, Loading, Refresh, Blank } from './ui.js';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '#components/ui/collapsible';
import { DrawerFormFooterContext } from '#components/drawer-form-context';
import { RoleMatrix } from './role-matrix.js';
import { useRoleSnapshot } from './hooks.js';
import { AccessModulePermissions } from './module-permissions.js';
import { resourceKey } from '../administration/authorization/pages/permission-sets/drafts.js';

export default function UserPermissions({
  embedded = false,
  rolesOnly = false,
  refreshVersion = 0,
  name: suppliedName,
}: {
  embedded?: boolean;
  rolesOnly?: boolean;
  refreshVersion?: number;
  name?: string;
} = {}) {
  const { userId = '' } = useParams();
  const { t } = useTranslation();
  const location = useLocation();
  const client = useAuthorizationClient();
  const api = useApiClient();
  const subject = useMemo(() => ({ type: 'user', id: userId }), [userId]);
  const catalog = useCatalog('inspector');
  const canRead = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'read',
  }).can;
  const canAssign = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'assign',
  }).can;
  const canUpdate = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'update',
  }).can;
  const data = useLoad(
    useCallback(async () => {
      if (!catalog.data) return;
      const [configured, snapshot] = await Promise.all([
        client.inspectConfigured(subject),
        canRead
          ? api.request<{ data: AccessSnapshot }>({ path: 'access/snapshot' })
          : Promise.resolve(undefined),
      ]);
      const subjects = [
        ...new Map(
          [
            ...(configured.identity?.subjects ?? []),
            subject,
            ...(configured.sets ?? []).flatMap((set) => set.sources),
          ].map((entry) => [`${entry.type}:${entry.id}`, entry]),
        ).values(),
      ];
      const names: Record<string, string> = {};
      for (const type of new Set(subjects.map((entry) => entry.type))) {
        const ids = subjects
          .filter((entry) => entry.type === type)
          .map((entry) => entry.id);
        const definition = catalog.data?.subjectTypes.find(
          (entry) => entry.type === type,
        );
        if (definition?.selection.type === 'fixed')
          names[`${type}:${definition.selection.id}`] = titleText(
            definition.title,
            t,
          );
        else {
          for (let offset = 0; offset < ids.length; offset += 100) {
            const resolved = await client.resolveSubjects(
              'inspector',
              type,
              ids.slice(offset, offset + 100),
            );
            for (const entry of resolved)
              names[`${type}:${entry.id}`] = titleText(entry.title, t);
          }
        }
      }
      // Inspector configurations include inherited sources. Never use the direct subject filter as an effective grant list.
      return {
        configured,
        names,
        subjects,
        definitions: snapshot?.data.sets,
      };
    }, [client, api, subject, catalog.data, canRead, t]),
  );
  const refreshRoles = data.reload;
  useEffect(() => {
    if (refreshVersion) refreshRoles();
  }, [refreshVersion, refreshRoles]);
  const [exceptionsVisited, setExceptionsVisited] = useState(false);
  const options = catalog.options;
  const definitions =
    data.data?.definitions?.filter((set) =>
      data.data?.configured.sets?.some((entry) => entry.key === set.key),
    ) ?? [];
  const rows = options ? roleRows(options, definitions) : [];
  const sensitive = new Set(
    options ? definitions.flatMap((set) => sensitiveSummary(options, set)) : [],
  );
  const rowsBySet = new Map(
    definitions.map((set) => [
      set.key,
      new Map(
        (options ? roleRows(options, [set]) : []).map((row) => [row.id, row]),
      ),
    ]),
  );
  function sourceNames(rowId: string) {
    return [
      ...new Set(
        definitions.flatMap((set) =>
          rowsBySet.get(set.key)?.get(rowId)?.enabled
            ? (
                data.data?.configured.sets?.find(
                  (entry) => entry.key === set.key,
                )?.sources ?? []
              ).map((subject) =>
                subject.type === 'user'
                  ? t('access.direct')
                  : (data.data?.names[`${subject.type}:${subject.id}`] ??
                    t('access.inherited')),
              )
            : [],
        ),
      ),
    ];
  }
  function sourceLines(rowId: string): string[] {
    return [
      ...new Set(
        definitions.flatMap((set) => {
          const row = rowsBySet.get(set.key)!.get(rowId)!;
          if (!row.enabled) return [];
          const source = data.data!.configured.sets?.find(
            (entry) => entry.key === set.key,
          );
          const names =
            source?.sources.map((subject) =>
              subject.type === 'user'
                ? t('access.direct')
                : (data.data!.names[`${subject.type}:${subject.id}`] ??
                  t('access.inherited')),
            ) ?? [];
          return [
            `${rowValue(row, t('access.deniedAction'), t('access.configuredGrant'), t('access.special'))} · ${[...new Set(names)].sort().join(' · ') || t('access.baseline')}`,
          ];
        }),
      ),
    ];
  }
  const name =
    suppliedName ?? data.data?.names[`user:${userId}`] ?? t('access.loading');
  const reload = () => {
    data.reload();
    catalog.reload();
  };
  const content = (
    <>
      {data.error || catalog.error ? (
        <ErrorState error={data.error ?? catalog.error} retry={reload} />
      ) : !data.data || !options ? (
        <Loading />
      ) : (
        <div className='flex flex-col gap-5'>
          <h2 className='font-medium'>{t('access.permissionSources')}</h2>
          <div className='flex flex-col gap-3'>
            {(
              [
                'baseline',
                'duties',
                'organization',
                'direct',
                'system',
              ] as const
            ).map((group) => {
              const entries = data.data!.subjects.filter((entry) => {
                if (group === 'baseline') return entry.type === 'authenticated';
                if (group === 'duties') return entry.type === 'org.dutyRole';
                if (group === 'organization')
                  return (
                    entry.type.startsWith('org.') &&
                    entry.type !== 'org.dutyRole'
                  );
                if (group === 'direct')
                  return (
                    entry.type === 'user' &&
                    data.data!.configured.sets?.some((set) =>
                      set.sources.some(
                        (source) =>
                          source.type === 'user' && source.id === entry.id,
                      ),
                    )
                  );
                return entry.type === 'system';
              });
              if (
                !entries.length &&
                !(group === 'system' && data.data!.configured.unrestricted)
              )
                return null;
              return (
                <dl key={group} className='grid gap-1 sm:grid-cols-[8rem_1fr]'>
                  <dt className='text-muted-foreground'>
                    {t(`access.sourceGroups.${group}`)}
                  </dt>
                  <dd className='flex flex-wrap gap-1'>
                    {entries.map((entry) => (
                      <Badge
                        key={`${entry.type}:${entry.id}`}
                        variant='outline'
                      >
                        {data.data!.names[`${entry.type}:${entry.id}`] ??
                          t('access.inherited')}
                      </Badge>
                    ))}
                    {group === 'system' && !entries.length ? (
                      <Badge variant='outline'>{t('access.systemAdmin')}</Badge>
                    ) : null}
                  </dd>
                </dl>
              );
            })}
          </div>
          {rolesOnly ? (
            <>
              <p className='text-sm text-muted-foreground'>
                {t('access.organizationReadOnly')}
              </p>
              <Button
                variant='link'
                nativeButton={false}
                render={<Link to='/departments' />}
              >
                {t('access.openOrganization')}
              </Button>
              {canRead && canAssign && canUpdate ? (
                <Collapsible
                  onOpenChange={(open) => {
                    if (open) setExceptionsVisited(true);
                  }}
                >
                  <CollapsibleTrigger render={<Button variant='outline' />}>
                    {t('access.advancedExceptions')}
                  </CollapsibleTrigger>
                  <CollapsibleContent keepMounted className='py-3'>
                    <DrawerFormFooterContext.Provider value={null}>
                      {exceptionsVisited ? (
                        <UserExceptionMatrix
                          userId={userId}
                          name={name}
                          saved={reload}
                        />
                      ) : null}
                    </DrawerFormFooterContext.Provider>
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </>
          ) : null}
          {!rolesOnly ? (
            <>
              {data.data.configured.unrestricted ? (
                <Badge>{t('access.unrestricted')}</Badge>
              ) : !canRead ? (
                <p>{t('access.configurationDenied')}</p>
              ) : (
                <AccessModulePermissions
                  defaultAll={true}
                  options={options}
                  enabled={
                    new Set(
                      rows
                        .filter((row) => row.enabled)
                        .map((row) =>
                          resourceKey(row.resource.type, row.resource.value),
                        ),
                    )
                  }
                >
                  {(keys) => (
                    <div className='flex flex-col gap-4'>
                      {!rows.some(
                        (row) =>
                          row.enabled &&
                          keys.has(
                            resourceKey(row.resource.type, row.resource.value),
                          ),
                      ) ? (
                        <Blank
                          title={t('access.none')}
                          description={t('access.noModulePermissions')}
                        />
                      ) : null}
                      {[
                        ...new Set(
                          rows
                            .filter(
                              (row) =>
                                row.enabled &&
                                keys.has(
                                  resourceKey(
                                    row.resource.type,
                                    row.resource.value,
                                  ),
                                ),
                            )
                            .map((row) => row.resource),
                        ),
                      ].map((resource) => {
                        const entries = rows.filter(
                          (row) => row.enabled && row.resource === resource,
                        );
                        return (
                          <Collapsible
                            key={resourceKey(resource.type, resource.value)}
                            className='rounded-lg border p-3'
                          >
                            <CollapsibleTrigger className='flex w-full flex-wrap items-center justify-between gap-2 text-left'>
                              <span className='font-medium'>
                                {resource.label}
                              </span>
                              <span className='text-sm text-muted-foreground'>
                                {entries
                                  .map(
                                    (row) =>
                                      `${row.label}${sensitive.has(`${resource.label} · ${row.label}`) ? ` · ${t('access.sensitive')}` : ''} · ${rowValue(row, t('access.deniedAction'), t('access.configuredGrant'), t('access.special'))}`,
                                  )
                                  .join(' / ')}
                              </span>
                            </CollapsibleTrigger>
                            <p className='text-xs text-muted-foreground'>
                              {[
                                ...new Set(
                                  entries.flatMap((row) => sourceNames(row.id)),
                                ),
                              ].join(' · ')}
                            </p>
                            <CollapsibleContent className='flex flex-col gap-2 pt-3'>
                              {entries.map((row) => (
                                <div key={row.id}>
                                  <p>{row.label}</p>
                                  {sourceLines(row.id).map((line) => (
                                    <p
                                      key={line}
                                      className='text-sm text-muted-foreground'
                                    >
                                      {line}
                                    </p>
                                  ))}
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  )}
                </AccessModulePermissions>
              )}
            </>
          ) : null}
        </div>
      )}
    </>
  );
  return embedded ? (
    content
  ) : (
    <RecordDetailDrawer
      title={t('access.userPermissionsTitle', { name })}
      description={t('access.unionHelp')}
      closeTo={`/users${location.search}`}
      footer={<Refresh busy={data.busy} reload={reload} />}
    >
      {content}
    </RecordDetailDrawer>
  );
}
function UserExceptionMatrix({
  userId,
  name,
  saved,
}: {
  userId: string;
  name: string;
  saved: () => void;
}) {
  const snapshot = useRoleSnapshot('user', userId);
  const catalog = useCatalog();
  if (snapshot.error || catalog.error)
    return (
      <ErrorState
        error={snapshot.error ?? catalog.error}
        retry={() => {
          snapshot.reload();
          catalog.reload();
        }}
      />
    );
  if (!snapshot.data || !catalog.options) return <Loading />;
  return (
    <RoleMatrix
      key={snapshot.data.revision}
      subject={{ type: 'user', id: userId }}
      snapshot={snapshot.data}
      options={catalog.options}
      name={name}
      canEdit
      reload={snapshot.reload}
      saved={(data) => {
        snapshot.replace(data);
        saved();
      }}
    />
  );
}
