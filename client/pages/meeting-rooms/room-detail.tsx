import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { useState } from 'react';
import { format, addDays } from 'date-fns';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { Pencil, Plus } from 'lucide-react';
import { RecordDetailDrawer } from '#components/record-detail-drawer';

import { DatePicker } from '#components/date-picker';
import { zonedDateTime, parts } from '#components/date-time-picker-zone';
import { Button } from '#components/ui/button';
import { Label } from '#components/ui/label';
import { DataTable } from '#components/data-table';
import { useMeetingResource } from './resource.js';
import { Loading, MeetingError } from './states.js';
import { dateLabel, type Room, type Context, type Options } from './types.js';
export default function RoomDetail() {
  const { roomId } = useParams(),
    { t, i18n } = useTranslation(),
    location = useLocation(),
    parent = useOutletContext<Context>();
  const r = useMeetingResource<{ data: Room }>(
      `meetingRooms/${encodeURIComponent(roomId!)}`,
    ),
    a = useMeetingResource<{ data: { actions: string[] } }>(
      `meetingRooms/${encodeURIComponent(roomId!)}/actions`,
    ),
    o = useMeetingResource<{ data: Options }>('meetingBookings/options');
  const [today, setToday] = useState(() => new Date().toISOString());
  const zone = o.data?.data.companyTimeZone,
    [selected, setSelected] = useState<Date>();
  const current = zone ? parts(today, zone).date : '',
    day = selected ? format(selected, 'yyyy-MM-dd') : current;
  const start = zone && day ? zonedDateTime(day, '00:00', zone) : undefined,
    end =
      zone && day
        ? zonedDateTime(
            format(addDays(new Date(`${day}T12:00:00`), 1), 'yyyy-MM-dd'),
            '00:00',
            zone,
          )
        : undefined;
  const busy = useMeetingResource<{
    data: { busy: { startAt: string; endAt: string }[] };
  }>(
    start && end
      ? `meetingRooms/${encodeURIComponent(roomId!)}/availability`
      : null,
    start && end ? { startAt: start, endAt: end } : undefined,
  );
  const refresh = () => {
      setToday(new Date().toISOString());
      r.reload();
      a.reload();
      o.reload();
      busy.reload();
    },
    saved = () => {
      refresh();
      parent.onSaved();
    };
  const row = r.data?.data,
    edit = !a.loading && !a.error && a.data?.data.actions.includes('edit');
  const link = (path: string) => ({
    pathname: path,
    search: location.search,
    hash: location.hash,
  });
  return (
    <RecordDetailDrawer
      title={row?.name ?? t('meetingRooms.roomDetail')}
      footer={
        <>
          {o.data?.data.canCreate ? (
            <Button nativeButton={false} render={<Link to={link('reserve')} />}>
              <Plus data-icon='inline-start' />
              {t('meetingRooms.reserve')}
            </Button>
          ) : null}
          {edit ? (
            <Button
              nativeButton={false}
              variant='outline'
              render={<Link to={link('edit')} />}
            >
              <Pencil data-icon='inline-start' />
              {t('meetingRooms.actions.edit')}
            </Button>
          ) : null}
          <ApplicationRefreshButton
            label={t('meetingRooms.refresh')}
            loading={r.loading || a.loading || busy.loading}
            onClick={refresh}
          />
        </>
      }
      closeTo={link('..')}
    >
      <div className='space-y-6'>
        {r.error ? <MeetingError error={r.error} retry={refresh} /> : null}
        {a.error ? <MeetingError error={a.error} retry={refresh} /> : null}
        {o.error ? <MeetingError error={o.error} retry={refresh} /> : null}
        {!row ? (
          r.loading ? (
            <Loading />
          ) : null
        ) : (
          <dl className='grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4'>
            {[
              ['location', row.location],
              ['facilities', row.facilities],
              [
                'capacity',
                new Intl.NumberFormat(i18n.language).format(row.capacity),
              ],
              [
                'active',
                t(`meetingRooms.status.${row.active ? 'active' : 'inactive'}`),
              ],
              [
                'requiresAdminConfirmation',
                t(`meetingRooms.boolean.${row.requiresAdminConfirmation}`),
              ],
            ].map(([key, value]) => (
              <div key={key} className='contents'>
                <dt className='text-sm text-muted-foreground'>
                  {t(`meetingRooms.fields.${key}`)}
                </dt>
                <dd className='min-w-0 whitespace-pre-wrap break-words text-sm'>
                  {value || '—'}
                </dd>
              </div>
            ))}
          </dl>
        )}
        <div className='flex flex-col gap-2'>
          <Label htmlFor='availability-date'>
            {t('meetingRooms.availability.date')}
          </Label>
          <DatePicker
            id='availability-date'
            value={selected ?? (day ? new Date(`${day}T12:00:00`) : undefined)}
            onChange={setSelected}
            className='w-full sm:w-60'
          />
          <p className='text-sm text-muted-foreground'>
            {t('meetingRooms.availability.busyOnly')} {zone ? `(${zone})` : ''}
          </p>
        </div>
        {busy.error ? (
          <MeetingError error={busy.error} retry={busy.reload} />
        ) : null}
        {!busy.data ? (
          busy.loading ? (
            <Loading />
          ) : null
        ) : (
          <DataTable
            data={busy.data.data.busy}
            columns={(['startAt', 'endAt'] as const).map((key) => ({
              accessorKey: key,
              header: t(`meetingRooms.fields.${key}`),
              enableSorting: false,
              cell: ({
                row,
              }: {
                row: { original: { startAt: string; endAt: string } };
              }) => dateLabel(row.original[key], i18n.language, zone!),
            }))}
            pagination={false}
            emptyMessage={t('meetingRooms.availability.free')}
          />
        )}
        <Outlet
          context={{ ...parent, options: o.data?.data, onSaved: saved }}
        />
      </div>
    </RecordDetailDrawer>
  );
}
