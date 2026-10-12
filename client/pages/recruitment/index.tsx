import { ApplicationSearch } from '#components/application-search';
import { UserName } from '#components/user-name';
import { Link, Outlet, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { DataTableServer, DataTableColumnHeader } from '#components/data-table';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { useUrlSearch } from '#hooks/use-url-search';
import { TruncatedText } from '../platform/shared/truncated-text.js';
import { useRecruitmentResource } from './resource.js';
import { Choice, ErrorState, Refresh } from './shared.js';
import type { ListRow } from './types.js';
const statuses = [
  'draft',
  'revision',
  'head',
  'hrbp',
  'hrDirector',
  'executive',
  'gm',
  'approved',
  'rejected',
  'withdrawn',
  'terminated',
];
export default function RecruitmentList() {
  const { t, i18n } = useTranslation(),
    location = useLocation(),
    search = useUrlSearch({ param: 'q', resetParams: ['page'] }),
    grant = useCan({
      resource: { type: 'composite', id: 'oa.recruitment' },
      action: 'submit',
    });
  const page = Math.max(1, Number(search.searchParams.get('page')) || 1),
    pageSize = [10, 20, 50, 100].includes(
      Number(search.searchParams.get('pageSize')),
    )
      ? Number(search.searchParams.get('pageSize'))
      : 20,
    status = statuses.includes(search.searchParams.get('status') ?? '')
      ? search.searchParams.get('status')!
      : '',
    orderBy =
      search.searchParams.get('orderBy') === 'statusChangedAt'
        ? 'statusChangedAt'
        : 'createdAt',
    desc = search.searchParams.get('desc') !== 'false';
  const r = useRecruitmentResource<{
    data: ListRow[];
    meta: { total: number };
  }>('recruitmentRequests', {
    page: String(page),
    pageSize: String(pageSize),
    q: search.search,
    status,
    orderBy,
    desc: String(desc),
  });
  const columns: ColumnDef<ListRow>[] = [
    {
      id: 'position',
      header: t('recruitment.fields.positionId'),
      cell: ({ row }) => (
        <Link
          className='underline'
          to={{
            pathname: row.original.id,
            search: location.search,
            hash: location.hash,
          }}
        >
          <TruncatedText
            text={
              row.original.identities.position?.name ?? row.original.positionId
            }
          />
        </Link>
      ),
    },
    {
      id: 'department',
      header: t('recruitment.fields.departmentId'),
      cell: ({ row }) => row.original.identities.department?.name ?? '—',
    },
    {
      id: 'grade',
      header: t('recruitment.fields.gradeId'),
      cell: ({ row }) => row.original.identities.grade?.name ?? '—',
    },
    {
      id: 'quantity',
      enableSorting: false,
      header: () => (
        <div className='text-right'>{t('recruitment.fields.quantity')}</div>
      ),
      cell: ({ row }) => (
        <div className='text-right tabular-nums'>
          {new Intl.NumberFormat(i18n.language).format(row.original.quantity)}
        </div>
      ),
    },
    {
      id: 'applicant',
      header: t('recruitment.fields.applicant'),
      cell: ({ row }) => (
        <UserName name={row.original.applicant?.name ?? '—'} />
      ),
    },
    {
      id: 'status',
      header: t('recruitment.fields.status'),
      cell: ({ row }) => (
        <Badge variant='outline'>
          {t(`recruitment.status.${row.original.status}`)}
        </Badge>
      ),
    },
    ...(['createdAt', 'statusChangedAt'] as const).map(
      (key): ColumnDef<ListRow> => ({
        accessorKey: key,
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={t(`recruitment.fields.${key}`)}
          />
        ),
        cell: ({ row }) =>
          new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(new Date(row.original[key])),
      }),
    ),
  ];
  return (
    <PageContainer>
      <PageHeader title={t('recruitment.title')} />
      <ApplicationToolbar
        actions={
          <>
            <Refresh busy={r.loading} onClick={r.reload} />
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
                <Plus data-icon='inline-start' />
                {t('recruitment.new')}
              </Button>
            ) : null}
          </>
        }
      >
        <ApplicationSearch
          className='w-full sm:w-64'
          aria-label={t('recruitment.search')}
          placeholder={t('recruitment.search')}
          {...search.inputProps}
        />
        <div className='w-full sm:w-44'>
          <Choice
            label={t('recruitment.fields.status')}
            value={status || 'all'}
            items={[
              { value: 'all', label: t('recruitment.all') },
              ...statuses.map((value) => ({
                value,
                label: t(`recruitment.status.${value}`),
              })),
            ]}
            onChange={(value) =>
              search.updateParams((p) => {
                if (value === 'all') p.delete('status');
                else p.set('status', value);
                p.delete('page');
              })
            }
          />
        </div>
        {search.text || status ? (
          <Button
            variant='outline'
            onClick={() => search.clear((p) => p.delete('status'))}
          >
            {t('recruitment.clear')}
          </Button>
        ) : null}
      </ApplicationToolbar>
      {r.error ? (
        <ErrorState error={r.error} retry={r.reload} />
      ) : r.loading ? (
        <ApplicationTableSkeleton columns={columns.length} />
      ) : r.data ? (
        <DataTableServer
          pageSizeOptions={[10, 20, 50, 100]}
          rows={r.data.data}
          columns={columns}
          getRowId={(row) => row.id}
          total={r.data.meta.total}
          emptyMessage={t(
            search.search || status
              ? 'recruitment.filteredEmpty'
              : 'recruitment.empty',
          )}
          pagination={{ pageIndex: page - 1, pageSize }}
          sorting={[{ id: orderBy, desc }]}
          onPaginationChange={(v) =>
            search.updateParams((p) => {
              p.set('page', String(v.pageIndex + 1));
              p.set('pageSize', String(v.pageSize));
            })
          }
          onSortingChange={(v) =>
            search.updateParams((p) => {
              if (v[0]) {
                p.set('orderBy', v[0].id);
                p.set('desc', String(v[0].desc));
              }
              p.delete('page');
            })
          }
        />
      ) : null}
      <Outlet context={{ reload: r.reload }} />
    </PageContainer>
  );
}
