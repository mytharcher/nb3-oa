import { ApplicationTableEmpty } from '#components/application-table-empty';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationSearch } from '#components/application-search';
import { useLocation, useParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { DataTableServer } from '#components/data-table';
import { Badge } from '#components/ui/badge';
import { useUrlSearch } from '#hooks/use-url-search';
import { useAnnouncementResource } from './resource.js';
import { Failure } from './states.js';
import { OptionSelect } from './select.js';
import {
  dateLabel,
  type Detail,
  type Receipt,
  type Options,
  type Envelope,
} from './types.js';
export default function Receipts() {
  const { announcementId } = useParams(),
    { t, i18n } = useTranslation(),
    location = useLocation(),
    s = useUrlSearch({ param: 'receiptQ', resetParams: ['receiptPage'] });
  const detail = useAnnouncementResource<{ data: Detail }>(
      `announcements/${encodeURIComponent(announcementId!)}`,
    ),
    options = useAnnouncementResource<{ data: Options }>(
      'announcements/context',
    );
  const status = ['pending', 'confirmed'].includes(
      s.searchParams.get('receiptStatus') ?? '',
    )
      ? s.searchParams.get('receiptStatus')!
      : 'all',
    page = Math.max(
      1,
      Math.floor(Number(s.searchParams.get('receiptPage')) || 1),
    );
  const allowed =
    !!detail.data?.data.capabilities.actions.includes('receipts') &&
    !detail.loading &&
    !detail.error;
  const r = useAnnouncementResource<Envelope<Receipt>>(
    allowed
      ? `announcements/${encodeURIComponent(announcementId!)}/receipts`
      : null,
    { q: s.search, status, page: String(page), pageSize: '20' },
  );
  const refresh = () => {
    detail.reload();
    r.reload();
    options.reload();
  };
  const columns: ColumnDef<Receipt>[] = [
    {
      accessorKey: 'name',
      header: t('announcements.recipient'),
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: t('announcements.receiptStatus'),
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant='secondary'>
          {t(`announcements.receipt.${row.original.status}`)}
        </Badge>
      ),
    },
    {
      accessorKey: 'confirmedAt',
      header: t('announcements.confirmedAt'),
      enableSorting: false,
      cell: ({ row }) =>
        options.data
          ? dateLabel(
              row.original.confirmedAt,
              i18n.language,
              options.data.data.timeZone,
            )
          : '—',
    },
  ];
  const closeParams = new URLSearchParams(location.search);
  ['receiptQ', 'receiptStatus', 'receiptPage'].forEach((k) =>
    closeParams.delete(k),
  );
  return (
    <RecordDetailDrawer
      title={t('announcements.receipts')}
      closeTo={{
        pathname: '..',
        search: closeParams.toString(),
        hash: location.hash,
      }}
    >
      {detail.error ? <Failure error={detail.error} retry={refresh} /> : null}
      {options.error ? <Failure error={options.error} retry={refresh} /> : null}
      <p className='mb-4 text-muted-foreground'>
        {t('announcements.frozenRoster')}
      </p>
      <ApplicationToolbar
        actions={
          <ApplicationRefreshButton
            label={t('announcements.refresh')}
            loading={r.loading || detail.loading}
            onClick={refresh}
          />
        }
      >
        <ApplicationSearch
          {...s.inputProps}
          aria-label={t('announcements.searchRecipients')}
          placeholder={t('announcements.searchRecipients')}
        />
        <OptionSelect
          label={t('announcements.receiptStatus')}
          value={status}
          items={['all', 'pending', 'confirmed'].map((value) => ({
            value,
            label: t(`announcements.receipt.${value}`),
          }))}
          change={(v) =>
            s.updateParams((p) => {
              p.set('receiptStatus', v);
              p.delete('receiptPage');
            })
          }
        />
      </ApplicationToolbar>
      {r.error ? <Failure error={r.error} retry={refresh} /> : null}
      {allowed ? (
        r.data ? (
          <>
            <p className='mb-4'>
              {t('announcements.receiptCounts', {
                pending: r.data.meta.pending,
                confirmed: r.data.meta.confirmed,
              })}
            </p>
            <DataTableServer
              rows={r.data.data}
              columns={columns}
              total={r.data.meta.total}
              getRowId={(row) => row.id}
              pagination={{ pageIndex: page - 1, pageSize: 20 }}
              onPaginationChange={(v) =>
                s.updateParams((p) =>
                  p.set('receiptPage', String(v.pageIndex + 1)),
                )
              }
              pageSizeOptions={[20]}
              emptyMessage={
                <ApplicationTableEmpty
                  title={t('announcements.noRecipients')}
                />
              }
            />
          </>
        ) : r.loading ? (
          <ApplicationTableSkeleton columns={3} />
        ) : null
      ) : detail.loading ? (
        <ApplicationTableSkeleton columns={3} />
      ) : (
        <p>{t('announcements.unavailable')}</p>
      )}
    </RecordDetailDrawer>
  );
}
