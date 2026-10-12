import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import { TruncatedText } from '#components/truncated-text';
import type { TravelRecord } from './types.js';
import { amountText } from './money.js';
export function TravelFacts({
  record,
  applicant,
  timeZone,
  users = [],
}: {
  record: TravelRecord;
  applicant: string;
  timeZone: string;
  users?: { id: string; name: string }[];
}) {
  const { t, i18n } = useTranslation();
  const date = (v: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(v));
  const scalarText = (value: unknown) =>
    typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : '—';
  const facts = [
    [
      t('approvals.applicant'),
      <UserName key={t('approvals.applicant')} name={applicant} />,
    ] as const,
    [t('travel.destination'), record.destination],
    [
      t('travel.companions'),
      <span
        key={t('travel.companions')}
        className='inline-flex flex-wrap items-center gap-2'
      >
        {record.companionIds.length
          ? record.companionIds.map((id) => (
              <UserName
                key={id}
                name={
                  users.find((user) => user.id === id)?.name ??
                  t('approvals.unknownPerson')
                }
              />
            ))
          : '—'}
      </span>,
    ] as const,
    [
      t('travel.standard'),
      record.standardSnapshot?.code
        ? scalarText(record.standardSnapshot.code)
        : '—',
    ],
    [
      t('travel.lodgingPerNight'),
      scalarText(record.standardSnapshot?.lodgingPerNight),
    ],
    [
      t('travel.allowancePerDay'),
      scalarText(record.standardSnapshot?.allowancePerDay),
    ],
    [
      t('travel.international'),
      t(record.international ? 'travel.yes' : 'travel.no'),
    ],
    [t('travel.startAt'), date(record.startAt)],
    [t('travel.endAt'), date(record.endAt)],
    [
      t('travel.amount'),
      `${amountText(record.amountCents)} ${t('travel.yuan')}`,
    ],
    [
      t('travel.needsBooking'),
      t(record.needsBooking ? 'travel.yes' : 'travel.no'),
    ],
    ...(['transportCents', 'lodgingCents', 'allowanceCents'] as const).map(
      (key) => [
        t(`travel.${key}`),
        `${amountText(record[key])} ${t('travel.yuan')}`,
      ],
    ),
    [t('travel.bookingInformation'), record.bookingInformation ?? '—'],
    [t('travel.exceptionReason'), record.exceptionReason ?? '—'],
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
        {t('travel.timeZone', { zone: timeZone })}
      </p>
      <p className='text-sm text-muted-foreground'>
        {t(
          record.approvalGrantedAt
            ? 'travel.approvedFacts'
            : 'travel.approvalHint',
        )}
      </p>
      {record.authorizationId && record.approvalGrantedAt ? (
        <p>
          {t('travel.authorizationIssued', {
            amount: amountText(record.amountCents),
          })}
        </p>
      ) : null}
      {!!record.approvalGrantedAt && record.amountCents === 0 ? (
        <p>{t('travel.zeroNoAuthorization')}</p>
      ) : null}
    </section>
  );
}
