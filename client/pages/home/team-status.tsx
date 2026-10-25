import { Link } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { Skeleton } from '#components/ui/skeleton';
import { useScheduleResource } from '../personal-schedules/resource.js';
import { ScheduleError } from '../personal-schedules/states.js';
import type { TeamCalendarResponse } from '../personal-schedules/types.js';

/** A quiet daily summary; the calendar owns names, periods and detailed team browsing. */
export function TeamStatus() {
  const access = useCan({
    resource: { type: 'composite', id: 'oa.personalSchedules' },
    action: 'view',
  });
  if (!access.can || access.isPending || access.error) return null;
  return <TeamSummary />;
}
function TeamSummary() {
  const { t, i18n } = useTranslation();
  const resource = useScheduleResource<TeamCalendarResponse>(
    'personalSchedules/team',
    { scope: 'managed' },
  );
  const kinds = ['leave', 'travel', 'outing'] as const;
  return (
    <section
      aria-label={t('personalSchedules.team.todayTitle')}
      className='flex min-w-0 flex-wrap items-center justify-between gap-2 px-1 text-sm'
    >
      {resource.error ? (
        <ScheduleError error={resource.error} retry={resource.reload} />
      ) : resource.data ? (
        <>
          <p className='flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground'>
            <span>{t('personalSchedules.team.todayTitle')}</span>
            {kinds.map((kind) => (
              <span key={kind}>
                {t(`personalSchedules.team.${kind}`)} ·{' '}
                {new Intl.NumberFormat(i18n.language).format(
                  new Set(
                    resource
                      .data!.data.filter((row) => row.kind === kind)
                      .map((row) => row.userId),
                  ).size,
                )}
              </span>
            ))}
          </p>
          <Link
            className='rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring'
            to={`/team-calendar?day=${resource.data.meta.date}&scope=managed`}
          >
            {t('personalSchedules.team.viewTeam')}
          </Link>
        </>
      ) : resource.loading ? (
        <Skeleton className='h-5 w-64' aria-label={t('workbench.loading')} />
      ) : null}
    </section>
  );
}
