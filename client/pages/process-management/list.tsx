import { useProcessText } from './text.js';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, Outlet, useLocation } from 'react-router';
import { useEffect, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageHeader } from '#components/page-header';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationSearch } from '#components/application-search';
import { DataTableColumnHeader } from '#components/data-table/column-header';
import { DataTableServer } from '#components/data-table/server-table';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { TruncatedText } from '#components/truncated-text';
import { Tabs, TabsList, TabsTrigger } from '#components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { useUrlSearch } from '#hooks/use-url-search';
import { useProcessResource, ProcessListContext } from './resource.js';
import { Refresh, Failure, EmptyList, State } from './shared.js';
import { ProcessDateRange } from './date-range.js';
import type { ExecutionDto } from '../../../server/routes/process-management/schemas.js';
type ProcessRow = {
  kind: string;
  domain: string;
  category: string;
  connected: boolean;
  capabilities: string[];
};
type ListResult<T> = {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    timeZone: string;
    kinds?: string[];
    statuses?: string[];
  };
};
export default function ProcessList() {
  const { t, i18n } = useTranslation(),
    location = useLocation(),
    text = useProcessText();
  const definitions = location.pathname.includes(
    '/processManagement/definitions',
  );
  const search = useUrlSearch({ param: 'search', resetParams: ['page'] });
  const query = Object.fromEntries(
    [...search.searchParams].filter(
      ([key]) =>
        [
          'search',
          'kind',
          'status',
          'from',
          'to',
          'page',
          'pageSize',
          'orderBy',
          'direction',
        ].includes(key) &&
        (!definitions || !['kind', 'status', 'from', 'to'].includes(key)),
    ),
  );
  query.locale = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US';
  const resource = useProcessResource<ListResult<ProcessRow | ExecutionDto>>(
    `processManagement/${definitions ? 'definitions' : 'executions'}`,
    query,
  );
  const available = useProcessResource<ListResult<ProcessRow>>(
    'processManagement/definitions',
    { pageSize: '100' },
  );
  const filtered = ['search', 'kind', 'status', 'from', 'to'].some((key) =>
    Boolean(query[key]),
  );
  const page = resource.data?.meta.page ?? Number(query.page ?? 1),
    pageSize = Number(query.pageSize ?? 20);
  useEffect(() => {
    const actual = resource.data?.meta.page;
    if (actual && actual !== Number(query.page ?? 1))
      search.updateParams((p) => p.set('page', String(actual)));
  }, [resource.data?.meta.page, query.page, search]);
  const columns = useMemo<
    ColumnDef<ProcessRow | ExecutionDto, unknown>[]
  >(() => {
    const link = (row: ProcessRow | ExecutionDto) => {
      const label =
        'recordLabel' in row
          ? (row.number ?? `${text.name(row.kind)} · ${row.recordLabel}`)
          : text.name(row.kind);
      return (
        <TruncatedText text={label}>
          <Link
            className='font-medium underline-offset-4 hover:underline'
            to={{
              pathname: 'id' in row ? `${row.kind}/${row.id}` : row.kind,
              search: location.search,
              hash: location.hash,
            }}
          >
            {label}
          </Link>
        </TruncatedText>
      );
    };
    if (definitions)
      return [
        {
          id: 'name',
          enableSorting: true,
          accessorFn: (row) => text.name(row.kind),
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t('processManagement.name')}
            />
          ),
          cell: ({ row }) => link(row.original),
        },
        {
          id: 'domain',
          header: t('processManagement.domain'),
          cell: ({ row }) =>
            'domain' in row.original
              ? t(`processManagement.domains.${row.original.domain}`)
              : '—',
        },
        {
          id: 'category',
          header: t('processManagement.category'),
          cell: () => (
            <Badge variant='outline'>{t('processManagement.approval')}</Badge>
          ),
        },
        {
          id: 'connected',
          header: t('processManagement.connected'),
          cell: () => (
            <Badge variant='outline'>{t('processManagement.connected')}</Badge>
          ),
        },
        {
          id: 'capabilities',
          header: t('processManagement.capabilities'),
          cell: ({ row }) =>
            'capabilities' in row.original && row.original.capabilities.length
              ? row.original.capabilities.map((action) => (
                  <Badge className='mr-1' key={action} variant='secondary'>
                    {t(`processManagement.${action}`)}
                  </Badge>
                ))
              : t('processManagement.readOnly'),
        },
      ];
    return [
      {
        id: 'reference',
        header: t('processManagement.reference'),
        cell: ({ row }) => link(row.original),
        enableSorting: false,
      },
      {
        id: 'kind',
        header: t('processManagement.name'),
        cell: ({ row }) => text.name(row.original.kind),
        enableSorting: false,
      },
      {
        id: 'applicant',
        header: t('processManagement.applicant'),
        cell: ({ row }) =>
          'applicant' in row.original
            ? (row.original.applicant?.name ?? '—')
            : '—',
        enableSorting: false,
      },
      {
        id: 'stage',
        header: t('processManagement.stage'),
        enableSorting: false,
        cell: ({ row }) =>
          'currentStage' in row.original && row.original.currentStage ? (
            <State value={row.original.currentStage} />
          ) : (
            '—'
          ),
      },
      {
        id: 'status',
        header: t('processManagement.status'),
        cell: ({ row }) =>
          'status' in row.original ? (
            <State value={row.original.status} />
          ) : null,
        enableSorting: false,
      },
      ...(['createdAt', 'endedAt'] as const).map(
        (key): ColumnDef<ProcessRow | ExecutionDto> => ({
          id: key,
          header: ({ column }) => (
            <DataTableColumnHeader
              column={column}
              title={t(`processManagement.${key}`)}
            />
          ),
          enableSorting: true,
          cell: ({ row }: { row: { original: ProcessRow | ExecutionDto } }) =>
            key in row.original && (row.original as ExecutionDto)[key]
              ? new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: resource.data?.meta.timeZone,
                }).format(new Date(String((row.original as ExecutionDto)[key])))
              : '—',
        }),
      ),
    ];
  }, [
    definitions,
    t,
    text,
    location.search,
    location.hash,
    i18n.language,
    resource.data?.meta,
  ]);
  function filter(key: string, value: string) {
    search.updateParams((p) => {
      if (value === 'all') p.delete(key);
      else p.set(key, value);
      p.delete('page');
    });
  }
  const clear = () =>
    search.clear((p) => {
      for (const key of ['kind', 'status', 'from', 'to', 'page']) p.delete(key);
    });
  return (
    <ProcessListContext.Provider value={resource.reload}>
      <PageHeader
        title={t('processManagement.title')}
        description={t('processManagement.description')}
        actions={<Refresh busy={resource.loading} onClick={resource.reload} />}
      />
      <Tabs value={definitions ? 'definitions' : 'executions'}>
        <TabsList>
          {['definitions', 'executions'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              nativeButton={false}
              render={
                <Link
                  to={{
                    pathname: `../${tab}`,
                    search: (() => {
                      const params = new URLSearchParams(location.search);
                      for (const key of [
                        'kind',
                        'status',
                        'from',
                        'to',
                        'page',
                        'orderBy',
                        'direction',
                      ])
                        params.delete(key);
                      return params.toString();
                    })(),
                    hash: location.hash,
                  }}
                />
              }
            >
              {t(`processManagement.${tab}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className='text-sm text-muted-foreground'>
        {t('processManagement.safeHistory')}
      </p>
      <ApplicationToolbar>
        <ApplicationSearch
          {...search.inputProps}
          placeholder={t(
            definitions
              ? 'processManagement.definitionSearch'
              : 'processManagement.search',
          )}
        />
        {!definitions && (
          <>
            <Select
              value={query.kind ?? 'all'}
              onValueChange={(value) => filter('kind', value ?? 'all')}
            >
              <SelectTrigger
                aria-label={t('processManagement.name')}
                className='w-full sm:w-48'
              >
                <SelectValue>
                  {query.kind
                    ? text.name(query.kind)
                    : t('processManagement.all')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                <SelectGroup>
                  <SelectItem value='all'>
                    {t('processManagement.all')}
                  </SelectItem>
                  {(
                    resource.data?.meta.kinds ??
                    available.data?.data.map((row) => row.kind)
                  )?.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {text.name(kind)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Select
              value={query.status ?? 'all'}
              onValueChange={(value) => filter('status', value ?? 'all')}
            >
              <SelectTrigger
                aria-label={t('processManagement.status')}
                className='w-full sm:w-40'
              >
                <SelectValue>
                  {query.status
                    ? text.state(query.status)
                    : t('processManagement.all')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                <SelectGroup>
                  <SelectItem value='all'>
                    {t('processManagement.all')}
                  </SelectItem>
                  {(resource.data?.meta.statuses ?? []).map((status) => (
                    <SelectItem key={status} value={status}>
                      {text.state(status)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <ProcessDateRange
              timeZone={resource.data?.meta.timeZone}
              from={query.from}
              to={query.to}
              onChange={(from, to) =>
                search.updateParams((p) => {
                  if (from) p.set('from', from);
                  else p.delete('from');
                  if (to) p.set('to', to);
                  else p.delete('to');
                  p.delete('page');
                })
              }
            />
          </>
        )}
        {filtered && (
          <Button variant='ghost' onClick={clear}>
            {t('processManagement.clear')}
          </Button>
        )}
      </ApplicationToolbar>
      {Boolean(resource.error) && (
        <Failure error={resource.error} retry={resource.reload} />
      )}
      {!resource.data && resource.loading ? (
        <ApplicationTableSkeleton />
      ) : (
        resource.data && (
          <DataTableServer
            columns={columns}
            rows={resource.data.data}
            total={resource.data.meta.total}
            getRowId={(row) =>
              'id' in row ? `${row.kind}:${row.id}` : row.kind
            }
            pagination={{ pageIndex: page - 1, pageSize }}
            pageSizeOptions={[20, 50, 100]}
            onPaginationChange={(p) =>
              search.updateParams((q) => {
                q.set('page', String(p.pageIndex + 1));
                q.set('pageSize', String(p.pageSize));
              })
            }
            sorting={
              definitions
                ? [
                    {
                      id: 'name',
                      desc:
                        query.orderBy === 'name' && query.direction === 'desc',
                    },
                  ]
                : [
                    {
                      id: query.orderBy ?? 'createdAt',
                      desc: query.direction !== 'asc',
                    },
                  ]
            }
            onSortingChange={(sort) =>
              search.updateParams((q) => {
                q.set(
                  'orderBy',
                  definitions ? 'name' : (sort[0]?.id ?? 'createdAt'),
                );
                q.set('direction', sort[0]?.desc ? 'desc' : 'asc');
                q.delete('page');
              })
            }
            emptyMessage={
              <EmptyList
                filtered={filtered}
                definitions={definitions}
                onClear={clear}
              />
            }
          />
        )
      )}
      <Outlet />
    </ProcessListContext.Provider>
  );
}
