import { ApplicationTableEmpty } from '#components/application-table-empty';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { statusTone } from './status-tone.js';
import { ApplicationSearch } from '#components/application-search';
import { UserName } from '#components/user-name';
import { Link, Outlet, useLocation } from 'react-router';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Plus } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { DataTableServer, DataTableColumnHeader } from '#components/data-table';
import { Button } from '#components/ui/button';
import { StatusBadge } from '#components/status-badge';
import { TruncatedText } from '#components/truncated-text';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { useUrlSearch } from '#hooks/use-url-search';
import { useSealResource } from './resource.js';
import { SealError } from './states.js';
import { STATES, type SealRequest } from './types.js';
export default function SealRequests() {
  const { t, i18n } = useTranslation(),
    location = useLocation(),
    search = useUrlSearch({ resetParams: ['page'] }),
    p = search.searchParams,
    page = Math.max(1, Number(p.get('page')) || 1),
    pageSize = [10, 20, 50, 100].includes(Number(p.get('pageSize')))
      ? Number(p.get('pageSize'))
      : 20,
    status = p.get('status') ?? '',
    sort = p.get('sort') === 'copies' ? 'copies' : 'createdAt',
    direction =
      p.get('direction') === 'asc' || p.get('order') === 'asc' ? 'asc' : 'desc';
  const grant = useCan({
      resource: { type: 'composite', id: 'oa.sealRequests' },
      action: 'create',
    }),
    r = useSealResource<{ data: SealRequest[]; meta: { total: number } }>(
      'sealRequests',
      {
        page: String(page),
        pageSize: String(pageSize),
        search: search.search,
        status,
        sort,
        direction,
      },
    );
  const rows = r.data?.data ?? [];
  const columns: ColumnDef<SealRequest, unknown>[] = [
    {
      id: 'number',
      header: t('seals.number'),
      cell: ({ row }) => (
        <Link
          to={{
            pathname: row.original.id,
            search: location.search,
            hash: location.hash,
          }}
          className='font-medium hover:underline'
        >
          <TruncatedText text={row.original.number ?? t('seals.draft')} />
        </Link>
      ),
    },
    {
      id: 'purpose',
      header: t('seals.purpose'),
      cell: ({ row }) => <TruncatedText text={row.original.purpose} />,
    },
    {
      id: 'applicant',
      header: t('seals.applicant'),
      cell: ({ row }) => <UserName name={row.original.applicant.name} />,
    },
    {
      id: 'sealType',
      header: t('seals.sealType'),
      cell: ({ row }) => t(`seals.types.${row.original.sealType}`),
    },
    {
      id: 'copies',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('seals.copies')}
          className='justify-end'
        />
      ),
      cell: ({ row }) => (
        <span className='block text-right tabular-nums'>
          {row.original.copies.toLocaleString(i18n.language)}
        </span>
      ),
    },
    {
      id: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('approvals.createdAt')}
        />
      ),
      cell: ({ row }) =>
        Number.isFinite(Date.parse(row.original.createdAt))
          ? new Intl.DateTimeFormat(i18n.language, {
              dateStyle: 'medium',
            }).format(new Date(row.original.createdAt))
          : '—',
    },
    {
      id: 'status',
      header: t('seals.status'),
      cell: ({ row }) => (
        <StatusBadge tone={statusTone(row.original.status)}>
          {t(`seals.states.${row.original.status}`)}
        </StatusBadge>
      ),
    },
  ];
  return (
    <PageContainer>
      <PageHeader
        title={t('seals.title')}
        description={t('seals.description')}
      />
      <ApplicationToolbar
        actions={
          <>
            <ApplicationRefreshButton
              label={t('seals.refresh')}
              loading={r.loading}
              onClick={r.reload}
            />
            {grant.can && !grant.isPending && !grant.error ? (
              <Button
                nativeButton={false}
                render={
                  <Link
                    to={{
                      pathname: 'new',
                      search: location.search,
                      hash: location.hash,
                    }}
                  />
                }
              >
                <Plus />
                {t('seals.new')}
              </Button>
            ) : null}
          </>
        }
      >
        <ApplicationSearch
          {...search.inputProps}
          aria-label={t('seals.search')}
          placeholder={t('seals.search')}
          className='sm:w-64'
        />
        <Select
          value={status || 'all'}
          onValueChange={(v) =>
            search.updateParams((p) => {
              if (v && v !== 'all') p.set('status', v);
              else p.delete('status');
              p.delete('page');
            })
          }
        >
          <SelectTrigger aria-label={t('seals.status')}>
            <SelectValue>
              {status ? t(`seals.states.${status}`) : t('seals.all')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            <SelectGroup>
              <SelectItem value='all'>{t('seals.all')}</SelectItem>
              {STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {t(`seals.states.${s}`)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {status || search.search ? (
          <Button
            variant='outline'
            onClick={() =>
              search.clear((p) => {
                p.delete('status');
                p.delete('page');
              })
            }
          >
            {t('seals.clear')}
          </Button>
        ) : null}
      </ApplicationToolbar>
      {r.error ? <SealError error={r.error} retry={r.reload} /> : null}
      {r.loading && !r.data ? <ApplicationTableSkeleton /> : null}
      {r.data ? (
        <DataTableServer
          sorting={[{ id: sort, desc: direction === 'desc' }]}
          onSortingChange={(sorting) =>
            search.updateParams((params) => {
              params.set(
                'sort',
                sorting[0]?.id === 'copies' ? 'copies' : 'createdAt',
              );
              params.set(
                'direction',
                sorting[0]?.desc === false ? 'asc' : 'desc',
              );
              params.delete('order');
              params.delete('page');
            })
          }
          columns={columns}
          rows={rows}
          total={r.data.meta?.total ?? rows.length}
          getRowId={(v) => v.id}
          pagination={{ pageIndex: page - 1, pageSize }}
          onPaginationChange={(next) =>
            search.updateParams((p) => {
              p.set('page', String(next.pageIndex + 1));
              p.set('pageSize', String(next.pageSize));
            })
          }
          pageSizeOptions={[10, 20, 50, 100]}
          emptyMessage={
            <ApplicationTableEmpty
              title={t(
                status || search.search ? 'seals.noMatch' : 'seals.empty',
              )}
              clearFilters={
                status || search.search
                  ? {
                      label: t('seals.clear'),
                      onClick: () =>
                        search.clear((params) => {
                          params.delete('status');
                          params.delete('page');
                        }),
                    }
                  : undefined
              }
            />
          }
        />
      ) : null}
      <Outlet context={{ reload: r.reload }} />
    </PageContainer>
  );
}
