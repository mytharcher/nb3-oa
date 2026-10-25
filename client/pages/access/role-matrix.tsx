import { PencilIcon } from 'lucide-react';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router';
import {
  useApiClient,
  useToaster,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useDrawerFormGuard } from '#hooks/use-drawer-form-guard';
import { FormActions } from '#components/form-actions';
import {
  PersonalScopeFields,
  PermissionScopeSummary,
  PermissionSources,
  type PermissionSourceDetails,
} from './permission-scope-details.js';
import { PermissionEditor } from '#components/permission-editor';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationSearch } from '#components/application-search';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import { Field, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Spinner } from '#components/ui/spinner';
import { useAuthorizationClient } from '../administration/authorization/use-authorization-client.js';
import { titleText } from '../administration/authorization/i18n.js';
import { ConfirmDialog } from '../administration/authorization/components/confirm-dialog.js';
import { resourceKey } from '../administration/authorization/pages/permission-sets/drafts.js';
import { AccessModulePermissions } from './module-permissions.js';
import { useRoleDirectory } from './hooks.js';
import { useLoad } from './hooks.js';
import { ErrorState, Blank } from './ui.js';
import {
  roleRows,
  subjectSets,
  rowValue,
  sensitiveSummary,
  actionRows,
} from './model.js';
import type {
  AccessSnapshot,
  AuthorizationOptions,
  ActionRow,
} from './types.js';

