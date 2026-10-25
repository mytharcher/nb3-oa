import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableServer } from '#components/data-table';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { useScheduleResource } from '../personal-schedules/resource.js';
type Row = { id: string } & Record<string, string | number | null>;
type Result = {
  data: Row[];
  meta: { page: number; pageSize: number; total: number };
};
const fields = {
  'supply-ledger': [
    'number',
    'itemCode',
    'requestedQuantity',
    'actualQuantity',
    'recipient',
    'operator',
    'recordedAt',
  ],
  'seal-ledger': [
    'number',
    'sealName',
    'approvedCopies',
    'actualCopies',
    'applicant',
    'operator',
    'recordedAt',
    'sealedAt',
  ],
} as const;
export function AdministrativeReport({
  dataset,
}: {
  dataset: keyof typeof fields;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1),
    size = [10, 20, 50, 100].includes(Number(params.get('pageSize')))
      ? Number(params.get('pageSize'))
      : 20;
  const r = useScheduleResource<Result>(`reports/${dataset}`, {
    page: String(page),
    pageSize: String(size),
  });
  const [exporting, setExporting] = useState(false),
    [failed, setFailed] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const columns = useMemo<ColumnDef<Row>[]>(
    () =>
      fields[dataset].map((key) => ({
        accessorKey: key,
        header: t(`reports.administrativeColumns.${key}`),
        cell: ({ row }) => (
          <span className='break-words'>{row.original[key] ?? '—'}</span>
        ),
      })),
    [dataset, t],
  );
  async function download() {
    if (exporting) return;
    const active = new AbortController();
    controllerRef.current = active;
    setExporting(true);
    setFailed(false);
    try {
      const stream = await api.stream({
        path: `reports/${dataset}.xlsx`,
        signal: active.signal,
      });
      const blob = await new Response(stream).blob();
      if (active.signal.aborted) return;
      const url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = `${dataset}.xlsx`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      if (!active.signal.aborted) setFailed(true);
    } finally {
      if (!active.signal.aborted) setExporting(false);
    }
  }
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          variant='outline'
          disabled={exporting || r.loading || !!r.error || !r.data}
          onClick={() => void download()}
        >
          {t(exporting ? 'reports.exporting' : 'reports.export')}
        </Button>
        <Button variant='outline' disabled={r.loading} onClick={r.reload}>
          {t('reports.refresh')}
        </Button>
      </div>
      <p className='text-sm text-muted-foreground'>
        {t('reports.administrativeExportHint')}
      </p>
      {r.error || failed ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t(failed ? 'reports.exportFailed' : 'reports.failed')}
          </AlertDescription>
        </Alert>
      ) : null}
      {r.loading && !r.data ? (
        <ApplicationTableSkeleton columns={fields[dataset].length} />
      ) : !r.error && r.data ? (
        <DataTableServer
          columns={columns}
          rows={r.data.data}
          total={r.data.meta.total}
          getRowId={(row) => row.id}
          pagination={{ pageIndex: page - 1, pageSize: size }}
          pageSizeOptions={[10, 20, 50, 100]}
          onPaginationChange={(next) => {
            const p = new URLSearchParams(params);
            p.set('page', String(next.pageIndex + 1));
            p.set('pageSize', String(next.pageSize));
            setParams(p);
          }}
          emptyMessage={t('reports.empty')}
        />
      ) : null}
    </div>
  );
}
