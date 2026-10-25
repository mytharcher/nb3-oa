import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link } from 'react-router';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import { Skeleton } from '#components/ui/skeleton';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { useScheduleResource } from './resource';
import {
  type Schedule,
  dayInterval,
  localDay,
  scheduleTime,
  schedulePolicy,
} from './types';
import { ScheduleError } from './states';
export function TodayScheduleCard() {
  const { t, i18n } = useTranslation(),
    permission = useCan(schedulePolicy('view'));
  const allowed = permission.can && !permission.isPending && !permission.error;
  const r = useScheduleResource<{ data: Schedule[] }>(
    allowed ? 'personalSchedules' : null,
    dayInterval(localDay()),
  );
  if (!allowed) return null;
  return (
    <Card className='min-w-0 flex-none lg:flex-1'>
      <CardHeader className='flex flex-row items-center justify-between gap-2'>
        <CardTitle>{t('personalSchedules.todayTitle')}</CardTitle>
        <ApplicationRefreshButton
          label={t('personalSchedules.refresh')}
          loading={r.loading}
          onClick={r.reload}
        />
      </CardHeader>
      <CardContent className='space-y-3'>
        {r.error ? <ScheduleError error={r.error} retry={r.reload} /> : null}
        {r.loading && !r.data ? <Skeleton className='h-20' /> : null}
        {r.data?.data.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {t('personalSchedules.empty')}
          </p>
        ) : null}
        <ul className='space-y-3'>
          {r.data?.data.slice(0, 5).map((row) => (
            <li key={row.id} className='min-w-0'>
              <Link
                className='block truncate text-sm font-medium hover:underline'
                to={`/personal-schedules/${row.id}`}
              >
                {row.title}
              </Link>
              <p className='text-xs text-muted-foreground'>
                {scheduleTime(row, i18n.language)}
              </p>
            </li>
          ))}
        </ul>
        <Link
          className='text-sm underline underline-offset-4'
          to='/personal-schedules'
        >
          {t('personalSchedules.viewAll')}
        </Link>
      </CardContent>
    </Card>
  );
}
