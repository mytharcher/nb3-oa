import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import { Alert, AlertDescription } from '#components/ui/alert';
import { useResource } from '../approvals/use-resource.js';
import { amountText } from './money.js';
import { subjectLabel, type ExpenseOptions } from './options.js';
import { ErrorState } from './states.js';
import type { ExpensePlanRecord, ExpensePlanDetail } from './types.js';
export function ExpenseFacts({
  record,
  applicant,
  detail,
  focusable = false,
}: {
  record: ExpensePlanRecord;
  applicant: string;
  detail?: ExpensePlanDetail;
  focusable?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const options = useResource<ExpenseOptions>('expensePlans/options');
  const label = (type: 'matterTypes' | 'subjects', code: string) =>
    subjectLabel(
      options.data?.[type].find((v) => v.code === code),
      code,
      i18n.language,
    );
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
    [
      t('expensePlans.createdBy'),
      <UserName
        key={t('expensePlans.createdBy')}
        name={
          detail?.users.find((u) => u.id === record.createdById)?.name ??
          applicant
        }
      />,
    ] as const,
    [t('expensePlans.matterType'), label('matterTypes', record.matterType)],
    [
      t('expensePlans.department'),
      detail?.department?.title ??
        (record.departmentId
          ? t('expensePlans.departmentUnavailable')
          : t('expensePlans.departmentPending')),
    ],
    [
      t('expensePlans.budgetYear'),
      record.year?.toString() ?? t('expensePlans.departmentPending'),
    ],
    [t('expensePlans.subject'), label('subjects', record.subject)],
    [
      t('expensePlans.amount'),
      `${amountText(record.amountCents)} ${t('expensePlans.yuan')}`,
    ],
    [t('expensePlans.participants'), String(record.participants)],
    [t('expensePlans.eventDate'), date(record.eventDate)],
    [t('approvals.reason'), record.reason],
  ];
  return (
    <div className='flex flex-col gap-4'>
      {options.error ? (
        <ErrorState error={options.error} retry={options.reload} />
      ) : null}
      <p className='text-sm text-muted-foreground'>
        {t(
          record.status === 'approved'
            ? 'expensePlans.applied'
            : record.status === 'revision'
              ? 'expensePlans.revisionHold'
              : record.heldAccount
                ? 'expensePlans.reserved'
                : 'expensePlans.awaitingEffect',
        )}
      </p>
      <dl className='grid gap-3 sm:grid-cols-[9rem_1fr]'>
        {values.map(([key, value]) => (
          <div key={key} className='contents'>
            <dt className='text-muted-foreground'>{key}</dt>
            <dd
              id={
                focusable && key === t('expensePlans.amount')
                  ? 'expensePlans-amount-fact'
                  : undefined
              }
              tabIndex={
                focusable && key === t('expensePlans.amount') ? -1 : undefined
              }
              className='min-w-0 whitespace-pre-wrap break-words focus:outline-ring focus:outline-2'
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      {record.heldAccount && record.heldCents > 0 ? (
        <div className='rounded-md border border-border p-4 text-sm'>
          <p className='font-medium'>{t('expensePlans.actualHold')}</p>
          <p className='mt-2 break-words'>
            {detail?.department?.title ??
              t('expensePlans.departmentUnavailable')}{' '}
            · {record.heldAccount.year} ·{' '}
            {label('subjects', record.heldAccount.subject)} ·{' '}
            {amountText(record.heldCents)} {t('expensePlans.yuan')}
          </p>
          <p className='mt-2 text-muted-foreground'>
            {t('expensePlans.holdFactHint')}
          </p>
        </div>
      ) : null}
      {record.ruleSnapshot ? (
        <p className='text-sm text-muted-foreground'>
          {t('expensePlans.frozenThreshold', {
            vp:
              typeof record.ruleSnapshot['spend.vp'] === 'number'
                ? String(record.ruleSnapshot['spend.vp'])
                : '—',
            gm:
              typeof record.ruleSnapshot['spend.gm'] === 'number'
                ? String(record.ruleSnapshot['spend.gm'])
                : '—',
          })}
        </p>
      ) : null}
      {detail?.authorization ? (
        <section className='rounded-md border border-border p-4 text-sm'>
          <h2 className='font-medium'>{t('expensePlans.authorization')}</h2>
          <dl className='mt-3 grid gap-2 sm:grid-cols-[9rem_1fr]'>
            {[
              [t('expensePlans.quotaId'), detail.authorization.id],
              [
                t('expensePlans.grantedAmount'),
                `${amountText(detail.authorization.grantedCents)} ${t('expensePlans.yuan')}`,
              ],
              [
                t('expensePlans.quotaState'),
                t(`expensePlans.quotaStates.${detail.authorization.state}`),
              ],
              [t('expensePlans.deadline'), date(detail.authorization.deadline)],
            ].map(([key, value]) => (
              <div key={key} className='contents'>
                <dt className='text-muted-foreground'>{key}</dt>
                <dd className='min-w-0 break-words'>{value}</dd>
              </div>
            ))}
          </dl>
          <p className='mt-3 text-muted-foreground'>
            {t('expensePlans.quotaHint')}
          </p>
        </section>
      ) : null}
      {record.gmMerged ? (
        <Alert>
          <AlertDescription>
            <strong>{t('expensePlans.mergedTitle')}</strong>
            <p className='mt-2'>{t('expensePlans.merged')}</p>
            <p className='mt-2'>
              <UserName
                name={
                  detail?.users.find((u) => u.id === record.gmMerged!.personId)
                    ?.name ?? t('approvals.unknownPerson')
                }
              />{' '}
              ·{' '}
              {new Intl.DateTimeFormat(i18n.language, {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: detail?.timeZone,
              }).format(new Date(record.gmMerged.at))}
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
