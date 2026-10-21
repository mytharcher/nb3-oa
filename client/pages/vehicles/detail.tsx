import {
  ApprovalUiProvider,
  ApprovalProgress,
  ApprovalTimeline,
} from '#extensions/nocobase-approval-ui';
import { progressOf, copiesOf, timelineOf } from './approval-mapping.js';
import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { statusTone } from './status-tone.js';
import { StatusBadge } from '#components/status-badge';
import { UserName } from '#components/user-name';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { offeredActions } from '@nocobase/app-plugin-approval/client';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import { Button } from '#components/ui/button';
import { useVehicleResource } from './resource.js';
import { Loading, VehicleError } from './states.js';
import { dateText, type Detail, type Facts, type Source } from './types.js';
import { amountText } from './money.js';
export default function RequestDetail() {
  const { requestId } = useParams(),
    location = useLocation(),
    parent = useOutletContext<Source>(),
    { t, i18n } = useTranslation(),
    r = useVehicleResource<{ data: Detail }>(
      `vehicleBrowser/requests/${encodeURIComponent(requestId ?? '')}`,
    ),
    detail = r.data?.data;
  // A refresh deliberately invalidates private dependent reads until the new ordinary authorization returns.
  const ready = !r.loading && !r.error && detail;
  const f = useVehicleResource<{ data: Facts }>(
    ready
      ? `vehicleBrowser/requests/${encodeURIComponent(requestId ?? '')}/facts`
      : null,
    undefined,
    ready ? detail.record.lifecycleVersion : 0,
  );
  const cost = useVehicleResource<{ data: { id: string; fuelCents: number } }>(
    ready && detail.canViewCost && f.data?.data.usage
      ? `vehicleRequests/${encodeURIComponent(requestId ?? '')}/usageCost`
      : null,
    undefined,
    ready ? detail.record.lifecycleVersion : 0,
  );
  const reload = () => {
      r.reload();
      f.reload();
      cost.reload();
      parent.reload();
    },
    link = (path: string) => ({
      pathname: path,
      search: location.search,
      hash: location.hash,
    }),
    offers = detail
      ? offeredActions(
          detail.taskActions,
          detail.runActions,
          detail.runs.map((r) => r.run),
        ).filter(
          (o) =>
            [
              'approve',
              'reject',
              'return',
              'claim',
              'release',
              'comment',
              'complete',
              'unable',
              'registerUsage',
            ].includes(o.name) && 'taskId' in o.target,
        )
      : [];
  const footer = (
    <>
      {ready
        ? detail.transitions
            .filter((a) => a !== 'edit')
            .map((a) => (
              <Button
                key={a}
                nativeButton={false}
                variant={
                  ['withdraw', 'terminate'].includes(a)
                    ? 'destructive'
                    : 'default'
                }
                render={<Link to={link(`action/${a}`)} />}
              >
                {t(`vehicles.actions.${a}`)}
              </Button>
            ))
        : null}
      {ready && detail.transitions.includes('edit') ? (
        <Button
          nativeButton={false}
          variant='outline'
          render={<Link to={link('edit')} />}
        >
          {t('vehicles.actions.edit')}
        </Button>
      ) : null}
      {ready
        ? offers.map((o) => (
            <Button
              key={o.key}
              nativeButton={false}
              variant={
                ['reject', 'unable'].includes(o.name)
                  ? 'destructive'
                  : 'outline'
              }
              render={
                <Link
                  to={link(
                    `action/${o.name}/${'taskId' in o.target ? encodeURIComponent(o.target.taskId) : ''}`,
                  )}
                />
              }
            >
              {t(`vehicles.actions.${o.name}`)}
            </Button>
          ))
        : null}
      <ApplicationRefreshButton
        label={t('vehicles.refresh')}
        loading={r.loading}
        onClick={reload}
      />
    </>
  );
  const record = detail?.record,
    name = record?.number ?? t('vehicles.draft'),
    person = (id: string) =>
      detail?.users.find((p) => p.id === id)?.name ?? t('vehicles.unknown');
  return (
    <RecordDetailDrawer
      headerStatus={
        record ? (
          <StatusBadge tone={statusTone(record.status)}>
            {t(`vehicles.status.${record.status}`)}
          </StatusBadge>
        ) : null
      }
      printable
      printDisabled={!ready}
      title={name}
      footer={footer}
    >
      {r.error ? (
        <VehicleError error={r.error} retry={reload} />
      ) : r.loading && !r.data ? (
        <Loading />
      ) : record && detail ? (
        <div className='flex flex-col gap-5'>
          <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
            {[
              ['purpose', record.purpose],
              ['destination', record.destination],
              [
                'applicant',
                <UserName
                  key={'applicant'}
                  name={person(record.applicantId)}
                />,
              ] as const,
              [
                'startAt',
                dateText(record.startAt, i18n.language, detail.timeZone),
              ],
              ['endAt', dateText(record.endAt, i18n.language, detail.timeZone)],
              ['passengers', String(record.passengers)],
              [
                'needsDriver',
                t(record.needsDriver ? 'vehicles.yes' : 'vehicles.no'),
              ],
            ].map(([key, value]) => (
              <div key={key}>
                <dt className='text-sm text-muted-foreground'>
                  {t(`vehicles.fields.${key}`)}
                </dt>
                <dd className='break-words'>{value}</dd>
              </div>
            ))}
          </dl>
          {f.error ? (
            <VehicleError error={f.error} retry={f.reload} />
          ) : f.loading && !f.data ? (
            <Loading />
          ) : f.data?.data.dispatch ? (
            <section>
              <h3 className='font-medium'>{t('vehicles.dispatchFact')}</h3>
              <p>
                {f.data.data.dispatch.vehicle.name} ·{' '}
                {f.data.data.dispatch.vehicle.plateNumber}
              </p>
              <p>
                {f.data.data.dispatch.driver ? (
                  <UserName name={f.data.data.dispatch.driver.name} />
                ) : (
                  t('vehicles.noDriver')
                )}
              </p>
              <p>
                {t('vehicles.fields.dispatchedBy')}:{' '}
                <UserName name={f.data.data.dispatch.dispatchedBy.name} />
              </p>
            </section>
          ) : null}
          {f.data?.data.usage ? (
            <section>
              <h3 className='font-medium'>{t('vehicles.usageFact')}</h3>
              <p>
                {t('vehicles.fields.mileage')}: {f.data.data.usage.mileage}
              </p>
              <p className='break-words'>{f.data.data.usage.exception}</p>
              <p>
                {t('vehicles.fields.registeredBy')}:{' '}
                <UserName name={f.data.data.usage.registeredBy.name} />
              </p>
            </section>
          ) : null}
          {detail.canViewCost && f.data?.data.usage ? (
            <section>
              <h3 className='font-medium'>{t('vehicles.fields.fuel')}</h3>
              {cost.error ? (
                <VehicleError error={cost.error} retry={cost.reload} />
              ) : cost.loading ? (
                <Loading />
              ) : cost.data ? (
                <p>{amountText(cost.data.data.fuelCents)}</p>
              ) : null}
            </section>
          ) : null}
          <ApprovalUiProvider
            personName={(id) => (id ? person(id) : t('vehicles.unknown'))}
            formatDateTime={(value) =>
              dateText(value, i18n.language, detail.timeZone)
            }
          >
            <section className='flex flex-col gap-4'>
              <h3 className='text-base font-medium'>
                {t('vehicles.progress')}
              </h3>
              <ApprovalProgress
                steps={progressOf(
                  detail,
                  {
                    t: (key, options) => t(key, options),
                    name: (id) => (id ? person(id) : t('vehicles.unknown')),
                    stage: (key, title) =>
                      t(`vehicles.stages.${key}`, { defaultValue: title }),
                  },
                  i18n.language,
                )}
                copies={copiesOf(detail)}
              />
            </section>
            <section className='flex flex-col gap-4'>
              <h3 className='text-base font-medium'>{t('vehicles.history')}</h3>
              <ApprovalTimeline
                lines={timelineOf(detail, {
                  t: (key, options) => t(key, options),
                  name: (id) => (id ? person(id) : t('vehicles.unknown')),
                  stage: (key, title) =>
                    t(`vehicles.stages.${key}`, { defaultValue: title }),
                })}
              />
            </section>
          </ApprovalUiProvider>
        </div>
      ) : null}
      <Outlet context={{ reload }} />
    </RecordDetailDrawer>
  );
}
