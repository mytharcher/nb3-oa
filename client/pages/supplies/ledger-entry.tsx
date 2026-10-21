import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import { useParams } from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { useRouteOverlay } from '#components/use-route-overlay';
import { StatusBadge } from '#components/status-badge';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { useResource } from '../approvals/use-resource.js';
import { ErrorState } from './states.js';
import type { SupplyLedgerEntry } from './types.js';
export default function SupplyLedgerEntryPage() {
  const { entryId } = useParams(),
    { t, i18n } = useTranslation();
  const resource = useResource<{ items: SupplyLedgerEntry[] }>(
      `supplyRequests/ledger`,
      { entryId: entryId ?? '', limit: '1' },
    ),
    record = resource.data?.items[0];
  return (
    <RouteDrawer
      title={record?.number ?? t('supplies.ledgerDetail')}
      description={t('supplies.ledgerDescription')}
    >
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : null}
      {resource.loading && !resource.data ? (
        <FieldsSkeleton fields={8} />
      ) : null}
      {resource.data && !record ? <MissingEntry /> : null}
      {record ? (
        <div className='flex flex-col gap-6'>
          <StatusBadge
            tone={record.outcome === 'issued' ? 'success' : 'warning'}
          >
            {t(`supplies.states.${record.outcome}`)}
          </StatusBadge>
          <dl className='grid grid-cols-1 gap-4 text-sm sm:grid-cols-[8rem_1fr] [&>div]:contents'>
            {[
              [
                t('supplies.item'),
                record.itemLabel[i18n.language] ??
                  record.itemLabel['zh-CN'] ??
                  record.itemCode,
              ],
              [
                t('supplies.requestedQuantity'),
                new Intl.NumberFormat(i18n.language).format(
                  record.requestedQuantity,
                ),
              ],
              [
                t('supplies.actualQuantity'),
                record.actualQuantity === null
                  ? t('supplies.unconfirmed')
                  : new Intl.NumberFormat(i18n.language).format(
                      record.actualQuantity,
                    ),
              ],
              [
                t('supplies.recipient'),
                <UserName
                  key={t('supplies.recipient')}
                  name={record.recipient.name}
                />,
              ] as const,
              [
                t('supplies.issuer'),
                <UserName
                  key={t('supplies.issuer')}
                  name={record.issuer.name}
                />,
              ] as const,
              [t('supplies.reason'), record.reason ?? '—'],
              ...Object.entries(record.printInfo ?? {}).map(([key, value]) => [
                t(`supplies.print.${key}`),
                value,
              ]),
            ].map(([label, value]) => (
              <div key={label}>
                <dt className='text-muted-foreground'>{label}</dt>
                <dd
                  className={
                    label === t('supplies.requestedQuantity') ||
                    label === t('supplies.actualQuantity')
                      ? 'whitespace-pre-wrap break-words text-right tabular-nums'
                      : 'whitespace-pre-wrap break-words'
                  }
                >
                  {value || '—'}
                </dd>
              </div>
            ))}
          </dl>
          {record.outcome === 'forcedClosed' ? (
            <p className='text-sm text-muted-foreground'>
              {t('supplies.forcedHint')}
            </p>
          ) : null}
        </div>
      ) : null}
    </RouteDrawer>
  );
}

function MissingEntry() {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <Alert variant='destructive'>
      <AlertDescription>{t('supplies.entryMissing')}</AlertDescription>
      <Button
        variant='outline'
        onClick={() => {
          void close();
        }}
      >
        {t('approvals.cancel')}
      </Button>
    </Alert>
  );
}