export function RoleMatrix({
  snapshot,
  options,
  name,
  canEdit,
  memberCount,
  saved,
  reload,
  subject,
  cancel,
  inheritedPermissions,
  editingResource,
  editResource,
}: {
  editingResource?: string;
  editResource?: (key: string) => void;
  inheritedPermissions?: {
    lines: ReadonlyMap<string, readonly string[]>;
    details?: ReadonlyMap<string, readonly PermissionSourceDetails[]>;
    unavailable?: boolean;
    personalUnavailable?: boolean;
  };
  cancel?: () => void;
  subject?: { type: string; id: string };
  snapshot: AccessSnapshot;
  options: AuthorizationOptions;
  name: string;
  canEdit: boolean;
  memberCount?: number;
  saved: (data: AccessSnapshot) => void;
  reload: () => void;
}) {
  const route = useParams();
  const { type = '', id = '' } = subject ?? route;
  const [params] = useSearchParams();
  const focus = params.get('focus');
  useEffect(() => {
    if (!focus) return;
    const target = document.getElementById(focus);
    const row = target?.closest('[data-slot=permission-row]') ?? target;
    row?.scrollIntoView?.({ block: 'center' });
    row
      ?.querySelector<HTMLElement>('[role=switch]')
      ?.focus({ preventScroll: true });
  }, [focus]);
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const client = useAuthorizationClient();
  const sets = useMemo(
    () => subjectSets(snapshot, { type, id }),
    [snapshot, type, id],
  );
  const original = useMemo(() => roleRows(options, sets), [options, sets]);
  const baseline = roleRows(
    options,
    subjectSets(snapshot, { type: 'authenticated', id: '*' }),
    false,
  );
  const [rows, setRows] = useState(original);
  const [draftRevision, setDraftRevision] = useState(snapshot.revision);
  // A successful save or explicitly confirmed conflict reload establishes a new draft.
  // Keep the matrix mounted so filters, open cards and scroll position survive editing.
  if (draftRevision !== snapshot.revision) {
    setDraftRevision(snapshot.revision);
    setRows(original);
  }
  const [compareOpen, setCompareOpen] = useState(false);
  const directory = useRoleDirectory(compareOpen);
  const [comparisonId, setComparisonId] = useState('');
  const comparison = useLoad(
    useCallback(async () => {
      if (!comparisonId) return undefined;
      const [otherType, otherId] = JSON.parse(comparisonId) as [string, string];
      return (
        await api.request<{ data: AccessSnapshot }>({
          path: `access/subjects/${encodeURIComponent(otherType)}/${encodeURIComponent(otherId)}`,
        })
      ).data;
    }, [api, comparisonId]),
  );
  const comparisonSubject = comparisonId
    ? (JSON.parse(comparisonId) as [string, string])
    : ['', ''];
  const comparisonRows = comparison.data
    ? roleRows(
        options,
        subjectSets(comparison.data, {
          type: comparisonSubject[0],
          id: comparisonSubject[1],
        }),
      )
    : [];
  const comparisonChoices = [
    { value: '', label: t('access.none') },
    ...(directory.data ?? [])
      .filter(
        (role) =>
          role.type !== 'system' && !(role.type === type && role.id === id),
      )
      .map((role) => ({
        value: JSON.stringify([role.type, role.id]),
        label: role.title,
      })),
  ];
  const [query, setQuery] = useState('');
  const [personalOnly, setPersonalOnly] = useState(false);
  const [onlyEnabled, setOnlyEnabled] = useState(!focus);
  const [confirm, setConfirm] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [reloadAfterDiscard, setReloadAfterDiscard] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [sharedSets, setSharedSets] = useState('split');
  const bypassRef = useRef(false);
  const changes = rows.filter(
    (row, index) =>
      !row.custom &&
      (!inheritedPermissions ||
        editingResource ===
          resourceKey(row.resource.type, row.resource.value)) &&
      (row.enabled !== original[index].enabled ||
        (row.enabled &&
          JSON.stringify(row.scopes) !==
            JSON.stringify(original[index].scopes))),
  );
  const targetRequired = changes.some(
    (row) =>
      row.enabled &&
      !row.sourceKeys?.length &&
      (row.targetKeys?.length ?? 0) > 1 &&
      !row.targetKey,
  );
  const closeGuard = useDrawerFormGuard(changes.length > 0, busy, () => {
    bypassRef.current = true;
  });
  useNavigationGuard(
    () =>
      bypassRef.current ||
      (!busy && (!changes.length || window.confirm(t('access.discardHelp')))),
  );
  const shared = useMemo(() => {
    const affected = sets.filter((set) =>
      changes.some((row) =>
        (row.sourceKeys?.length
          ? row.sourceKeys
          : row.targetKey
            ? [row.targetKey]
            : row.targetKeys?.length === 1
              ? row.targetKeys
              : []
        ).includes(set.key),
      ),
    );
    return snapshot.assignments.filter(
      (entry) =>
        affected.some((set) => set.key === entry.permissionSet) &&
        (entry.subject.type !== type || entry.subject.id !== id),
    );
  }, [sets, changes, snapshot, type, id]);
  const impactKey = JSON.stringify(shared.map((entry) => entry.subject));
  const impact = useLoad(
    useCallback(async () => {
      const subjects = JSON.parse(impactKey) as { type: string; id: string }[];
      const names: string[] = [];
      for (const subjectType of new Set(subjects.map((entry) => entry.type))) {
        const ids = [
          ...new Set(
            subjects
              .filter((entry) => entry.type === subjectType)
              .map((entry) => entry.id),
          ),
        ];
        const selection = options.subjectTypes.find(
          (entry) => entry.value === subjectType,
        );
        if (selection?.selection?.type === 'fixed') names.push(selection.label);
        else {
          for (let offset = 0; offset < ids.length; offset += 100) {
            const batch = ids.slice(offset, offset + 100);
            const resolved = await client.resolveSubjects(
              'permissionSets',
              subjectType,
              batch,
            );
            if (batch.some((id) => !resolved.some((entry) => entry.id === id)))
              throw new Error('IMPACT_UNAVAILABLE');
            names.push(...resolved.map((entry) => titleText(entry.title, t)));
          }
        }
      }
      return names;
    }, [client, impactKey, options, t]),
  );
  const display = (row: ActionRow) =>
    rowValue(
      row,
      t('access.deniedAction'),
      t('access.configuredGrant'),
      t('access.special'),
    );
  const sensitive = new Set(
    sensitiveSummary(options, {
      key: '',
      grants: rows.map((row) => ({
        resource: { type: row.resource.type, id: row.resource.value },
        actions: [{ action: row.action }],
      })),
    }),
  );
  const change = (
    rowId: string,
    enabled?: boolean,
    scopes?: Record<string, string>,
  ) => {
    bypassRef.current = false;
    closeGuard.markEditing();
    setRows((current) => {
      const changed = current.find((row) => row.id === rowId);
      return current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              enabled: enabled ?? row.enabled,
              scopes: scopes ?? row.scopes,
            }
          : !inheritedPermissions &&
              enabled &&
              changed?.resource.type === 'composite' &&
              row.resource.type === 'page' &&
              row.resource.value === changed.resource.value &&
              !row.custom
            ? { ...row, enabled: true }
            : row,
      );
    });
  };
  async function save() {
    setBusy(true);
    setError(undefined);
    try {
      const result = await api.request<{ data: AccessSnapshot }>({
        path: `access/subjects/${encodeURIComponent(type)}/${encodeURIComponent(id)}/grants`,
        method: 'PUT',
        json: {
          expectedRevision: snapshot.revision,
          ...(snapshot.revisionScope
            ? { revisionScope: snapshot.revisionScope }
            : {}),
          sharedSets,
          changes: changes.map((row) => ({
            resource: { type: row.resource.type, id: row.resource.value },
            action: row.action,
            ...(!row.sourceKeys?.length && row.targetKey
              ? { permissionSet: row.targetKey }
              : {}),
            value: row.enabled ? { scopes: row.scopes } : null,
          })),
        },
      });
      bypassRef.current = true;
      closeGuard.markSaved();
      saved(result.data);
      setConfirm(false);
      toaster.show({ type: 'success', title: t('access.saved', { name }) });
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className='flex flex-col gap-4'>
      {closeGuard.confirmation}
      {type === 'org.department' ? (
        <p className='text-sm text-muted-foreground'>
          {t('access.baseOnlyDepartment')}
        </p>
      ) : null}
      {error && !confirm ? (
        <ErrorState
          error={error}
          retry={() => {
            setReloadAfterDiscard(true);
            setDiscard(true);
          }}
        />
      ) : null}
      <ApplicationToolbar
        actions={
          type !== 'user' ? (
            <div className='flex flex-wrap items-center gap-2'>
              <Select
                onOpenChange={(open) => {
                  if (open) setCompareOpen(true);
                }}
                items={comparisonChoices}
                value={comparisonId}
                onValueChange={(value) => setComparisonId(value ?? '')}
                disabled={busy}
              >
                <SelectTrigger
                  className='w-full sm:w-64'
                  aria-label={t('access.compareRole')}
                >
                  <SelectValue placeholder={t('access.compareRole')} />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  {comparisonChoices.map((choice) => (
                    <SelectItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {canEdit ? (
                <Button
                  variant='outline'
                  disabled={busy || !comparison.data || comparison.busy}
                  onClick={() =>
                    setRows((current) =>
                      current.map((row) => {
                        const source = comparisonRows.find(
                          (entry) => entry.id === row.id,
                        );
                        return row.custom || source?.custom || !source
                          ? row
                          : {
                              ...row,
                              enabled: source.enabled,
                              scopes: { ...source.scopes },
                            };
                      }),
                    )
                  }
                >
                  {t('access.copyRole')}
                </Button>
              ) : null}
              {comparisonId ? (
                <p className='text-sm text-muted-foreground'>
                  {t('access.copyHelp')}
                </p>
              ) : null}
              {comparison.error ? (
                <ErrorState
                  error={comparison.error}
                  retry={comparison.reload}
                />
              ) : null}
            </div>
          ) : null
        }
      >
        <ApplicationSearch
          aria-label={t('access.searchActions')}
          placeholder={t('access.searchActions')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className='flex shrink-0 items-center gap-2 text-sm'>
          <Checkbox
            checked={onlyEnabled}
            onCheckedChange={(value) => setOnlyEnabled(Boolean(value))}
          />
          {t('access.onlyConfigured')}
        </label>
        {inheritedPermissions ? (
          <label className='flex items-center gap-2 text-sm'>
            <Checkbox
              checked={personalOnly}
              onCheckedChange={(value) => setPersonalOnly(Boolean(value))}
            />
            {t('access.personalOnly')}
          </label>
        ) : null}
      </ApplicationToolbar>
      <AccessModulePermissions
        defaultAll
        options={options}
        enabled={
          new Set(
            rows
              .filter(
                (row) => row.enabled || inheritedPermissions?.lines.has(row.id),
              )
              .map((row) => resourceKey(row.resource.type, row.resource.value)),
          )
        }
        onNavigate={(navigate) => {
          bypassRef.current = true;
          navigate();
          queueMicrotask(() => {
            bypassRef.current = false;
          });
        }}
      >
        {(keys) => {
          const visible = rows.filter(
            (row) =>
              keys.has(resourceKey(row.resource.type, row.resource.value)) &&
              (!personalOnly ||
                row.enabled ||
                original.find((entry) => entry.id === row.id)?.enabled) &&
              (inheritedPermissions
                ? !onlyEnabled ||
                  row.enabled ||
                  original.find((entry) => entry.id === row.id)?.enabled ||
                  inheritedPermissions.lines.has(row.id) ||
                  editingResource ===
                    resourceKey(row.resource.type, row.resource.value)
                : !onlyEnabled ||
                  rows.some(
                    (entry, index) =>
                      entry.resource === row.resource &&
                      (entry.enabled || original[index].enabled),
                  ) ||
                  comparisonRows.some(
                    (entry) =>
                      entry.enabled &&
                      entry.resource.type === row.resource.type &&
                      entry.resource.value === row.resource.value,
                  )) &&
              `${row.resource.label} ${row.label}`
                .toLocaleLowerCase()
                .includes(query.toLocaleLowerCase()),
          );
          return (
            <div className='flex flex-col gap-4'>
              {!visible.length ? (
                <Blank
                  title={t('access.noResults')}
                  description={t('access.clearHelp')}
                  action={
                    <Button
                      variant='outline'
                      onClick={() => {
                        setQuery('');
                        setOnlyEnabled(false);
                        setPersonalOnly(false);
                      }}
                    >
                      {t('access.clear')}
                    </Button>
                  }
                />
              ) : null}
              {[...new Set(visible.map((row) => row.resource))].map(
                (resource) => {
                  const resourceId = resourceKey(resource.type, resource.value);
                  const editable =
                    canEdit &&
                    (!inheritedPermissions || editingResource === resourceId);
                  const entries = visible.filter(
                    (row) => row.resource === resource,
                  );
                  const regular = entries.filter(
                    (row) => inheritedPermissions || !row.custom,
                  );
                  return (
                    <PermissionEditor
                      key={resourceKey(resource.type, resource.value)}
                      readOnly={!editable || busy}
                      labels={{
                        levelFor: (name) =>
                          t('access.levelFor', {
                            name: `${resource.label} · ${name}`,
                          }),
                      }}
                      onEnabledChange={(id, enabled) => change(id, enabled)}
                      onLevelChange={(id, value) => {
                        const row = regular.find((entry) => entry.id === id)!;
                        const scope = resource.dataScopes?.[row.action]?.[0];
                        if (scope)
                          change(id, undefined, {
                            ...row.scopes,
                            [scope.key]: value,
                          });
                      }}
                      sections={[
                        {
                          id: resourceKey(resource.type, resource.value),
                          title: resource.label,
                          action:
                            editResource && !canEdit ? (
                              <Button
                                className='[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/permission-card:opacity-100 [@media(hover:hover)]:group-focus-within/permission-card:opacity-100 focus-visible:opacity-100'
                                size='icon-sm'
                                variant='ghost'
                                aria-label={t('access.editPersonalCard', {
                                  name: resource.label,
                                })}
                                title={t('access.editPersonalCard', {
                                  name: resource.label,
                                })}
                                onClick={() => {
                                  setRows(original);
                                  setSharedSets('split');
                                  setError(undefined);
                                  bypassRef.current = false;
                                  closeGuard.markEditing();
                                  editResource(resourceId);
                                }}
                              >
                                <PencilIcon className='size-4' />
                              </Button>
                            ) : undefined,
                          groups: [
                            {
                              id: 'actions',
                              rows: regular.map((row) => {
                                const scopes =
                                  resource.dataScopes?.[row.action] ?? [];
                                const inherited =
                                  type !== 'authenticated' &&
                                  baseline.find(
                                    (entry) =>
                                      entry.id === row.id && entry.enabled,
                                  );
                                return {
                                  id: row.id,
                                  label: row.label,
                                  enabled: row.enabled,
                                  comparison: inheritedPermissions
                                    ? {
                                        inheritedLabel: t(
                                          'access.inheritedPermissions',
                                        ),
                                        personalLabel: t(
                                          'access.personalExceptions',
                                        ),
                                        inherited:
                                          inheritedPermissions.unavailable ? (
                                            t('access.inheritedUnavailable')
                                          ) : inheritedPermissions.details?.has(
                                              row.id,
                                            ) ? (
                                            <PermissionSources
                                              entries={inheritedPermissions.details.get(
                                                row.id,
                                              )!}
                                            />
                                          ) : (
                                            (inheritedPermissions.lines
                                              .get(row.id)
                                              ?.map((line) => (
                                                <p key={line}>{line}</p>
                                              )) ?? t('access.notGranted'))
                                          ),
                                        value:
                                          inheritedPermissions.personalUnavailable ? (
                                            t('access.configurationDenied')
                                          ) : row.enabled ? (
                                            row.custom || !scopes.length ? (
                                              display(row)
                                            ) : (
                                              <PermissionScopeSummary
                                                scopes={scopes.map((scope) => ({
                                                  key: scope.key,
                                                  label: scope.label,
                                                  value: row.scopes[scope.key]
                                                    ? (scope.options.find(
                                                        (option) =>
                                                          option.value ===
                                                          row.scopes[scope.key],
                                                      )?.label ??
                                                      t('access.special'))
                                                    : t('access.systemScope'),
                                                }))}
                                              />
                                            )
                                          ) : (
                                            t('access.notSet')
                                          ),
                                        editDescription: row.enabled
                                          ? t('access.personalGrantEnabled')
                                          : t('access.personalGrantOff'),
                                        scopeFields: (
                                          <PersonalScopeFields
                                            row={row}
                                            scopes={scopes}
                                            disabled={!editable || busy}
                                            change={(values) =>
                                              change(row.id, undefined, values)
                                            }
                                          />
                                        ),
                                        pendingLabel: changes.some(
                                          (entry) => entry.id === row.id,
                                        )
                                          ? t('access.personalGrantPending')
                                          : undefined,
                                        readOnly: !editable || row.custom,
                                      }
                                    : undefined,
                                  hint:
                                    [
                                      inherited && !inheritedPermissions
                                        ? `${t('access.baseline')} · ${display(inherited)}`
                                        : '',
                                      sensitive.has(
                                        `${resource.label} · ${row.label}`,
                                      )
                                        ? t('access.sensitive')
                                        : '',
                                    ]
                                      .filter(Boolean)
                                      .join(' · ') || undefined,
                                  levels:
                                    scopes.length === 1
                                      ? scopes[0].options
                                      : undefined,
                                  level:
                                    scopes.length === 1
                                      ? row.scopes[scopes[0].key]
                                      : undefined,
                                };
                              }),
                            },
                          ],
                          footer: (
                            <div className='flex flex-col gap-3'>
                              {comparison.data ? (
                                <p>
                                  {t('access.compareRole')}:{' '}
                                  {comparisonRows
                                    .filter(
                                      (row) =>
                                        row.enabled &&
                                        row.resource.type === resource.type &&
                                        row.resource.value === resource.value,
                                    )
                                    .map(
                                      (row) => `${row.label} · ${display(row)}`,
                                    )
                                    .join(' / ') || t('access.deniedAction')}
                                </p>
                              ) : null}
                              {regular
                                .filter(
                                  (row) =>
                                    (!inheritedPermissions || editable) &&
                                    row.enabled &&
                                    !row.sourceKeys?.length &&
                                    (row.targetKeys?.length ?? 0) > 1,
                                )
                                .map((row) => {
                                  const targets = sets
                                    .filter((set) =>
                                      row.targetKeys!.includes(set.key),
                                    )
                                    .map((set, index) => ({
                                      value: set.key,
                                      label: `${titleText(set.title, t, t('access.permissions'))} · ${actionRows(
                                        options,
                                        set,
                                      )
                                        .filter(
                                          (entry) =>
                                            entry.enabled &&
                                            entry.resource.type ===
                                              row.resource.type &&
                                            entry.resource.value ===
                                              row.resource.value,
                                        )
                                        .map((entry) => entry.label)
                                        .join(
                                          ' / ',
                                        )} · ${t('access.sourceNumber', { number: index + 1 })}`,
                                    }));
                                  return (
                                    <Field key={`target-${row.id}`}>
                                      <FieldLabel htmlFor={`target-${row.id}`}>
                                        {row.label} · {t('access.targetSet')}{' '}
                                        <span
                                          className='text-destructive'
                                          aria-hidden='true'
                                        >
                                          *
                                        </span>
                                      </FieldLabel>
                                      <Select
                                        items={targets}
                                        value={row.targetKey ?? null}
                                        disabled={busy || !canEdit}
                                        onValueChange={(value) =>
                                          setRows((current) =>
                                            current.map((entry) =>
                                              entry.id === row.id
                                                ? {
                                                    ...entry,
                                                    targetKey:
                                                      value ?? undefined,
                                                  }
                                                : entry,
                                            ),
                                          )
                                        }
                                      >
                                        <SelectTrigger
                                          size='sm'
                                          className='w-full text-sm'
                                          id={`target-${row.id}`}
                                          aria-required='true'
                                        >
                                          <SelectValue
                                            placeholder={t(
                                              'access.chooseTarget',
                                            )}
                                          />
                                        </SelectTrigger>
                                        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                                          {targets.map((target) => (
                                            <SelectItem
                                              value={target.value}
                                              key={target.value}
                                            >
                                              {target.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      {!row.targetKey ? (
                                        <p className='text-sm text-muted-foreground'>
                                          {t('access.targetRequired')}
                                        </p>
                                      ) : null}
                                    </Field>
                                  );
                                })}
                              {regular
                                .filter(
                                  (row) =>
                                    !inheritedPermissions &&
                                    row.enabled &&
                                    (resource.dataScopes?.[row.action]
                                      ?.length ?? 0) > 1,
                                )
                                .map((row) => (
                                  <div key={row.id}>
                                    {resource.dataScopes![row.action].map(
                                      (scope) => (
                                        <Field key={scope.key}>
                                          <FieldLabel
                                            htmlFor={`${row.id}-${scope.key}`}
                                          >
                                            {row.label} · {scope.label}
                                          </FieldLabel>
                                          <Select
                                            value={row.scopes[scope.key]}
                                            items={scope.options}
                                            disabled={!canEdit || busy}
                                            onValueChange={(value) => {
                                              if (value !== null)
                                                change(row.id, undefined, {
                                                  ...row.scopes,
                                                  [scope.key]: value,
                                                });
                                            }}
                                          >
                                            <SelectTrigger
                                              size='sm'
                                              className='w-full text-sm'
                                              id={`${row.id}-${scope.key}`}
                                            >
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                                              {scope.options.map((option) => (
                                                <SelectItem
                                                  key={option.value}
                                                  value={option.value}
                                                >
                                                  {option.label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </Field>
                                      ),
                                    )}
                                  </div>
                                ))}
                              {!inheritedPermissions &&
                              entries.some((row) => row.custom) ? (
                                <div className='text-sm text-muted-foreground'>
                                  {entries
                                    .filter((row) => row.custom)
                                    .map((row) => (
                                      <p key={row.id} id={row.id}>
                                        {row.label} ·{' '}
                                        {t('access.specialReadOnly')}
                                      </p>
                                    ))}
                                </div>
                              ) : null}
                            </div>
                          ),
                        },
                      ]}
                    />
                  );
                },
              )}
            </div>
          );
        }}
      </AccessModulePermissions>
      {canEdit ? (
        <FormActions>
          <span className='text-sm text-muted-foreground'>
            {t('access.changedCount', { count: changes.length })}
          </span>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => (changes.length ? setDiscard(true) : cancel?.())}
          >
            {t('access.cancel')}
          </Button>
          <Button
            disabled={
              busy ||
              !changes.length ||
              targetRequired ||
              impact.busy ||
              Boolean(impact.error)
            }
            onClick={() => setConfirm(true)}
          >
            {busy ? <Spinner /> : null}
            {t('access.save')}
          </Button>
        </FormActions>
      ) : null}
      {impact.error ? (
        <ErrorState error={impact.error} retry={impact.reload} />
      ) : null}
      <ConfirmDialog
        open={confirm}
        title={t('access.confirmTitle', { name })}
        confirmLabel={t('access.save')}
        cancelLabel={t('access.cancel')}
        busy={busy}
        variant='default'
        error={
          error ? (
            <ErrorState
              error={error}
              retry={() => {
                setReloadAfterDiscard(true);
                setDiscard(true);
              }}
            />
          ) : undefined
        }
        onCancel={() => setConfirm(false)}
        onConfirm={() => void save()}
      >
        <span className='block'>
          {t('access.roleImpact', {
            name,
            count: memberCount ?? t('access.membersUnknown'),
          })}
        </span>
        {changes.map((row) => (
          <span className='block' key={row.id}>
            {row.resource.label} · {row.label}:{' '}
            {display(original.find((entry) => entry.id === row.id)!)} →{' '}
            {display(row)}{' '}
            {sensitive.has(`${row.resource.label} · ${row.label}`)
              ? t('access.sensitive')
              : ''}
          </span>
        ))}
        {shared.length ? (
          <span className='block mt-3'>
            {t('access.sharedObjects', { names: impact.data?.join(' · ') })}
            <label className='flex items-center gap-2'>
              <Checkbox
                checked={sharedSets === 'all'}
                disabled={busy}
                onCheckedChange={(value) =>
                  setSharedSets(value ? 'all' : 'split')
                }
              />
              {t('access.changeShared')}
            </label>
            <span className='block'>{t('access.splitDefault')}</span>
          </span>
        ) : null}
      </ConfirmDialog>
      <ConfirmDialog
        open={discard}
        title={t('access.discardTitle')}
        confirmLabel={t('access.discard')}
        cancelLabel={t('access.cancel')}
        onCancel={() => {
          setReloadAfterDiscard(false);
          setDiscard(false);
        }}
        onConfirm={() => {
          setRows(original);
          setError(undefined);
          setDiscard(false);
          if (reloadAfterDiscard) {
            setReloadAfterDiscard(false);
            setConfirm(false);
            reload();
          } else {
            bypassRef.current = true;
            closeGuard.markSaved();
            cancel?.();
          }
        }}
      >
        {t('access.discardHelp')}
      </ConfirmDialog>
    </div>
  );
}
