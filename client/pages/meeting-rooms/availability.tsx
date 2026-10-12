import { format, addDays } from 'date-fns';
import { useTranslation } from '@nocobase/i18n/client';
import { Alert, AlertDescription } from '#components/ui/alert';
import { DataTable } from '#components/data-table';
import { zonedDateTime } from '#components/date-time-picker-zone';
import { useMeetingResource } from './resource.js';
import { Loading, MeetingError } from './states.js';
import { dateLabel, type Future } from './types.js';
export function Availability({
  roomId,
  date,
  zone,
}: {
  roomId: string;
  date: string;
  zone: string;
}) {
  const { t, i18n } = useTranslation();
  const start = date ? zonedDateTime(date, '00:00', zone) : undefined,
    end = date
      ? zonedDateTime(
          format(addDays(new Date(`${date}T12:00:00`), 1), 'yyyy-MM-dd'),
          '00:00',
          zone,
        )
      : undefined;
  const r = useMeetingResource<{
    data: { busy: { startAt: string; endAt: string }[] };
  }>(
    roomId && start && end
      ? `meetingRooms/${encodeURIComponent(roomId)}/availability`
      : null,
    start && end ? { startAt: start, endAt: end } : undefined,
  );
  return (
    <div className='flex flex-col gap-2'>
      <p className='text-sm text-muted-foreground'>
        {t('meetingRooms.availability.busyOnly')}
      </p>
      {date && (!start || !end) ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('meetingRooms.errors.INVALID_INTERVAL')}
          </AlertDescription>
        </Alert>
      ) : null}
      {r.error ? <MeetingError error={r.error} retry={r.reload} /> : null}
      {r.loading ? (
        <Loading />
      ) : r.data ? (
        <DataTable
          data={r.data.data.busy}
          columns={(['startAt', 'endAt'] as const).map((key) => ({
            accessorKey: key,
            enableSorting: false,
            enableHiding: false,
            header: t(`meetingRooms.fields.${key}`),
            cell: ({
              row,
            }: {
              row: { original: { startAt: string; endAt: string } };
            }) => dateLabel(row.original[key], i18n.language, zone),
          }))}
          pagination={false}
          emptyMessage={t('meetingRooms.availability.free')}
        />
      ) : null}
    </div>
  );
}
export function FutureList({ future, zone }: { future: Future; zone: string }) {
  const { t, i18n } = useTranslation();
  return (
    <DataTable
      data={future.items}
      columns={[
        {
          accessorKey: 'startAt',
          header: t('meetingRooms.fields.startAt'),
          enableSorting: false,
          enableHiding: false,
          cell: ({ row }) =>
            dateLabel(row.original.startAt, i18n.language, zone),
        },
        {
          accessorKey: 'status',
          header: t('meetingRooms.fields.status'),
          enableSorting: false,
          enableHiding: false,
          cell: ({ row }) => t(`meetingRooms.status.${row.original.status}`),
        },
      ]}
      pagination={false}
      emptyMessage={t('meetingRooms.empty.filtered')}
    />
  );
}
