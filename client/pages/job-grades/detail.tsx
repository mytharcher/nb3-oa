import { UserName } from '#components/user-name';
import { useEffect, useMemo } from 'react';
import {
  ApiClientError,
  usePageBreadcrumb,
  useToaster,
} from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable, DataTableColumnHeader } from '#components/data-table';
import { RecordDetailDrawer } from '#components/record-detail-drawer';

import { TruncatedText } from '../platform/shared/truncated-text.js';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Failure, Loading } from './states.js';
import { useResource } from './resource.js';
import {
  resource,
  date,
  money,
  type Band,
  type Revision,
  type SourceContext,
} from './types.js';
export default function SalaryGradeDetail() {
  const { revisionId = '' } = useParams(),
    { t, i18n } = useTranslation(),
    source = useOutletContext<SourceContext>(),
    navigate = useNavigate(),
    toaster = useToaster();
  const permission = useCan({ resource, action: 'viewSalary' });
  const allowed = permission.can && !permission.isPending && !permission.error;
  const r = useResource<{ data: Revision }>(
    allowed ? `salaryGradeTables/${encodeURIComponent(revisionId)}` : null,
  );
  usePageBreadcrumb([
    {
      label: t('jobGrades.title'),
      to: { pathname: source.source, search: source.search },
    },
    {
      label: r.data
        ? t('jobGrades.version', { version: r.data.data.version })
        : t('jobGrades.view'),
    },
  ]);
  const {
    reload,
    source: sourcePath,
    search: sourceSearch,
    focusList,
  } = source;
  useEffect(() => {
    if (!(r.error instanceof ApiClientError) || r.error.status !== 404) return;
    reload();
    toaster.show({ title: t('jobGrades.notFound'), type: 'error' });
    void navigate(
      { pathname: sourcePath, search: sourceSearch },
      { replace: true },
    );
    focusList();
  }, [
    r.error,
    reload,
    sourcePath,
    sourceSearch,
    focusList,
    toaster,
    t,
    navigate,
  ]);
  const columns = useMemo<ColumnDef<Band>[]>(
    () => [
      {
        accessorKey: 'gradeTitle',
        header: t('jobGrades.gradeTitle'),
        cell: ({ row }) => <TruncatedText text={row.original.gradeTitle} />,
      },
      { accessorKey: 'gradeCode', header: t('jobGrades.gradeCode') },
      ...(['rank', 'minimumCents', 'maximumCents'] as const).map((key) => ({
        accessorKey: key,
        header: ({
          column,
        }: {
          column: import('@tanstack/react-table').Column<Band, unknown>;
        }) => (
          <DataTableColumnHeader
            column={column}
            className='justify-end'
            title={t(
              `jobGrades.${key === 'minimumCents' ? 'minimum' : key === 'maximumCents' ? 'maximum' : 'rank'}`,
            )}
          />
        ),
        cell: ({ row }: { row: { original: Band } }) => (
          <span className='block text-right tabular-nums'>
            {key === 'rank'
              ? new Intl.NumberFormat(i18n.language).format(row.original.rank)
              : money(row.original[key], i18n.language)}
          </span>
        ),
      })),
    ],
    [t, i18n.language],
  );
  return (
    <RecordDetailDrawer
      title={
        r.data
          ? t('jobGrades.version', { version: r.data.data.version })
          : t('jobGrades.view')
      }
      description={t('jobGrades.immutable')}
    >
      <div className='flex flex-col gap-6'>
        {permission.isPending ? (
          <Loading kind='detail' />
        ) : permission.error ? (
          <Failure error={permission.error} retry={permission.retry} />
        ) : !allowed ? (
          <Alert variant='destructive'>
            <AlertDescription>{t('jobGrades.privateDenied')}</AlertDescription>
          </Alert>
        ) : r.error ? (
          <Failure error={r.error} retry={r.reload} />
        ) : !r.data ? (
          <Loading kind='detail' />
        ) : (
          <>
            <dl className='grid gap-4 sm:grid-cols-2'>
              <div>
                <dt className='text-sm text-muted-foreground'>
                  {t('jobGrades.publisher')}
                </dt>
                <dd>
                  <UserName name={r.data.data.createdBy.name} />
                </dd>
              </div>
              <div>
                <dt className='text-sm text-muted-foreground'>
                  {t('jobGrades.publishedAt')}
                </dt>
                <dd>
                  {date(
                    r.data.data.createdAt,
                    r.data.data.timeZone,
                    i18n.language,
                  )}
                </dd>
              </div>
              <div className='sm:col-span-2'>
                <dt className='text-sm text-muted-foreground'>
                  {t('jobGrades.reason')}
                </dt>
                <dd className='whitespace-pre-wrap break-words'>
                  {r.data.data.reason}
                </dd>
              </div>
            </dl>
            <DataTable
              columns={columns}
              data={r.data.data.bands}
              getRowId={(row) => row.gradeId}
              showSelectedCount={false}
            />
          </>
        )}
      </div>
    </RecordDetailDrawer>
  );
}
