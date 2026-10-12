import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import { TruncatedText } from '#components/truncated-text';
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
  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>{t('approvals.facts')}</h2>
      <dl className='grid gap-3 sm:grid-cols-2'>
        {[
          [
            t('approvals.applicant'),
            <UserName key={t('approvals.applicant')} name={applicant} />,
          ] as const,
          [t('travelCancellation.source'), record.sourceId],
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
            ? [[t('approvals.reason'), record.exceptionReason]]
            : []),
        ].map(([label, value]) => (
          <div key={label}>
            <dt className='text-sm text-muted-foreground'>{label}</dt>
            <dd className='text-sm break-words'>
              {typeof value === 'string' ? (
                <TruncatedText text={value} />
              ) : (
                value
              )}
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
