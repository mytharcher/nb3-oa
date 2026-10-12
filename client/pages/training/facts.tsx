import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import { TruncatedText } from '#components/truncated-text';
import type { TrainingRecord } from './types.js';
import { amountText } from './money.js';
export function TrainingFacts({
  record,
  applicant,
  timeZone,
}: {
  record: TrainingRecord;
  applicant: string;
  timeZone: string;
}) {
  const { t, i18n } = useTranslation();
  const date = (v: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(v));
  const facts = [
    [
      t('approvals.applicant'),
      <UserName key={t('approvals.applicant')} name={applicant} />,
    ] as const,
    [t('training.name'), record.name],
    [t('training.institution'), record.institution],
    [t('training.startAt'), date(record.startAt)],
    [t('training.endAt'), date(record.endAt)],
    [
      t('training.amount'),
      `${amountText(record.amountCents)} ${t('training.yuan')}`,
    ],
    [
      t('training.usesWorkingTime'),
      t(record.usesWorkingTime ? 'training.yes' : 'training.no'),
    ],
    [t('approvals.reason'), record.reason],
  ];
  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>{t('approvals.facts')}</h2>
      <dl className='grid gap-3 sm:grid-cols-2'>
        {facts.map(([label, value]) => (
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
        {t('training.timeZone', { zone: timeZone })}
      </p>
      <p className='text-sm text-muted-foreground'>
        {t(
          record.status === 'approved'
            ? 'training.approvedFacts'
            : 'training.approvalHint',
        )}
      </p>
      {record.attendanceRecorded ? (
        <p>{t('training.attendanceRecorded')}</p>
      ) : null}
      {record.authorizationId ? (
        <p>
          {t('training.authorizationIssued', {
            amount: amountText(record.amountCents),
          })}
        </p>
      ) : null}
      {record.status === 'approved' && record.amountCents === 0 ? (
        <p>{t('training.zeroNoAuthorization')}</p>
      ) : null}
    </section>
  );
}
