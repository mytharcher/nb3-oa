import { format, isValid, parseISO } from 'date-fns';
import { CalendarDays, Plus } from 'lucide-react';
import {
  Link,
  Outlet,
  useLocation,
  useSearchParams,
  useParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DatePicker } from '#components/date-picker';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { Skeleton } from '#components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import { useScheduleResource } from './resource';
import { ScheduleError } from './states';
import {
  type Schedule,
  schedulePolicy,
  localDay,
  dayInterval,
  scheduleTime,
  scheduleZoneLabel,
} from './types';
export default function PersonalSchedules() {
  const { t, i18n } = useTranslation(),
    [params, setParams] = useSearchParams(),
    location = useLocation();
  const requested = params.get('day') ?? '',
    day =
      /^\d{4}-\d{2}-\d{2}$/.test(requested) && isValid(parseISO(requested))
        ? requested
        : localDay();
  const r = useScheduleResource<{ data: Schedule[] }>(
    'personalSchedules',
    dayInterval(day),
  );
  const { scheduleId } = useParams();
  const can = useCan(schedulePolicy('create'));
  const create =
    can.can && !can.isPending && !can.error ? (
      <Button
        nativeButton={false}
        render={
          <Link
            to={{
              pathname: '/personal-schedules/new',
              search: location.search,
            }}
          />
        }
      >
        <Plus />
        {t('personalSchedules.create')}
      </Button>
    ) : null;
  const rows = r.data?.data;
  if (scheduleId) return <Outlet context={{ reload: r.reload }} />;
  return (
    <PageContainer>
      <PageHeader
        title={t('personalSchedules.title')}
        description={t('personalSchedules.timeZone', {
          zone: scheduleZoneLabel(i18n.language),
        })}
        actions={
          <>
            {rows?.length ? create : null}
            <ApplicationRefreshButton
              label={t('personalSchedules.refresh')}
              loading={r.loading}
              onClick={r.reload}
            />
          </>
        }
      />
      <div className='flex flex-wrap items-center gap-2'>
        <label htmlFor='schedule-day'>{t('personalSchedules.day')}</label>
        <DatePicker
          id='schedule-day'
          value={parseISO(day)}
          onChange={(value) => {
            const next = new URLSearchParams(params);
            next.set('day', value ? format(value, 'yyyy-MM-dd') : localDay());
            setParams(next);
          }}
        />
        <Button
          variant='outline'
          onClick={() => {
            const next = new URLSearchParams(params);
            next.set('day', localDay());
            setParams(next);
          }}
        >
          {t('personalSchedules.today')}
        </Button>
      </div>
      {r.error ? <ScheduleError error={r.error} retry={r.reload} /> : null}
      {r.loading && !rows ? (
        <div aria-label={t('personalSchedules.loading')} className='space-y-3'>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className='h-20 w-full' />
          ))}
        </div>
      ) : null}
      {rows?.length === 0 ? (
        <Empty className='min-h-48 border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>{t('personalSchedules.empty')}</EmptyTitle>
            <EmptyDescription>
              {t('personalSchedules.emptyHint')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>{create}</EmptyContent>
        </Empty>
      ) : null}
      {rows?.length ? (
        <ul className='divide-y rounded-lg border'>
          {rows.map((row) => (
            <li key={row.id} className='min-w-0 p-4'>
              <Link
                className='block truncate font-medium underline-offset-4 hover:underline'
                to={{
                  pathname: `/personal-schedules/${row.id}`,
                  search: location.search,
                }}
              >
                {row.title}
              </Link>
              <p className='mt-1 text-sm text-muted-foreground'>
                {scheduleTime(row, i18n.language)}
              </p>
              {row.sourceBookingId ? (
                <Badge variant='secondary'>
                  {t('personalSchedules.meeting')}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      <Outlet context={{ reload: r.reload }} />
    </PageContainer>
  );
}
