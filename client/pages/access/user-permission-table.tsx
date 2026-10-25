import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ApiClientError,
  useApiClient,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '#components/data-table';
import { ApplicationSearch } from '#components/application-search';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import { Switch } from '#components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { useDrawerFormGuard } from '#hooks/use-drawer-form-guard';
import { titleText } from '../administration/authorization/i18n.js';
import { resourceKey } from '../administration/authorization/pages/permission-sets/drafts.js';
import { ErrorState } from './ui.js';
import { roleRows, subjectSets } from './model.js';
import { AccessModulePermissions } from './module-permissions.js';
import {
  PersonalScopeFields,
  type PermissionSourceDetails,
} from './permission-scope-details.js';
import type {
  AccessSnapshot,
  ActionRow,
  AuthorizationOptions,
} from './types.js';

/** Values stay attached to their source; scope labels belong to the first column. */
function InheritedScopeValues({
  entries,
  scopeKey,
  showValues = true,
}: {
  entries: readonly PermissionSourceDetails[];
  scopeKey?: string;
  showValues?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col gap-3'>
      {entries.map((entry) => (
        <div key={JSON.stringify(entry)} className='flex flex-col gap-1'>
          {showValues ||
          (entry.summary && entry.summary !== t('access.configuredGrant')) ? (
            <span>
              {entry.summary ??
                entry.scopes.find((scope) => scope.key === scopeKey)?.value ??
                t('access.special')}
            </span>
          ) : null}
          <div className='text-xs text-muted-foreground'>
            {entry.sources.map((source) => (
              <p key={source}>{source}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserPermissionTable({
  snapshot,
  options,
  userId,
  canEdit,
  canReadPersonal,
  canInspect,
  inherited,
  saved,
  refresh,
}: {
  snapshot: AccessSnapshot;
  options: AuthorizationOptions;
  userId: string;
  canEdit: boolean;
  canReadPersonal: boolean;
  canInspect: boolean;
  inherited: ReadonlyMap<string, PermissionSourceDetails[]>;
  saved: (value: AccessSnapshot) => void;
  refresh: () => Promise<AccessSnapshot>;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const lockRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const [terminalError, setTerminalError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const [pending, setPending] = useState<ActionRow>();
  const [feedback, setFeedback] = useState<Record<string, 'saved' | 'failed'>>(
    {},
  );
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [configuredOnly, setConfiguredOnly] = useState(true);
  const [personalOnly, setPersonalOnly] = useState(false);
  useDrawerFormGuard(false, busy);
  useNavigationGuard(() => !lockRef.current);
  const rows = useMemo(
    () =>
      roleRows(options, subjectSets(snapshot, { type: 'user', id: userId })),
    [options, snapshot, userId],
  );
  const enabled = new Set(
    rows
      .filter((row) => row.enabled || inherited.has(row.id))
      .map((row) => resourceKey(row.resource.type, row.resource.value)),
  );
  const selectedTarget = (row: ActionRow) =>
    row.targetKeys?.includes(targets[row.id]) ? targets[row.id] : row.targetKey;
  const recordReadFailure = (error: unknown) => {
    if (
      error instanceof ApiClientError &&
      [401, 403, 404].includes(error.status)
    )
      setTerminalError(error);
    else setUncertain(true);
  };
  const reload = async () => {
    if (lockRef.current) return;
    lockRef.current = true;
    setBusy(true);
    try {
      await refresh();
      setUncertain(false);
      setFeedback({});
    } catch (error) {
      recordReadFailure(error);
    } finally {
      lockRef.current = false;
      setBusy(false);
    }
  };
  const change = async (row: ActionRow) => {
    if (lockRef.current || uncertain || !canEdit || row.custom) return;
    lockRef.current = true;
    setBusy(true);
    setPending(row);
    setFeedback((previous) => {
      const next = { ...previous };
      delete next[row.id];
      return next;
    });
    try {
      const result = await api.request<{ data: AccessSnapshot }>({
        method: 'PUT',
        path: `access/subjects/user/${encodeURIComponent(userId)}/grants`,
        json: {
          expectedRevision: snapshot.revision,
          ...(snapshot.revisionScope
            ? { revisionScope: snapshot.revisionScope }
            : {}),
          sharedSets: 'split',
          changes: [
            {
              resource: { type: row.resource.type, id: row.resource.value },
              action: row.action,
              ...(!row.sourceKeys?.length && selectedTarget(row)
                ? { permissionSet: selectedTarget(row) }
                : {}),
              value: row.enabled ? { scopes: row.scopes } : null,
            },
          ],
        },
      });
      saved(result.data);
      setFeedback((previous) => ({ ...previous, [row.id]: 'saved' }));
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        [401, 403, 404].includes(error.status)
      ) {
        setTerminalError(error);
        return;
      }
      // A lost response may follow a committed write. Re-read before accepting another mutation.
      try {
        const current = await refresh();
        const actual = roleRows(
          options,
          subjectSets(current, { type: 'user', id: userId }),
        ).find((item) => item.id === row.id);
        const matches =
          actual?.enabled === row.enabled &&
          (!row.enabled ||
            Object.keys(row.scopes).every(
              (key) => actual.scopes[key] === row.scopes[key],
            ));
        setFeedback((previous) => ({
          ...previous,
          [row.id]: matches ? 'saved' : 'failed',
        }));
      } catch (error) {
        recordReadFailure(error);
        setFeedback((previous) => ({ ...previous, [row.id]: 'failed' }));
      }
    } finally {
      setPending(undefined);
      lockRef.current = false;
      setBusy(false);
    }
  };
  const renderColumns: { render: (row: ActionRow) => ReactNode }[] = [
    {
      render: (row) => (
        <div className='flex flex-col gap-1'>
          <span className='font-medium'>{row.resource.label}</span>
          {row.label !== row.resource.label ? (
            <span className='text-xs text-muted-foreground'>{row.label}</span>
          ) : null}
        </div>
      ),
    },
    {
      render: (row) => {
        const scopes = row.resource.dataScopes?.[row.action] ?? [];
        if (!canInspect) return t('access.inheritedUnavailable');
        const entries = inherited.get(row.id);
        if (!entries) return t('access.notGranted');
        return (
          <div className='flex flex-col gap-2'>
            <span className='font-medium'>{t('access.configuredGrant')}</span>
            {scopes.length <= 1 ? (
              <InheritedScopeValues
                entries={entries}
                scopeKey={scopes[0]?.key}
                showValues={scopes.length === 1}
              />
            ) : null}
          </div>
        );
      },
    },
    {
      render: (original) => {
        const row = pending?.id === original.id ? pending : original;
        const needsTarget =
          !row.sourceKeys?.length && (row.targetKeys?.length ?? 0) > 1;
        const scopes = row.resource.dataScopes?.[row.action] ?? [];
        if (!canReadPersonal) return t('access.configurationDenied');
        return (
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2'>
              {canEdit && !row.custom ? (
                <Switch
                  aria-label={t('access.personalGrantAction', {
                    action: `${row.resource.label} · ${row.label}`,
                  })}
                  checked={row.enabled}
                  disabled={
                    busy || uncertain || (needsTarget && !selectedTarget(row))
                  }
                  onCheckedChange={(value) =>
                    void change({ ...row, enabled: value })
                  }
                />
              ) : null}
              <span>
                {t(
                  row.custom
                    ? 'access.special'
                    : row.enabled
                      ? 'access.personalGranted'
                      : 'access.notSet',
                )}
              </span>
            </div>
            {needsTarget && canEdit ? (
              <Select
                value={selectedTarget(row) ?? null}
                onValueChange={(value) => {
                  if (value !== null)
                    setTargets((previous) => ({
                      ...previous,
                      [row.id]: value,
                    }));
                }}
                disabled={busy || uncertain}
              >
                <SelectTrigger
                  aria-label={t('access.personalTarget')}
                  className='w-full'
                >
                  <SelectValue placeholder={t('access.personalTarget')} />
                </SelectTrigger>
                <SelectContent>
                  {row.targetKeys!.map((key) => (
                    <SelectItem key={key} value={key}>
                      {titleText(
                        snapshot.sets.find((set) => set.key === key)!.title,
                        t,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {!row.custom && row.enabled && scopes.length === 1 ? (
              <PersonalScopeFields
                row={row}
                scopes={scopes}
                showLabels={false}
                showHelp={false}
                disabled={!canEdit || !row.enabled || busy || uncertain}
                change={(values) => void change({ ...row, scopes: values })}
              />
            ) : null}
            {pending?.id === row.id || feedback[row.id] ? (
              <p
                role='status'
                className={
                  feedback[row.id] === 'failed'
                    ? 'text-xs text-destructive'
                    : 'text-xs text-muted-foreground'
                }
              >
                {t(
                  pending?.id === row.id
                    ? 'access.rowSaving'
                    : feedback[row.id] === 'saved'
                      ? 'access.rowSaved'
                      : uncertain
                        ? 'access.rowUncertain'
                        : 'access.rowFailed',
                )}
              </p>
            ) : null}
          </div>
        );
      },
    },
  ];
  // Stable cell components preserve focus while saving updates their content.
  const columns = useMemo<
    ColumnDef<ActionRow & { cells: ReactNode[] }, unknown>[]
  >(
    () => [
      {
        id: 'permission',
        header: t('access.permissionColumn'),
        cell: ({ row }) => row.original.cells[0],
      },
      {
        id: 'inherited',
        header: t('access.inheritedPermissions'),
        cell: ({ row }) => row.original.cells[1],
      },
      {
        id: 'personal',
        header: t('access.personalExceptions'),
        cell: ({ row }) => row.original.cells[2],
      },
    ],
    [t],
  );
  // Child rows are presentation only: they share the parent's action, revision and switch.
  // Real table rows align ranges even when source names or values wrap onto multiple lines.
  const displayRows = rows.flatMap((original) => {
    const row = pending?.id === original.id ? pending : original;
    const scopes = row.resource.dataScopes?.[row.action] ?? [];
    const parent = {
      ...original,
      permissionId: original.id,
      cells: renderColumns.map((column) => column.render(original)),
    };
    if (scopes.length <= 1 || (!row.enabled && !inherited.has(row.id)))
      return [parent];
    return [
      parent,
      ...scopes.map((scope) => ({
        ...original,
        permissionId: original.id,
        id: JSON.stringify([original.id, scope.key]),
        cells: [
          <div className='border-l pl-3 text-muted-foreground' key='name'>
            <span className='sr-only'>
              {row.resource.label} · {row.label}:{' '}
            </span>
            {scope.label}
          </div>,
          !canInspect ? (
            t('access.inheritedUnavailable')
          ) : inherited.has(row.id) ? (
            <InheritedScopeValues
              key='inherited'
              entries={inherited.get(row.id)!}
              scopeKey={scope.key}
            />
          ) : (
            t('access.notGranted')
          ),
          !canReadPersonal ? (
            t('access.configurationDenied')
          ) : row.custom ? (
            t('access.special')
          ) : row.enabled ? (
            <PersonalScopeFields
              key='personal'
              row={row}
              scopes={[scope]}
              showLabels={false}
              showHelp={false}
              disabled={!canEdit || busy || uncertain}
              change={(values) => void change({ ...row, scopes: values })}
            />
          ) : null,
        ],
      })),
    ];
  });
  if (terminalError) return <ErrorState error={terminalError} />;
  return (
    <div className='flex min-w-0 flex-col gap-4'>
      <p className='text-sm text-muted-foreground'>
        {t('access.inlinePermissionsHelp')}
      </p>
      <p className='text-xs text-muted-foreground'>
        {t('access.systemScopeHelp')}
      </p>
      <div className='flex flex-wrap items-center gap-3'>
        <ApplicationSearch
          placeholder={t('access.searchActions')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className='flex items-center gap-2 text-sm'>
          <Checkbox
            checked={configuredOnly}
            onCheckedChange={(value) => setConfiguredOnly(value === true)}
          />
          {t('access.configuredOnly')}
        </label>
        {canReadPersonal ? (
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={personalOnly}
              onCheckedChange={(value) => setPersonalOnly(value === true)}
            />
            {t('access.personalOnly')}
          </label>
        ) : null}
        <Button
          variant='outline'
          size='sm'
          disabled={busy}
          onClick={() => void reload()}
        >
          {t('access.refresh')}
        </Button>
      </div>
      {uncertain ? (
        <p role='alert' className='text-sm text-destructive'>
          {t('access.rowUncertain')}
        </p>
      ) : null}
      <AccessModulePermissions
        defaultAll
        options={options}
        enabled={enabled}
        onNavigate={(navigate) => {
          if (!lockRef.current) navigate();
        }}
      >
        {(keys) => (
          <DataTable
            columns={columns}
            data={displayRows.filter(
              (row) =>
                keys.has(resourceKey(row.resource.type, row.resource.value)) &&
                (!configuredOnly ||
                  row.enabled ||
                  inherited.has(row.permissionId) ||
                  feedback[row.permissionId] ||
                  pending?.id === row.permissionId) &&
                (!personalOnly ||
                  row.enabled ||
                  feedback[row.permissionId] ||
                  pending?.id === row.permissionId) &&
                `${row.resource.label} ${row.label} ${(row.resource.dataScopes?.[row.action] ?? []).map((scope) => scope.label).join(' ')}`
                  .toLocaleLowerCase()
                  .includes(query.toLocaleLowerCase()),
            )}
            getRowId={(row) => row.id}
            pagination={false}
            className='[&>div]:overflow-visible [&_[data-slot=responsive-table]]:overflow-visible! [&_[data-slot=table-container]]:overflow-visible [&_table]:min-w-0 [&_table]:table-fixed [&_td]:align-top! [&_td]:whitespace-normal [&_th]:whitespace-normal [&_td]:wrap-anywhere [&_dl]:grid-cols-1 sm:[&_dl]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] [&_th:first-child]:w-1/4 [&_thead]:sticky [&_thead]:top-[calc(-1*var(--route-overlay-body-padding,0px))] [&_thead]:z-10 [&_thead]:bg-muted'
          />
        )}
      </AccessModulePermissions>
    </div>
  );
}
