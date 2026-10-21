import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useResource } from '../approvals/use-resource.js';
import type { TravelDetail } from '../travel/types.js';
import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import type { TravelCancellationRecord } from './types.js';
export function TravelCancellationFacts({
  record,
  applicant,
}: {
  record: TravelCancellationRecord;
  applicant: string;
  timeZone: string;
}) {
  const { t } = useTranslation();
  const permission = useCan({
    resource: { type: 'composite', id: 'oa.travel' },
    action: 'view',
  });
  const source = useResource<TravelDetail>(
    permission.can && !permission.isPending && !permission.error
      ? `travelRequests/${encodeURIComponent(record.sourceId)}`
      : null,
  );
  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>{t('approvals.facts')}</h2>
      <dl className='grid gap-x-4 gap-y-3 sm:grid-cols-[8rem_1fr]'>
        {[
          [
            t('approvals.applicant'),
            <UserName key={t('approvals.applicant')} name={applicant} />,
          ] as const,
          [
            t('travelCancellation.source'),
            source.data?.record.number ??
              source.data?.record.destination ??
              t('travelCancellation.sourceUnavailable'),
          ],
          [t('approvals.reason'), record.reason],
          ...(record.unbookingInformation
            ? [
                [
                  t('travelCancellation.bookingInformation'),
                  record.unbookingInformation,
                ],
              ]
            : []),
          ...(record.exceptionReason
            ? [
                [
                  t('travelCancellation.exceptionReason'),
                  record.exceptionReason,
                ],
              ]
            : []),
        ].map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-sm text-muted-foreground'>{label}</dt>
            <dd className='text-sm whitespace-pre-wrap break-words'>
              {value || '—'}
            </dd>
          </div>
        ))}
      </dl>
      <p className='text-sm text-muted-foreground'>
        {t(
          record.needsUnbooking &&
            ['unbooking', 'exception', 'approved'].includes(record.status)
            ? 'travelCancellation.unbookingHint'
            : 'travelCancellation.effectHint',
        )}
      </p>
    </section>
  );
}
