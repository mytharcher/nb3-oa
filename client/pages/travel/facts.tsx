import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
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
  const money = (cents: number) =>
    new Intl.NumberFormat(i18n.language, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  const scalarText = (value: unknown) =>
    typeof value === 'string' || typeof value === 'number'
      ? typeof value === 'number' || /^\d+(\.\d+)?$/.test(value)
        ? new Intl.NumberFormat(i18n.language, {
            maximumFractionDigits: 2,
          }).format(Number(value))
        : value
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
    [t('travel.amount'), money(record.amountCents)],
    [
      t('travel.needsBooking'),
      t(record.needsBooking ? 'travel.yes' : 'travel.no'),
    ],
    ...(['transportCents', 'lodgingCents', 'allowanceCents'] as const).map(
      (key) => [t(`travel.${key}`), money(record[key])],
    ),
    [t('travel.bookingInformation'), record.bookingInformation ?? '—'],
    [t('travel.exceptionReason'), record.exceptionReason ?? '—'],
    [t('approvals.reason'), record.reason],
  ];
  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>{t('approvals.facts')}</h2>
      <dl className='grid gap-x-4 gap-y-3 sm:grid-cols-[8rem_1fr]'>
        {facts.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-sm text-muted-foreground'>{label}</dt>
            <dd className='text-sm whitespace-pre-wrap break-words'>
              {value || '—'}
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
