import { useTranslation } from '@nocobase/i18n/client';
import { Link, useLocation } from 'react-router';
import { format } from 'date-fns';
import { useId, useEffect, useRef, useState } from 'react';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { useUrlSearch } from '#hooks/use-url-search';
import { ApplicationToolbar } from '#components/application-toolbar';
import { DatePicker } from '#components/date-picker';
import { zonedDateTime } from '#components/date-time-picker-zone';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Button } from '#components/ui/button';
import { StatusBadge } from '#components/status-badge';
import { DataTableServer } from '#components/data-table';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { useMeetingResource } from './resource';
import { MeetingError } from './states';
import { dateLabel, type Options, type Page, type Room } from './types';

type AvailableRoom = Room & { busy: { startAt: string; endAt: string }[] };
export function AvailabilitySearch({ options }: { options: Options }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const location = useLocation();
  const search = useUrlSearch({ param: 'availability-unused' });
  const p = search.searchParams;
  const date = p.get('meetingDate') ?? '';
  const start = useAvailabilityInput('meetingStart', '09:00', search);
  const end = useAvailabilityInput('meetingEnd', '10:00', search);
  const seats = useAvailabilityInput('meetingCapacity', '1', search);
  const startTime = start.committed;
  const endTime = end.committed;
  const capacity = seats.committed;
  const page = Math.max(1, Number(p.get('meetingPage')) || 1);
  const startAt = date
    ? zonedDateTime(date, startTime, options.companyTimeZone)
    : undefined;
  const endAt = date
    ? zonedDateTime(date, endTime, options.companyTimeZone)
    : undefined;
  const valid =
    !!startAt &&
    !!endAt &&
    endAt > startAt &&
    /^\d+$/.test(capacity) &&
    Number(capacity) >= 1 &&
    Number(capacity) <= 10000;
  const r = useMeetingResource<Page<AvailableRoom>>(
    valid ? 'meetingRooms/availability-search' : null,
    {
      startAt: startAt ?? '',
      endAt: endAt ?? '',
      capacity,
      page: String(page),
      pageSize: '20',
    },
  );
  const change = (key: string, value: string) =>
    search.updateParams((next) => {
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('meetingPage');
    });
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-sm text-muted-foreground'>
        {t('meetingRooms.finder.description', {
          zone: options.companyTimeZone,
        })}
      </p>
      <ApplicationToolbar
        actions={
          valid ? (
            <ApplicationRefreshButton
              label={t('meetingRooms.refresh')}
              loading={r.loading}
              onClick={r.reload}
            />
          ) : null
        }
      >
        <div className='flex flex-col gap-2'>
          <Label htmlFor={`${id}-date`}>{t('meetingRooms.finder.date')}</Label>
          <DatePicker
            id={`${id}-date`}
            value={
              date && Number.isFinite(Date.parse(`${date}T12:00:00`))
                ? new Date(`${date}T12:00:00`)
                : undefined
            }
            onChange={(value) =>
              change('meetingDate', value ? format(value, 'yyyy-MM-dd') : '')
            }
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor={`${id}-start`}>
            {t('meetingRooms.finder.start')}
          </Label>
          <Input
            id={`${id}-start`}
            type='time'
            value={start.text}
            onChange={(event) => start.setText(event.target.value)}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor={`${id}-end`}>{t('meetingRooms.finder.end')}</Label>
          <Input
            id={`${id}-end`}
            type='time'
            value={end.text}
            onChange={(event) => end.setText(event.target.value)}
          />
        </div>
        <div className='flex flex-col gap-2'>
          <Label htmlFor={`${id}-capacity`}>
            {t('meetingRooms.finder.capacity')}
          </Label>
          <Input
            id={`${id}-capacity`}
            className='sm:w-36'
            type='number'
            min={1}
            max={10000}
            value={seats.text}
            onChange={(event) => seats.setText(event.target.value)}
          />
        </div>
      </ApplicationToolbar>
      {!valid ? (
        <p className='text-sm text-muted-foreground'>
          {t(
            date
              ? 'meetingRooms.errors.INVALID_INTERVAL'
              : 'meetingRooms.finder.select',
          )}
        </p>
      ) : null}
      {r.error ? <MeetingError error={r.error} retry={r.reload} /> : null}
      {r.loading && !r.data ? <ApplicationTableSkeleton columns={5} /> : null}
      {r.data ? (
        <>
          <p className='text-sm text-muted-foreground'>
            {t('meetingRooms.finder.snapshot')}
          </p>
          <DataTableServer
            rows={r.data.data}
            total={r.data.meta.total}
            getRowId={(room) => room.id}
            pagination={{ pageIndex: page - 1, pageSize: 20 }}
            onPaginationChange={(value) =>
              search.updateParams((next) =>
                next.set('meetingPage', String(value.pageIndex + 1)),
              )
            }
            pageSizeOptions={[20]}
            columns={[
              {
                accessorKey: 'name',
                header: t('meetingRooms.fields.name'),
                enableSorting: false,
                cell: ({ row }) => (
                  <Link
                    className='font-medium hover:underline'
                    to={{
                      pathname: `room/${row.original.id}`,
                      search: location.search,
                      hash: location.hash,
                    }}
                  >
                    {row.original.name}
                  </Link>
                ),
              },
              {
                accessorKey: 'location',
                header: t('meetingRooms.fields.location'),
                enableSorting: false,
              },
              {
                accessorKey: 'capacity',
                header: t('meetingRooms.fields.capacity'),
                enableSorting: false,
                cell: ({ row }) => (
                  <span className='block text-right tabular-nums'>
                    {new Intl.NumberFormat(i18n.language).format(
                      row.original.capacity,
                    )}
                  </span>
                ),
              },
              {
                id: 'availability',
                header: t('meetingRooms.fields.status'),
                enableSorting: false,
                cell: ({ row }) => (
                  <div className='flex flex-col gap-2'>
                    <StatusBadge
                      tone={row.original.busy.length ? 'warning' : 'success'}
                    >
                      {t(
                        row.original.busy.length
                          ? 'meetingRooms.finder.busy'
                          : row.original.requiresAdminConfirmation
                            ? 'meetingRooms.finder.confirmation'
                            : 'meetingRooms.finder.free',
                      )}
                    </StatusBadge>
                    {row.original.busy.map((interval) => (
                      <span
                        key={`${interval.startAt}:${interval.endAt}`}
                        className='text-xs text-muted-foreground'
                      >
                        {dateLabel(
                          interval.startAt,
                          i18n.language,
                          options.companyTimeZone,
                        )}{' '}
                        –{' '}
                        {dateLabel(
                          interval.endAt,
                          i18n.language,
                          options.companyTimeZone,
                        )}
                      </span>
                    ))}
                  </div>
                ),
              },
              {
                id: 'actions',
                header: '',
                enableSorting: false,
                cell: ({ row }) =>
                  !row.original.busy.length && options.canCreate ? (
                    <Button
                      nativeButton={false}
                      variant='outline'
                      disabled={r.loading || !!r.error}
                      render={
                        <Link
                          to={{
                            pathname: 'reserve',
                            hash: location.hash,
                            search: (() => {
                              const next = new URLSearchParams(location.search);
                              next.set('selectedRoom', row.original.id);
                              return `?${next.toString()}`;
                            })(),
                          }}
                        />
                      }
                    >
                      {t('meetingRooms.reserve')}
                    </Button>
                  ) : null,
              },
            ]}
            emptyMessage={
              <ApplicationTableEmpty
                title={t('meetingRooms.empty.filtered')}
                clearFilters={{
                  label: t('meetingRooms.clear'),
                  onClick: () =>
                    search.updateParams((next) => {
                      [
                        'meetingDate',
                        'meetingStart',
                        'meetingEnd',
                        'meetingCapacity',
                        'meetingPage',
                      ].forEach((key) => next.delete(key));
                    }),
                }}
              />
            }
          />
        </>
      ) : null}
    </div>
  );
}

/** Keep blank edits valid as drafts; only settled values trigger a query. */
function useAvailabilityInput(
  key: string,
  fallback: string,
  search: ReturnType<typeof useUrlSearch>,
) {
  const committed = search.searchParams.get(key) ?? fallback;
  const [text, setText] = useState(committed);
  const [seen, setSeen] = useState(committed);
  const [ownValue, setOwnValue] = useState(committed);
  if (seen !== committed) {
    setSeen(committed);
    if (ownValue !== committed) {
      setOwnValue(committed);
      setText(committed);
    }
  }
  const writerRef = useRef(search.updateParams);
  useEffect(() => {
    writerRef.current = search.updateParams;
  }, [search.updateParams]);
  useEffect(() => {
    if (text === committed) return;
    const timer = window.setTimeout(() => {
      setOwnValue(text);
      writerRef.current((params) => {
        // An explicit empty parameter prevents the initial default snapping back.
        params.set(key, text);
        params.delete('meetingPage');
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [text, committed, key]);
  return { text, setText, committed };
}
