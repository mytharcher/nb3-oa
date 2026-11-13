import { repairQuery, useRepairOptions } from './query-state.js';
import { Link, Outlet, useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useBusinessResource } from '#hooks/use-business-resource';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { Skeleton } from '#components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import { Button } from '#components/ui/button';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '#components/ui/table';
import { Failure } from '../work-items/states.js';
import { QuerySummary, RepairAdminLinks } from './query.js';
interface Distribution {
  samples: number;
  mean: number | null;
  median: number | null;
  p90: number | null;
}
interface Report {
  asOf: string;
  counts: Record<string, number>;
  durations: Record<string, Distribution>;
  responseRate: number | null;
  solutionRate: number | null;
  satisfaction: number | null;
  participation: number | null;
  ratedCount: number;
  returnCount: number;
  everResponseOverdue: number;
  everSolutionOverdue: number;
}
export default function RepairReports() {
  const { t, i18n } = useTranslation(),
    [params] = useSearchParams(),
    query = repairQuery(params),
    r = useBusinessResource<{ data: Report }>('itRepairs/reports', query),
    options = useRepairOptions();
  const number = (n: number | null) =>
    n === null
      ? t('itRepairs.report.noData')
      : new Intl.NumberFormat(i18n.language, {
          maximumFractionDigits: 2,
        }).format(n);
  const ratio = (n: number | null) =>
    n === null
      ? t('itRepairs.report.noData')
      : new Intl.NumberFormat(i18n.language, {
          style: 'percent',
          maximumFractionDigits: 1,
        }).format(n);
  function target(cohort: string) {
    const q = new URLSearchParams(params);
    q.set('cohort', cohort);
    q.delete('page');
    return `/it-repairs?${q}`;
  }
  const data = r.data?.data;
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('itRepairs.reports')}
          description={t('itRepairs.report.description')}
          actions={
            <>
              <Button
                variant='outline'
                render={
                  <Link to={{ pathname: 'filters', search: `?${params}` }} />
                }
              >
                {t('itRepairs.query.filters')}
              </Button>
              <ApplicationRefreshButton
                label={t('itRepairs.refresh')}
                loading={r.loading}
                onClick={r.reload}
              />
            </>
          }
        />
        <QuerySummary params={params} options={options.data?.data} />
        {Object.keys(repairQuery(params)).some(
          (k) => !['sort', 'direction'].includes(k),
        ) ? (
          <Button variant='ghost' render={<Link to='/it-repair-reports' />}>
            {t('workItems.clear')}
          </Button>
        ) : null}
        <div className='flex flex-wrap gap-2'>
          <RepairAdminLinks />
          <Button variant='outline' render={<Link to='/it-repairs' />}>
            {t('itRepairs.title')}
          </Button>
        </div>
        {r.loading && !data ? (
          <div
            className='grid grid-cols-2 gap-4 lg:grid-cols-4'
            aria-label={t('itRepairs.query.loading')}
          >
            {[
              'submitted',
              'open',
              'closed',
              'management',
              'cancelled',
              'response',
              'solution',
              'waiting',
            ].map((key) => (
              <Card key={key}>
                <CardHeader>
                  <Skeleton className='h-4 w-24' />
                </CardHeader>
                <CardContent>
                  <Skeleton className='h-8 w-16' />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : r.error ? (
          <Failure error={r.error} module='itRepairs' retry={r.reload} />
        ) : data ? (
          <>
            <p className='text-sm text-muted-foreground'>
              {t('itRepairs.report.asOf', {
                date: new Date(data.asOf).toLocaleString(i18n.language),
              })}
            </p>
            <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
              {[
                'submitted',
                'currentOpen',
                'userClosed',
                'managementClosed',
                'cancelled',
                'responseOverdue',
                'solutionOverdue',
                'waiting',
              ].map((key) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className='text-sm'>
                      <Link className='hover:underline' to={target(key)}>
                        {t(`itRepairs.report.${key}`)}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='text-2xl font-semibold tabular-nums'>
                    {number(data.counts[key])}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <CardTitle>{t('itRepairs.report.compliance')}</CardTitle>
                <p className='text-sm text-muted-foreground'>
                  {t('itRepairs.report.denominators')}
                </p>
              </CardHeader>
              <CardContent className='flex flex-col gap-4'>
                <p>
                  <Link className='underline' to={target('responses')}>
                    {t('itRepairs.query.response')}:{' '}
                    {number(data.counts.responseMet)}/
                    {number(data.counts.responses)}
                  </Link>{' '}
                  · {ratio(data.responseRate)}
                </p>
                <p>
                  <Link className='underline' to={target('userClosed')}>
                    {t('itRepairs.query.solution')}:{' '}
                    {number(data.counts.solutionMet)}/
                    {number(data.counts.userClosed)}
                  </Link>{' '}
                  · {ratio(data.solutionRate)}
                </p>
                <p>
                  {t('itRepairs.report.ever', {
                    response: number(data.everResponseOverdue),
                    solution: number(data.everSolutionOverdue),
                    returns: number(data.returnCount),
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('itRepairs.report.durations')}</CardTitle>
                <p className='text-sm text-muted-foreground'>
                  {t('itRepairs.report.durationBasis')}
                </p>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {['metric', 'samples', 'mean', 'median', 'p90'].map(
                          (key) => (
                            <TableHead
                              key={key}
                              className={key === 'metric' ? '' : 'text-right'}
                            >
                              {t(`itRepairs.report.${key}`)}
                            </TableHead>
                          ),
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(data.durations).map(([key, v]) => (
                        <TableRow key={key}>
                          <TableCell className='whitespace-normal'>
                            {t(`itRepairs.report.${key}`)}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {number(v.samples)}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {number(v.mean)}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {number(v.median)}
                          </TableCell>
                          <TableCell className='text-right tabular-nums'>
                            {number(v.p90)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t('itRepairs.report.satisfaction')}</CardTitle>
              </CardHeader>
              <CardContent className='flex flex-col gap-2'>
                <p>
                  {t('itRepairs.report.ratingMean')}:{' '}
                  {number(data.satisfaction)}
                </p>
                <p>
                  {t('itRepairs.report.participation')}:{' '}
                  {number(data.ratedCount)}/{number(data.counts.userClosed)} ·{' '}
                  {ratio(data.participation)}
                </p>
              </CardContent>
            </Card>
          </>
        ) : null}
      </PageContainer>
      <Outlet />
    </>
  );
}
