import { ApplicationTableEmpty } from '#components/application-table-empty';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { Link, Outlet, useLocation, useSearchParams } from 'react-router';
import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { DataTableServer, DataTableColumnHeader } from '#components/data-table';
import { useSealResource } from './resource.js';
import { SealError } from './states.js';
import type { Ledger } from './types.js';
export default function SealLedger() {
  const { t, i18n } = useTranslation(),
    location = useLocation(),
    [params, setParams] = useSearchParams(),
    page = Math.max(1, Number(params.get('page')) || 1),
    pageSize = [10, 20, 50, 100].includes(Number(params.get('pageSize')))
      ? Number(params.get('pageSize'))
      : 20,
    sort = ['borrowedAt', 'sealedAt'].includes(params.get('sort') ?? '')
      ? params.get('sort')!
      : 'registeredAt',
    direction = params.get('direction') === 'asc' ? 'asc' : 'desc',
    r = useSealResource<{
      data: Ledger[];
      meta: { total: number; timeZone: string };
    }>('sealLedger', {
      page: String(page),
      pageSize: String(pageSize),
      sort,
      direction,
    });
  const cols: ColumnDef<Ledger, unknown>[] = [
    {
      accessorKey: 'id',
      header: t('seals.number'),
      cell: ({ row }) => (
        <Link
          className='font-medium underline-offset-4 hover:underline'
          to={{
            pathname: row.original.id,
            search: location.search,
            hash: location.hash,
          }}
        >
          {row.original.requestNumber ?? t('seals.draft')}
        </Link>
      ),
    },
    {
      accessorKey: 'sealId',
      header: t('seals.sealId'),
      cell: ({ row }) => row.original.sealName ?? t('seals.unavailable'),
    },
    {
      id: 'applicant',
      header: t('seals.applicant'),
      cell: ({ row }) => <UserName name={row.original.applicant.name} />,
    },
    {
      id: 'approvedCopies',
      header: t('seals.copies'),
      cell: ({ row }) => (
        <span className='block text-right tabular-nums'>
          {row.original.approvedCopies.toLocaleString(i18n.language)}
        </span>
      ),
    },
    {
      id: 'actualCopies',
      header: t('seals.actualCopies'),
      cell: ({ row }) => (
        <span className='block text-right tabular-nums'>
          {row.original.actualCopies?.toLocaleString(i18n.language) ?? '—'}
        </span>
      ),
    },
    {
      id: 'borrowedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('seals.borrowedAt')} />
      ),
      cell: ({ row }) =>
        row.original.borrowedAt
          ? new Date(row.original.borrowedAt).toLocaleString(i18n.language, {
              timeZone: r.data?.meta.timeZone,
            })
          : '—',
    },
    {
      id: 'sealedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('seals.sealedAt')} />
      ),
      cell: ({ row }) =>
        row.original.sealedAt
          ? new Date(row.original.sealedAt).toLocaleString(i18n.language, {
              timeZone: r.data?.meta.timeZone,
            })
          : '—',
    },
    {
      id: 'registeredAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('approvals.createdAt')}
        />
      ),
      cell: ({ row }) =>
        Number.isFinite(Date.parse(row.original.registeredAt))
          ? new Date(row.original.registeredAt).toLocaleString(i18n.language, {
              timeZone: r.data?.meta.timeZone,
            })
          : '—',
    },
    {
      id: 'registeredBy',
      header: t('seals.registeredBy'),
      cell: ({ row }) => <UserName name={row.original.registeredBy.name} />,
    },
  ];
  return (
    <PageContainer>
      <PageHeader
        title={t('seals.ledger')}
        description={t('seals.physicalNotice')}
      />
      <ApplicationToolbar
        actions={
          <ApplicationRefreshButton
            label={t('seals.refresh')}
            loading={r.loading}
            onClick={r.reload}
          />
        }
      />
      {r.error ? <SealError error={r.error} retry={r.reload} /> : null}
      {r.loading && !r.data ? <ApplicationTableSkeleton /> : null}
      {r.data ? (
        <DataTableServer
          sorting={[{ id: sort, desc: direction === 'desc' }]}
          onSortingChange={(sorting) =>
            setParams(
              (params) => {
                params.set('sort', sorting[0]?.id ?? 'registeredAt');
                params.set(
                  'direction',
                  sorting[0]?.desc === false ? 'asc' : 'desc',
                );
                params.delete('page');
                return params;
              },
              { replace: true },
            )
          }
          columns={cols}
          rows={r.data.data}
          total={r.data.meta.total}
          getRowId={(row) => row.id}
          pagination={{ pageIndex: page - 1, pageSize }}
          onPaginationChange={(next) => {
            const p = new URLSearchParams(params);
            p.set('page', String(next.pageIndex + 1));
            p.set('pageSize', String(next.pageSize));
            setParams(p);
          }}
          pageSizeOptions={[10, 20, 50, 100]}
          emptyMessage={
            <ApplicationTableEmpty title={t('seals.emptyLedger')} />
          }
        />
      ) : null}
      <Outlet context={{ reload: r.reload }} />
    </PageContainer>
  );
}
