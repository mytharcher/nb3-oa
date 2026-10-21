import { ApplicationSearch } from '#components/application-search';
import { ApplicationToolbar } from '#components/application-toolbar';
import { useMemo, useCallback } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { TruncatedText } from '#components/truncated-text';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTableServer, DataTableColumnHeader } from '#components/data-table';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { useUrlSearch } from '#hooks/use-url-search';
import type { DutyRole } from '../org/duty-roles/types.js';
import { useCatalog, useDirectory, useLoad, useSnapshot } from './hooks.js';
import { grantSummary } from './model.js';
import { AccessTabs, Blank, ErrorState, Loading, Refresh } from './ui.js';
import type { SubjectRow } from './types.js';

export default function RolesPage() {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const location = useLocation();
  const search = useUrlSearch({ resetParams: ['page'] });
  const page = Math.max(1, Number(search.searchParams.get('page')) || 1);
  const pageSize = [20, 50, 100].includes(
    Number(search.searchParams.get('pageSize')),
  )
    ? Number(search.searchParams.get('pageSize'))
    : 20;
  const sort =
    search.searchParams.get('sort') === 'memberCount'
      ? 'memberCount'
      : search.searchParams.get('sort') === 'title'
        ? 'title'
        : 'category';
  const desc = search.searchParams.get('direction') === 'desc';
  const snapshot = useSnapshot();
  const catalog = useCatalog();
  const directory = useDirectory(catalog.options);
  const canMembers = useCan({
    resource: { type: 'settings', id: 'oa.org.dutyRoles' },
    action: 'read',
  }).can;
  const roles = useLoad(
    useCallback(
      async () =>
        canMembers
          ? (await api.request<{ data: DutyRole[] }>({ path: 'dutyRoles' }))
              .data
          : [],
      [api, canMembers],
    ),
  );
  const filter = search.searchParams.get('type') ?? 'all';
  const types = useMemo(
    () => [
      { value: 'all', label: t('access.all') },
      { value: 'org.dutyRole', label: t('access.dutyRoles') },
      { value: 'org.position', label: t('access.positions') },
      { value: 'org.department', label: t('access.departments') },
      { value: 'automatic', label: t('access.automatic') },
      { value: 'system', label: t('access.system') },
    ],
    [t],
  );
  const data = [
    ...(directory.data ?? []),
    ...(snapshot.data?.sets
      .filter((set) => set.unrestricted)
      .map((set) => ({
        type: 'system',
        id: set.key,
        title: t('access.systemAdmin'),
        description: '',
      })) ?? []),
  ]
    .filter(
      (row) =>
        (filter === 'all' ||
          filter === row.type ||
          (filter === 'automatic' &&
            [
              'authenticated',
              'org.reportingManager',
              'org.departmentHead',
            ].includes(row.type))) &&
        `${row.title} ${row.description ?? ''}`
          .toLocaleLowerCase()
          .includes(search.search.toLocaleLowerCase()),
    )
    .map((row) => {
      const role =
        row.type === 'org.dutyRole'
          ? roles.data?.find((role) => role.code === row.id)
          : undefined;
      return {
        ...row,
        memberCount:
          row.type === 'system'
            ? snapshot.data?.assignments.filter(
                (entry) => entry.permissionSet === row.id,
              ).length
            : role?.memberCount,
        active: role?.active,
      };
    });
  // Sort the entire aggregated directory before slicing; page and sort survive detail navigation.
  data.sort(
    (a, b) =>
      (sort !== 'memberCount'
        ? (sort === 'category'
            ? [
                'org.dutyRole',
                'org.position',
                'org.department',
                'authenticated',
                'org.reportingManager',
                'org.departmentHead',
                'system',
              ].indexOf(a.type) -
              [
                'org.dutyRole',
                'org.position',
                'org.department',
                'authenticated',
                'org.reportingManager',
                'org.departmentHead',
                'system',
              ].indexOf(b.type)
            : 0) || a.title.localeCompare(b.title, i18n.language)
        : (a.memberCount ?? -1) - (b.memberCount ?? -1)) * (desc ? -1 : 1),
  );
  const columns = useMemo<ColumnDef<SubjectRow>[]>(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('access.name')} />
        ),
        cell: ({ row }) => (
          <Link
            className='font-medium underline-offset-4 hover:underline'
            to={`${encodeURIComponent(row.original.type)}/${encodeURIComponent(row.original.id)}/permissions${location.search}`}
          >
            <TruncatedText text={row.original.title} />
          </Link>
        ),
      },
      {
        accessorKey: 'type',
        header: t('access.type'),
        cell: ({ row }) => (
          <Badge variant='outline'>
            {types.find((type) => type.value === row.original.type)?.label ??
              t('access.automatic')}
          </Badge>
        ),
      },
      {
        accessorKey: 'memberCount',
        header: ({ column }) => (
          <div className='flex justify-end'>
            <DataTableColumnHeader
              column={column}
              title={t('access.members')}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className='text-right tabular-nums'>
            {row.original.type === 'system'
              ? new Intl.NumberFormat(i18n.language).format(
                  row.original.memberCount ?? 0,
                )
              : row.original.type === 'org.dutyRole'
                ? roles.error
                  ? t('access.membersFailed')
                  : row.original.memberCount === undefined
                    ? t('access.memberDenied')
                    : row.original.memberCount === 0
                      ? t('access.missingMembers')
                      : new Intl.NumberFormat(i18n.language).format(
                          row.original.memberCount,
                        )
                : t('access.byMembership')}
          </div>
        ),
      },
      {
        id: 'permissions',
        header: t('access.permissions'),
        cell: ({ row }) => {
          if (row.original.type === 'system')
            return <Badge>{t('access.unrestricted')}</Badge>;
          const sets =
            snapshot.data?.sets.filter((set) =>
              snapshot.data?.assignments.some(
                (entry) =>
                  entry.permissionSet === set.key &&
                  entry.subject.type === row.original.type &&
                  entry.subject.id === row.original.id,
              ),
            ) ?? [];
          const summary = catalog.options
            ? [
                ...new Set(
                  sets.flatMap((set) => grantSummary(catalog.options!, set)),
                ),
              ].join(i18n.language.startsWith('zh') ? '、' : ', ')
            : '';
          return <TruncatedText text={summary || t('access.none')} />;
        },
      },
      // The directory filters are translated only when the locale changes.
    ],
    [
      t,
      i18n.language,
      location.search,
      roles.error,
      snapshot.data,
      catalog.options,
      types,
    ],
  );
  const reload = () => {
    snapshot.reload();
    catalog.reload();
    directory.reload();
    roles.reload();
  };
  const busy = snapshot.busy || catalog.busy || directory.busy || roles.busy;
  return (
    <PageContainer>
      <PageHeader
        title={t('access.title')}
        description={t('access.description')}
      />
      <AccessTabs />
      <p className='text-sm text-muted-foreground'>
        {t('access.baselineHelp')}
      </p>
      <ApplicationToolbar actions={<Refresh reload={reload} busy={busy} />}>
        <ApplicationSearch
          className='w-full sm:max-w-xs'
          placeholder={t('access.searchRoles')}
          {...search.inputProps}
        />
        <Select
          items={types}
          value={filter}
          onValueChange={(value) =>
            search.updateParams((params) => {
              if (value) params.set('type', value);
              params.delete('page');
            })
          }
        >
          <SelectTrigger
            className='w-full sm:w-40'
            aria-label={t('access.type')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {types.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {search.text || filter !== 'all' ? (
          <Button
            variant='ghost'
            onClick={() => search.clear((params) => params.delete('type'))}
          >
            {t('access.clear')}
          </Button>
        ) : null}
      </ApplicationToolbar>
      {snapshot.error || catalog.error || directory.error ? (
        <ErrorState
          error={snapshot.error ?? catalog.error ?? directory.error}
          retry={reload}
        />
      ) : !snapshot.data || !catalog.options || !directory.data ? (
        <Loading />
      ) : (
        <DataTableServer
          columns={columns}
          rows={data.slice((page - 1) * pageSize, page * pageSize)}
          total={data.length}
          pagination={{ pageIndex: page - 1, pageSize }}
          onPaginationChange={(value) =>
            search.updateParams((params) => {
              params.set('page', String(value.pageIndex + 1));
              params.set('pageSize', String(value.pageSize));
            })
          }
          sorting={sort === 'category' ? [] : [{ id: sort, desc }]}
          onSortingChange={(value) =>
            search.updateParams((params) => {
              params.set('sort', value[0]?.id ?? 'title');
              params.set('direction', value[0]?.desc ? 'desc' : 'asc');
              params.delete('page');
            })
          }
          pageSizeOptions={[20, 50, 100]}
          getRowId={(row) => `${row.type}:${row.id}`}
          emptyMessage={
            <Blank
              title={t(
                search.text || filter !== 'all'
                  ? 'access.noResults'
                  : 'access.emptyDirectory',
              )}
              description={t(
                search.text || filter !== 'all'
                  ? 'access.clearHelp'
                  : 'access.emptyHelp',
              )}
              action={
                search.text || filter !== 'all' ? (
                  <Button
                    onClick={() =>
                      search.clear((params) => params.delete('type'))
                    }
                  >
                    {t('access.clear')}
                  </Button>
                ) : undefined
              }
            />
          }
        />
      )}
      <Outlet context={{ reload }} />
    </PageContainer>
  );
}
