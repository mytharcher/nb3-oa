import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import { useDepartmentOptions } from '#hooks/use-department-options';
import { useResource } from '../approvals/use-resource.js';
import { amountText } from './money.js';
import type { BudgetAdjustmentRecord } from './types.js';
import { subjectLabel, type BudgetOptions } from './options.js';
export function BudgetFacts({
  record,
  applicant,
  focusable = false,
}: {
  record: BudgetAdjustmentRecord;
  applicant: string;
  focusable?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const departments = useDepartmentOptions(true);
  const options = useResource<BudgetOptions>('budgetAdjustments/options');
  const department = (id: string) =>
    departments.departments?.find((v) => v.id === id)?.path ?? id;
  const subject = (code: string) =>
    subjectLabel(
      options.data?.subjects.find((v) => v.code === code),
      code,
      i18n.language,
    );
  const proposal = [
    [
      t('approvals.applicant'),
      <UserName key={t('approvals.applicant')} name={applicant} />,
    ] as const,
    [t('budgetAdjustments.department'), department(record.departmentId)],
    [t('budgetAdjustments.year'), String(record.year)],
    [
      t('budgetAdjustments.type'),
      t(`budgetAdjustments.${record.adjustmentType}`),
    ],
    [t('budgetAdjustments.targetSubject'), subject(record.subject)],
    [
      t('budgetAdjustments.sourceSubject'),
      record.sourceSubject ? subject(record.sourceSubject) : '—',
    ],
    [
      t('budgetAdjustments.amount'),
      `${amountText(record.amountCents)} ${t('budgetAdjustments.yuan')}`,
    ],
    [t('approvals.reason'), record.reason],
  ];
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-sm text-muted-foreground'>
        {t(
          record.status === 'approved'
            ? 'budgetAdjustments.applied'
            : record.status === 'revision'
              ? 'budgetAdjustments.revisionHold'
              : record.heldAccount
                ? 'budgetAdjustments.reserved'
                : 'budgetAdjustments.awaitingEffect',
        )}
      </p>
      <dl className='grid gap-3 sm:grid-cols-[9rem_1fr]'>
        {proposal.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd
              id={
                focusable && label === t('budgetAdjustments.amount')
                  ? 'budgetAdjustments-amount-fact'
                  : undefined
              }
              tabIndex={
                focusable && label === t('budgetAdjustments.amount')
                  ? -1
                  : undefined
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
          <p className='font-medium'>{t('budgetAdjustments.actualHold')}</p>
          <p className='mt-2 break-words'>
            {department(record.heldAccount.departmentId)} ·{' '}
            {record.heldAccount.year} · {subject(record.heldAccount.subject)} ·{' '}
            {amountText(record.heldCents)} {t('budgetAdjustments.yuan')}
          </p>
        </div>
      ) : null}
      {record.ruleSnapshot ? (
        <p className='text-sm text-muted-foreground'>
          {t('budgetAdjustments.frozenThreshold', {
            amount:
              typeof record.ruleSnapshot['budget.increaseGm'] === 'number'
                ? String(record.ruleSnapshot['budget.increaseGm'])
                : '—',
          })}
        </p>
      ) : null}
    </div>
  );
}
