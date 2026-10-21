import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import { formatCents } from '#lib/money';
import type { LoanRequestRecord, LoanRequestDetail } from './types.js';
export function LoanFacts({
  record,
  applicant,
  detail,
  focusable = false,
}: {
  record: LoanRequestRecord;
  applicant: string;
  detail?: LoanRequestDetail;
  focusable?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const date = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${value}T12:00:00Z`));
  const values = [
    [
      t('approvals.applicant'),
      <UserName key={t('approvals.applicant')} name={applicant} />,
    ] as const,
    [t('loanRequests.department'), detail?.department?.title ?? '—'],
    [
      t('loanRequests.amount'),
      `${formatCents(record.amountCents, i18n.language)} ${t('loanRequests.yuan')}`,
    ],
    [t('loanRequests.dueDate'), date(record.dueDate)],
    [
      t('loanRequests.travel'),
      record.travelId
        ? (detail?.travelName ?? t('loanRequests.relatedUnavailable'))
        : '—',
    ],
    [t('approvals.reason'), record.reason],
  ];
  return (
    <div className='flex flex-col gap-4'>
      <dl className='grid gap-3 sm:grid-cols-[9rem_1fr]'>
        {values.map(([key, value]) => (
          <div key={key} className='contents'>
            <dt className='text-muted-foreground'>{key}</dt>
            <dd
              id={
                focusable && key === t('loanRequests.amount')
                  ? 'loanRequests-amount-fact'
                  : undefined
              }
              tabIndex={
                focusable && key === t('loanRequests.amount') ? -1 : undefined
              }
              className='min-w-0 whitespace-pre-wrap break-words'
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {record.heldCents > 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('loanRequests.inflight', {
            amount: formatCents(record.heldCents, i18n.language),
          })}
        </p>
      ) : null}
      {record.quotaSnapshot ? (
        <p className='text-sm text-muted-foreground'>
          {t('loanRequests.quotaFact', {
            debt: formatCents(
              record.quotaSnapshot.outstandingCents,
              i18n.language,
            ),
            inflight: formatCents(
              record.quotaSnapshot.inflightCents,
              i18n.language,
            ),
            total: formatCents(record.quotaSnapshot.totalCents, i18n.language),
          })}
        </p>
      ) : null}
      {detail?.loan ? (
        <section className='rounded-md border border-border p-4'>
          <h2 className='font-medium'>{t('loanRequests.loan')}</h2>
          <dl className='mt-3 grid gap-2 sm:grid-cols-[9rem_1fr]'>
            {[
              [
                t('loanRequests.principal'),
                formatCents(detail.loan.principalCents, i18n.language),
              ],
              [
                t('loanRequests.repaid'),
                formatCents(detail.loan.repaidCents, i18n.language),
              ],
              [
                t('loanRequests.outstanding'),
                formatCents(detail.loan.outstandingCents, i18n.language),
              ],
              [
                t('loanRequests.pendingRepayment'),
                formatCents(detail.loan.heldCents, i18n.language),
              ],
              [
                t('loanRequests.dueDate'),
                date(
                  record.returnDueDate &&
                    record.returnDueDate < detail.loan.dueDate
                    ? record.returnDueDate
                    : detail.loan.dueDate,
                ),
              ],
            ].map(([key, value]) => (
              <div className='contents' key={key}>
                <dt className='text-muted-foreground'>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className='mt-3 text-sm text-muted-foreground'>
            {t('loanRequests.pendingHint')}
          </p>
        </section>
      ) : null}
    </div>
  );
}
