import { ApplicationTableEmpty } from '#components/application-table-empty';
import { Link, Outlet, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { StatusBadge } from '#components/status-badge';
import { statusTone } from './status-tone.js';
import { useRecruitmentResource } from './resource.js';
import { Refresh, ErrorState } from './shared.js';
import type { Requisition } from './types.js';
export default function Requisitions() {
  const { t, i18n } = useTranslation(),
    location = useLocation(),
    r = useRecruitmentResource<{ data: Requisition[] }>('requisitions'),
    departments = useRecruitmentResource<{
      data: { id: string; title: string }[];
    }>('departments/options', { includeInactive: 'true' }),
    positions = useRecruitmentResource<{
      data: { id: string; title: string }[];
    }>('positions/options', { includeInactive: 'true' });
  const departmentNames = new Map(
    departments.data?.data.map((item) => [String(item.id), item.title]),
  );
  const positionNames = new Map(
    positions.data?.data.map((item) => [String(item.id), item.title]),
  );
  const departmentName = (row: Requisition) =>
    departmentNames.get(String(row.departmentId)) ??
    t('recruitment.identityUnavailable');
  const positionName = (row: Requisition) =>
    positionNames.get(String(row.positionId)) ??
    t('recruitment.identityUnavailable');
  const loading = r.loading || departments.loading || positions.loading;
  const error = r.error ?? departments.error ?? positions.error;
  const reload = () => {
    r.reload();
    departments.reload();
    positions.reload();
  };
  const columns: ColumnDef<Requisition>[] = [
    {
      id: 'title',
      header: t('recruitment.fields.requisitionTitle'),
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          className='underline'
          to={{
            pathname: row.original.id,
            search: location.search,
            hash: location.hash,
          }}
        >
          {t('recruitment.requisitionName', {
            year: String(row.original.sourceYear),
            department: departmentName(row.original),
            position: positionName(row.original),
          })}
        </Link>
      ),
    },
    {
      id: 'department',
      header: t('recruitment.fields.departmentId'),
      enableSorting: false,
      cell: ({ row }) => departmentName(row.original),
    },
    {
      id: 'position',
      header: t('recruitment.fields.positionId'),
      enableSorting: false,
      cell: ({ row }) => positionName(row.original),
    },
    ...(
      ['sourceYear', 'originalQuantity', 'remaining', 'consumed'] as const
    ).map((key): ColumnDef<Requisition> => ({
      accessorKey: key,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t(`recruitment.fields.${key}`)}
          className='justify-end text-right'
        />
      ),
      enableSorting: true,
      cell: ({ row }) =>
        typeof row.original[key] === 'number' ? (
          <div className='text-right tabular-nums'>
            {key === 'sourceYear'
              ? String(row.original[key])
              : new Intl.NumberFormat(i18n.language).format(row.original[key])}
          </div>
        ) : (
          String(row.original[key])
        ),
    })),
    {
      accessorKey: 'status',
      header: t('recruitment.fields.status'),
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge tone={statusTone(row.original.status)}>
          {t(`recruitment.status.${row.original.status}`)}
        </StatusBadge>
      ),
    },
  ];
  return (
    <PageContainer>
      <PageHeader title={t('recruitment.requisitions')} />
      <ApplicationToolbar
        actions={<Refresh busy={loading} onClick={reload} />}
      />
      {error ? (
        <ErrorState error={error} retry={reload} />
      ) : loading ? (
        <ApplicationTableSkeleton columns={columns.length} />
      ) : r.data ? (
        <DataTable
          columns={columns}
          data={r.data.data}
          getRowId={(row) => row.id}
          emptyMessage={
            <ApplicationTableEmpty title={t('recruitment.emptyRequisitions')} />
          }
        />
      ) : null}
      <Outlet context={{ reload }} />
    </PageContainer>
  );
}
