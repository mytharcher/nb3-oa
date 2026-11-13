import { useState, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { format, addDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { createRequestKey } from '#lib/request-key';
import { DateRangePicker, type DateRange } from '#components/date-picker';
import { parts, zonedDateTime } from '#components/date-time-picker-zone';
import { PageContainer } from '#components/page-container';
import { RouteFormPage } from '#components/route-form-page';
import { FormActions } from '#components/form-actions';
import { Field, FieldLabel, FieldGroup } from '#components/ui/field';
import { Button } from '#components/ui/button';
import { OptionSelect } from '../work-items/select.js';
import { Failure, Loading } from '../work-items/states.js';
import { repairQuery, useRepairOptions, type Options } from './query-state.js';
export function QuerySummary({
  params,
  options,
}: {
  params: URLSearchParams;
  options?: Options;
}) {
  const { t, i18n } = useTranslation();
  const values = repairQuery(params);
  const labels = Object.entries(values)
    .filter(([k]) => !['q', 'sort', 'direction'].includes(k))
    .map(([key, value]) => {
      if (key === 'from' || key === 'to')
        return `${t(`itRepairs.query.${key}`)} ${new Date(value).toLocaleDateString(i18n.language, { timeZone: options?.timeZone })}`;
      if (key === 'groupId')
        return (
          options?.groups.find((g) => g.id === value)?.title ??
          t('itRepairs.query.restrictedGroup')
        );
      if (key === 'assigneeId')
        return (
          options?.engineers.find((g) => g.id === value)?.name ??
          t('itRepairs.query.restrictedEngineer')
        );
      if (key === 'status') return t(`itRepairs.states.${value}`);
      if (key === 'category') return t(`itRepairs.options.${value}`);
      if (key === 'priority') return value;
      return t(`itRepairs.query.${value}`);
    });
  return labels.length ? (
    <p className='text-sm text-muted-foreground break-words' aria-live='polite'>
      {t('itRepairs.query.active')}: {labels.join(' · ')}
    </p>
  ) : null;
}
export function RepairAdminLinks() {
  const { t } = useTranslation();
  const flow = useCan({
      resource: { type: 'page', id: 'oa.processManagement' },
      action: 'access',
    }),
    rules = useCan({
      resource: { type: 'settings', id: 'oa.platform.rules' },
      action: 'read',
    }),
    groups = useCan({
      resource: { type: 'settings', id: 'oa.itRepairGroups' },
      action: 'read',
    });
  return (
    <>
      {flow.can ? (
        <Button
          variant='outline'
          render={<Link to='/processManagement/definitions/oa.itRepair' />}
        >
          {t('itRepairs.query.flow')}
        </Button>
      ) : null}
      {rules.can ? (
        <Button
          variant='outline'
          render={<Link to='/approval-rules?domain=sla' />}
        >
          {t('itRepairs.query.rules')}
        </Button>
      ) : null}
      {groups.can ? (
        <Button variant='outline' render={<Link to='/it-repair-groups' />}>
          {t('itRepairs.groups')}
        </Button>
      ) : null}
    </>
  );
}
export function ExportRepairs({ params }: { params: URLSearchParams }) {
  const api = useApiClient(),
    toast = useToaster(),
    { t } = useTranslation(),
    can = useCan({
      resource: { type: 'composite', id: 'oa.itRepairs' },
      action: 'export',
    });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const keyRef = useRef({ query: '', key: createRequestKey() });
  if (!can.can) return null;
  async function download() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    const query = repairQuery(params),
      fingerprint = JSON.stringify(query);
    if (keyRef.current.query !== fingerprint)
      keyRef.current = { query: fingerprint, key: createRequestKey() };
    try {
      const stream = await api.stream({
        method: 'POST',
        path: 'itRepairs/export',
        json: { requestKey: keyRef.current.key, query },
      });
      const blob = await new Response(stream).blob(),
        url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = 'it-repairs.csv';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.show({ title: t('itRepairs.query.exported'), type: 'success' });
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className='flex flex-col gap-2'>
      <Button variant='outline' disabled={busy} onClick={() => void download()}>
        {t(busy ? 'itRepairs.query.exporting' : 'itRepairs.export')}
      </Button>
      {error ? (
        <Failure
          error={error}
          module='itRepairs'
          retry={() => void download()}
        />
      ) : null}
    </div>
  );
}
export function RepairFilters() {
  const { t } = useTranslation(),
    options = useRepairOptions();
  if (options.error)
    return (
      <RouteFormPage title={t('itRepairs.query.filters')}>
        <PageContainer>
          <Failure
            error={options.error}
            module='itRepairs'
            retry={options.reload}
          />
        </PageContainer>
      </RouteFormPage>
    );
  if (!options.data)
    return (
      <RouteFormPage title={t('itRepairs.query.filters')}>
        <PageContainer>
          <Loading />
        </PageContainer>
      </RouteFormPage>
    );
  return <FilterEditor options={options.data.data} />;
}
function FilterEditor({ options }: { options: Options }) {
  const { t } = useTranslation(),
    location = useLocation(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  const base = location.pathname.startsWith('/it-repair-reports')
    ? '/it-repair-reports'
    : '/it-repairs';
  const [values, setValues] = useState<Record<string, string>>(() =>
    repairQuery(params),
  );
  const zone = options.timeZone;
  const [range, setRange] = useState<DateRange | undefined>(() =>
    params.get('from')
      ? {
          from: new Date(`${parts(params.get('from')!, zone).date}T12:00:00`),
          to: params.get('to')
            ? new Date(
                `${parts(new Date(+new Date(params.get('to')!) - 1).toISOString(), zone).date}T12:00:00`,
              )
            : undefined,
        }
      : undefined,
  );
  const update = (key: string, value: string) =>
    setValues((v) => ({ ...v, [key]: value === 'all' ? '' : value }));
  function apply() {
    const next = new URLSearchParams(params);
    for (const key of Object.keys(repairQuery(params))) next.delete(key);
    Object.entries(values).forEach(([k, v]) => {
      if (v && !['from', 'to'].includes(k)) next.set(k, v);
    });
    if (range?.from) {
      const from = zonedDateTime(
        format(range.from, 'yyyy-MM-dd'),
        '00:00',
        zone,
      );
      const to = zonedDateTime(
        format(addDays(range.to ?? range.from, 1), 'yyyy-MM-dd'),
        '00:00',
        zone,
      );
      if (from) next.set('from', from);
      if (to) next.set('to', to);
    }
    next.delete('page');
    void navigate(`${base}?${next}`);
  }
  const fields = [
    'groupId',
    'assigneeId',
    'category',
    'priority',
    ...(base === '/it-repair-reports' ? [] : ['dateField']),
    'overdue',
  ];
  function choices(key: string) {
    if (key === 'groupId')
      return (
        options.groups.map((g) => ({
          value: g.id,
          label: g.title,
        })) ?? []
      );
    if (key === 'assigneeId')
      return (
        options.engineers.map((g) => ({
          value: g.id,
          label: g.name,
        })) ?? []
      );
    return (
      {
        category: ['device', 'network', 'software', 'account', 'other'],
        priority: ['P1', 'P2', 'P3', 'P4'],
        dateField: [
          'submittedAt',
          'createdAt',
          'updatedAt',
          'firstRespondedAt',
          'metricEndedAt',
        ],
        overdue: ['response', 'solution', 'either'],
      }[key] ?? []
    ).map((value) => ({
      value,
      label:
        key === 'priority'
          ? value
          : t(
              key === 'category'
                ? `itRepairs.options.${value}`
                : `itRepairs.query.${value}`,
            ),
    }));
  }
  function preset(days: number) {
    const today = new Date(
      `${parts(new Date().toISOString(), zone).date}T12:00:00`,
    );
    setRange({
      from:
        days === -1
          ? startOfMonth(subMonths(today, 1))
          : days
            ? addDays(today, 1 - days)
            : startOfMonth(today),
      to: days === -1 ? endOfMonth(subMonths(today, 1)) : today,
    });
  }
  return (
    <RouteFormPage title={t('itRepairs.query.filters')}>
      <PageContainer>
        <form
          id='repair-filters'
          onSubmit={(e) => {
            e.preventDefault();
            apply();
          }}
        >
          <FieldGroup>
            {fields.map((key) => (
              <Field key={key}>
                <FieldLabel htmlFor={`filter-${key}`}>
                  {t(`itRepairs.query.${key}`)}
                </FieldLabel>
                <OptionSelect
                  id={`filter-${key}`}
                  value={values[key] || 'all'}
                  onChange={(v) => update(key, v)}
                  options={[
                    { value: 'all', label: t('itRepairs.query.all') },
                    ...choices(key),
                  ]}
                />
              </Field>
            ))}
            <Field>
              <FieldLabel htmlFor='repair-date-range'>
                {t('itRepairs.query.range')}
              </FieldLabel>
              <DateRangePicker
                id='repair-date-range'
                value={range}
                onChange={setRange}
              />
              <p className='text-sm text-muted-foreground'>
                {t('itRepairs.query.zone', { zone })}
              </p>
              <div className='flex flex-wrap gap-2'>
                {[7, 30, 0, -1, 90].map((days) => (
                  <Button
                    key={days}
                    variant='outline'
                    type='button'
                    onClick={() => preset(days)}
                  >
                    {t(
                      `itRepairs.query.preset${days === -1 ? 'LastMonth' : days}`,
                    )}
                  </Button>
                ))}
              </div>
            </Field>
          </FieldGroup>
        </form>
        <FormActions>
          <Button
            variant='outline'
            onClick={() => void navigate(`${base}?${params}`)}
          >
            {t('actions.cancel')}
          </Button>
          <Button type='submit' form='repair-filters'>
            {t('itRepairs.query.apply')}
          </Button>
        </FormActions>
      </PageContainer>
    </RouteFormPage>
  );
}
