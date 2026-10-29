import { TruncatedText } from '#components/truncated-text';
import { useIsMobile } from '#hooks/use-mobile';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { Link, Outlet } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { useBusinessResource } from '#hooks/use-business-resource';
import { useUrlSearch } from '#hooks/use-url-search';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationSearch } from '#components/application-search';
import { DataTableServer, DataTableColumnHeader } from '#components/data-table';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { Failure } from '../work-items/states.js';
import { OptionSelect } from '../work-items/select.js';
export interface Item {
  id: string;
  requesterId: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  location: string;
  contact: string;
  occurredAt: string | null;
  assetId: string | null;
  assetLabel?: string | null;
  status: string;
  version: number;
  number: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  responseDueAt: string | null;
  resolutionDueAt: string | null;
  groupId: string | null;
}

export default function Repairs() {
  const mobile = useIsMobile();
  const { t, i18n } = useTranslation(),
    {
      searchParams: params,
      updateParams,
      inputProps,
      search,
      clear,
    } = useUrlSearch({ resetParams: ['page'] });
  const page = Math.max(1, Number(params.get('page')) || 1),
    status = ['draft', 'triage'].includes(params.get('status') ?? '')
      ? params.get('status')!
      : 'all',
    sort = params.get('sort') === 'createdAt' ? 'createdAt' : 'updatedAt',
    direction = params.get('direction') === 'asc' ? 'asc' : 'desc';
  const create = useCan({
    resource: { type: 'composite', id: 'oa.itRepairs' },
    action: 'create',
  });
  const r = useBusinessResource<{ data: { items: Item[]; total: number } }>(
    'itRepairs',
    {
      page: String(page),
      pageSize: '20',
      q: search,
      ...(status === 'all' ? {} : { status }),
      sort,
      direction,
    },
  );
  const add = (
    <Button render={<Link to={{ pathname: 'new', search: `?${params}` }} />}>
      {t('itRepairs.create')}
    </Button>
  );
  const filtered = !!search || status !== 'all',
    reset = () =>
      clear((p) => {
        p.delete('status');
        p.delete('page');
      });
  const columns: ColumnDef<Item>[] = [
    {
      accessorKey: 'title',
      enableSorting: false,
      header: t('itRepairs.titleField'),
      cell: ({ row }) => (
        <Link
          className='block max-w-48 truncate font-medium text-foreground hover:underline underline-offset-4'
          to={{ pathname: row.original.id, search: `?${params}` }}
        >
          <TruncatedText text={row.original.title || t('itRepairs.untitled')} />
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      enableSorting: false,
      header: t('itRepairs.status'),
      cell: ({ row }) => (
        <Badge variant='secondary'>
          {t(`itRepairs.states.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      accessorKey: 'number',
      enableSorting: false,
      header: t('itRepairs.number'),
      meta: { className: 'hidden md:table-cell' },
      cell: ({ row }) => (
        <span
          className='block max-w-40 truncate'
          title={row.original.number ?? ''}
        >
          {row.original.number ?? '—'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('itRepairs.createdAt')}
        />
      ),
      cell: ({ row }) => (
        <span>
          {new Date(row.original.createdAt).toLocaleDateString(i18n.language)}
        </span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('itRepairs.updatedAt')}
        />
      ),
      cell: ({ row }) => (
        <span>
          {new Date(row.original.updatedAt).toLocaleDateString(i18n.language)}
        </span>
      ),
    },
  ];
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('itRepairs.title')}
          description={t('itRepairs.description')}
          actions={
            <>
              {r.data && (r.data.data.total > 0 || filtered) && create.can
                ? add
                : null}
              <ApplicationRefreshButton
                label={t('workItems.refresh')}
                loading={r.loading}
                onClick={r.reload}
              />
            </>
          }
        />
        <ApplicationToolbar>
          <ApplicationSearch
            {...inputProps}
            placeholder={t('itRepairs.search')}
          />
          <OptionSelect
            ariaLabel={t('itRepairs.status')}
            value={status}
            onChange={(value) =>
              updateParams((p) => {
                if (value === 'all') p.delete('status');
                else p.set('status', value);
                p.delete('page');
              })
            }
            options={['all', 'draft', 'triage'].map((value) => ({
              value,
              label: t(
                value === 'all'
                  ? 'itRepairs.allStates'
                  : `itRepairs.states.${value}`,
              ),
            }))}
            className='w-full sm:w-40'
          />
          {filtered ? (
            <Button variant='ghost' onClick={reset}>
              {t('workItems.clear')}
            </Button>
          ) : null}
        </ApplicationToolbar>
        {r.loading && !r.data ? (
          <ApplicationTableSkeleton columns={4} />
        ) : r.error ? (
          <Failure error={r.error} module='itRepairs' retry={r.reload} />
        ) : r.data ? (
          <DataTableServer
            columns={
              mobile
                ? columns.filter(
                    (column) =>
                      !('accessorKey' in column) ||
                      !['number', 'createdAt'].includes(
                        String(column.accessorKey),
                      ),
                  )
                : columns
            }
            rows={r.data.data.items}
            total={r.data.data.total}
            getRowId={(row) => row.id}
            pageSizeOptions={[20]}
            pagination={{ pageIndex: page - 1, pageSize: 20 }}
            onPaginationChange={(p) =>
              updateParams((params) =>
                params.set('page', String(p.pageIndex + 1)),
              )
            }
            sorting={[{ id: sort, desc: direction === 'desc' }]}
            onSortingChange={(value) =>
              updateParams((p) => {
                p.set('sort', value[0]?.id ?? 'updatedAt');
                p.set('direction', value[0]?.desc ? 'desc' : 'asc');
                p.delete('page');
              })
            }
            emptyMessage={
              <ApplicationTableEmpty
                title={t(filtered ? 'itRepairs.noMatches' : 'itRepairs.empty')}
                description={
                  filtered ? undefined : t('itRepairs.emptyDescription')
                }
                clearFilters={
                  filtered
                    ? { label: t('workItems.clear'), onClick: reset }
                    : undefined
                }
                action={!filtered && create.can ? add : undefined}
              />
            }
          />
        ) : null}
      </PageContainer>
      <Outlet context={{ reload: r.reload }} />
    </>
  );
}
