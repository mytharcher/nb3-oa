import { format, isValid, parseISO } from 'date-fns';
import { useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { CalendarDays } from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DatePicker } from '#components/date-picker';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { Badge } from '#components/ui/badge';
import { Skeleton } from '#components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from '#components/ui/empty';
import { useScheduleResource } from './resource';
import { ScheduleError } from './states';
import { localDay, teamTime, type TeamCalendarResponse } from './types';
export default function TeamCalendar() {
  const { t, i18n } = useTranslation(),
    [params, setParams] = useSearchParams();
  const requested = params.get('day') ?? '',
    date =
      /^\d{4}-\d{2}-\d{2}$/.test(requested) && isValid(parseISO(requested))
        ? requested
        : localDay();
  const department = params.get('department') ?? 'all';
  const r = useScheduleResource<TeamCalendarResponse>(
    'personalSchedules/team',
    { date, scope: params.get('scope') === 'managed' ? 'managed' : 'visible' },
  );
  const departments = [
    ...new Map(
      (r.data?.data ?? [])
        .filter((x) => x.departmentId)
        .map((x) => [x.departmentId!, x.department]),
    ).entries(),
  ];
  const items = [
    { value: 'all', label: t('personalSchedules.team.all') },
    ...departments.map(([value, label]) => ({ value, label })),
  ];
  const rows = r.data?.data.filter(
    (row) => department === 'all' || row.departmentId === department,
  );
  return (
    <PageContainer>
      <PageHeader
        title={t('personalSchedules.team.title')}
        description={t('personalSchedules.team.hint')}
        actions={
          <ApplicationRefreshButton
            label={t('personalSchedules.refresh')}
            loading={r.loading}
            onClick={r.reload}
          />
        }
      />
      <div className='flex flex-wrap items-center gap-3'>
        <label htmlFor='team-date'>{t('personalSchedules.day')}</label>
        <DatePicker
          id='team-date'
          value={parseISO(date)}
          onChange={(value) => {
            const next = new URLSearchParams(params);
            next.set('day', value ? format(value, 'yyyy-MM-dd') : localDay());
            setParams(next);
          }}
        />
        <Select
          items={items}
          value={department}
          onValueChange={(value) => {
            const next = new URLSearchParams(params);
            next.set('department', value ?? 'all');
            setParams(next);
          }}
        >
          <SelectTrigger
            aria-label={t('personalSchedules.team.department')}
            className='w-full sm:w-56'
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto min-w-(--anchor-width)'>
            <SelectGroup>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {r.error ? <ScheduleError error={r.error} retry={r.reload} /> : null}
      {r.loading && !r.data ? <Skeleton className='h-48' /> : null}
      {rows?.length === 0 ? (
        <Empty className='min-h-48 border border-dashed'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>{t('personalSchedules.team.empty')}</EmptyTitle>
            <EmptyDescription>
              {t('personalSchedules.team.emptyHint')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : null}
      {rows?.length ? (
        <ul className='divide-y rounded-lg border'>
          {rows.map((row) => (
            <li
              key={`${row.kind}:${row.id}:${row.userId}`}
              className='flex min-w-0 flex-wrap items-center justify-between gap-2 p-4'
            >
              <div className='min-w-0'>
                <p className='break-words font-medium'>{row.name}</p>
                <p className='text-sm text-muted-foreground'>
                  {row.department}
                </p>
                <p className='text-sm text-muted-foreground'>
                  {teamTime(row, i18n.language, r.data?.meta?.timeZone)}
                </p>
              </div>
              <Badge variant='secondary'>
                {t(`personalSchedules.team.${row.kind}`)}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </PageContainer>
  );
}
