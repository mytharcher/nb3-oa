import { UserName } from '#components/user-name';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { RefreshCw } from 'lucide-react';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { useMeetingResource } from './resource.js';
import { Loading, MeetingError } from './states.js';
import {
  dateLabel,
  type Booking,
  type Room,
  type Action,
  type Context,
} from './types.js';
export default function BookingDetail() {
  const { bookingId } = useParams(),
    { t, i18n } = useTranslation(),
    location = useLocation(),
    parent = useOutletContext<Context>();
  const r = useMeetingResource<{ data: Booking }>(
      `meetingBookings/${encodeURIComponent(bookingId!)}`,
    ),
    a = useMeetingResource<{ data: { actions: Action[] } }>(
      `meetingBookings/${encodeURIComponent(bookingId!)}/actions`,
    ),
    room = useMeetingResource<{ data: Room }>(
      r.data ? `meetingRooms/${encodeURIComponent(r.data.data.roomId)}` : null,
    );
  const refresh = () => {
      r.reload();
      a.reload();
      room.reload();
    },
    saved = () => {
      refresh();
      parent.onSaved();
    };
  const row = r.data?.data,
    actions =
      r.loading || r.error || !row || a.loading || a.error
        ? []
        : (a.data?.data.actions ?? []);
  const link = (path: string) => ({
    pathname: path,
    search: location.search,
    hash: location.hash,
  });
  const fields = row
    ? [
        ['title', row.title],
        ['room', room.data?.data.name ?? '—'],
        [
          'organizer',
          <UserName key={'organizer'} name={row.organizer.name} />,
        ] as const,
        ['attendees', row.attendees.map((u) => u.name).join(', ') || '—'],
        ['companyTimeZone', row.companyTimeZone],
        ['startAt', dateLabel(row.startAt, i18n.language, row.companyTimeZone)],
        ['endAt', dateLabel(row.endAt, i18n.language, row.companyTimeZone)],
        [
          'series',
          row.seriesId
            ? t('meetingRooms.series.recurring')
            : t('meetingRooms.series.once'),
        ],
        [
          'confirmedBy',
          <UserName
            key={'confirmedBy'}
            name={row.confirmedByUser?.name ?? '—'}
          />,
        ] as const,
        [
          'confirmedAt',
          dateLabel(row.confirmedAt, i18n.language, row.companyTimeZone),
        ],
        [
          'checkedInBy',
          <UserName
            key={'checkedInBy'}
            name={row.checkedInByUser?.name ?? '—'}
          />,
        ] as const,
        [
          'checkedInAt',
          dateLabel(row.checkedInAt, i18n.language, row.companyTimeZone),
        ],
        ['reason', row.reason ?? '—'],
      ]
    : [];
  return (
    <RecordDetailDrawer
      title={row?.title ?? t('meetingRooms.bookingDetail')}
      footer={
        <>
          {actions.map((action) => (
            <Button
              key={action}
              variant={
                action === 'cancel' || action === 'reject'
                  ? 'destructive'
                  : action === 'confirm' || action === 'checkIn'
                    ? 'default'
                    : 'outline'
              }
              nativeButton={false}
              render={
                <Link
                  to={link(action === 'edit' ? 'edit' : `action/${action}`)}
                />
              }
            >
              {t(`meetingRooms.actions.${action}`)}
            </Button>
          ))}
          <Button
            variant='outline'
            size='icon'
            aria-label={t('meetingRooms.refresh')}
            disabled={r.loading || a.loading}
            onClick={refresh}
          >
            <RefreshCw />
          </Button>
        </>
      }
    >
      {r.error ? <MeetingError error={r.error} retry={refresh} /> : null}
      {a.error ? <MeetingError error={a.error} retry={refresh} /> : null}
      {!row ? (
        r.loading ? (
          <Loading />
        ) : null
      ) : (
        <>
          <Badge variant='secondary'>
            {t(`meetingRooms.status.${row.status}`)}
          </Badge>
          <dl className='mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-4 gap-y-3'>
            {fields.map(([key, value]) => (
              <div key={key} className='contents'>
                <dt className='text-sm text-muted-foreground'>
                  {t(`meetingRooms.fields.${key}`)}
                </dt>
                <dd className='min-w-0 whitespace-pre-wrap break-words text-sm'>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
      <Outlet context={{ ...parent, onSaved: saved }} />
    </RecordDetailDrawer>
  );
}
