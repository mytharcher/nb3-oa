import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { InvoiceTools } from './invoice-tools.js';
import { useResource } from '../approvals/use-resource.js';
import type { FormOptions } from './types-form.js';
import { ErrorState } from './states.js';
import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import { StatusBadge } from '#components/status-badge';
import { ReimbursementAttachments } from './attachments.js';
import { moneyLabel } from './money.js';
import type { ReimbursementDetail } from './types.js';

export function ReimbursementFacts({
  detail,
  refreshKey = 0,
}: {
  detail: ReimbursementDetail;
  refreshKey?: number;
}) {
  const { t, i18n } = useTranslation();
  const { record } = detail;
  const { session } = useAuthentication();
  const options = useResource<FormOptions>('reimbursementRequests/options', {
    recordId: record.id,
    applicantId: record.applicantId,
  });
  const categoryLabel = (code: string) => {
    const label = options.data?.categories?.find(
      (category) => category.code === code,
    )?.label;
    return typeof label === 'string'
      ? label
      : (label?.[i18n.language] ??
          label?.['zh-CN'] ??
          label?.['en-US'] ??
          t('reimbursementRequests.categoryUnavailable'));
  };
  const lineDate = (value: string) =>
    Number.isFinite(Date.parse(`${value}T12:00:00Z`))
      ? new Intl.DateTimeFormat(i18n.language, {
          dateStyle: 'medium',
          timeZone: 'UTC',
        }).format(new Date(`${value}T12:00:00Z`))
      : '—';
  const money = (cents: number) =>
    Number.isSafeInteger(cents) && cents >= 0
      ? moneyLabel(cents, i18n.language)
      : '—';
  const values = [
    [
      t('approvals.applicant'),
      <UserName
        key='applicant'
        name={
          detail.users.find((p) => p.id === record.applicantId)?.name ??
          t('approvals.unknownPerson')
        }
      />,
    ] as const,
    [t('reimbursementRequests.reason'), record.reason || '—'],
    [t('reimbursementRequests.gross'), money(record.totalCents)],
    [t('reimbursementRequests.offset'), money(record.offsetCents)],
    [
      t('reimbursementRequests.net'),
      money(record.totalCents - record.offsetCents),
    ],
    [
      t('reimbursementRequests.form.authorization'),
      record.authorizationId
        ? (options.data?.authorizations?.find(
            (a) => a.id === record.authorizationId,
          )?.sourceReference ?? t('reimbursementRequests.relatedUnavailable'))
        : '—',
    ],
    [
      t('reimbursementRequests.form.loan'),
      record.loanId
        ? (detail.loanName ?? t('reimbursementRequests.relatedUnavailable'))
        : '—',
    ],
    [
      t('reimbursementRequests.form.overrunReason'),
      record.overrunReason || '—',
    ],
    [
      t('reimbursementRequests.detail.failure'),
      record.handlingFailureReason || '—',
    ],
    [t('reimbursementRequests.detail.voucher'), record.voucherNumber || '—'],
    [
      t('reimbursementRequests.detail.forcedReason'),
      record.forcedReason || '—',
    ],
  ];
  return (
    <div className='flex flex-col gap-6'>
      {options.error ? (
        <ErrorState error={options.error} retry={options.reload} />
      ) : null}
      <dl className='grid gap-3 sm:grid-cols-[9rem_1fr]'>
        {values.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='min-w-0 whitespace-pre-wrap break-words'>{value}</dd>
          </div>
        ))}
      </dl>
      <section className='flex flex-col gap-4'>
        <h2 className='text-base font-medium'>
          {t('reimbursementRequests.detail.lines')}
        </h2>
        {!record.lines.length ? (
          <p className='text-sm text-muted-foreground'>
            {t('reimbursementRequests.detail.noLines')}
          </p>
        ) : (
          record.lines.map((line, index) => {
            const fact = record.financeLineFacts[line.id];
            return (
              <section
                key={line.id}
                className='rounded-md border border-border p-4'
              >
                <h3 className='mb-3 font-medium'>
                  {t('reimbursementRequests.detail.line', {
                    number: index + 1,
                  })}
                </h3>
                <dl className='grid gap-3 sm:grid-cols-[9rem_1fr]'>
                  {[
                    [
                      t('reimbursementRequests.form.category'),
                      categoryLabel(line.category),
                    ],
                    [t('reimbursementRequests.form.date'), lineDate(line.date)],
                    [
                      t('reimbursementRequests.form.amount'),
                      money(line.amountCents),
                    ],
                    [
                      t('reimbursementRequests.form.invoice'),
                      line.invoiceNumber || '—',
                    ],
                    [
                      t('reimbursementRequests.form.standardExceptionReason'),
                      line.standardExceptionReason || '—',
                    ],
                  ].map(([label, value]) => (
                    <div className='contents' key={label}>
                      <dt className='text-muted-foreground'>{label}</dt>
                      <dd className='min-w-0 whitespace-pre-wrap break-words'>
                        {value}
                      </dd>
                    </div>
                  ))}
                  <dt className='text-muted-foreground'>
                    {t('reimbursementRequests.detail.financeResult')}
                  </dt>
                  <dd>
                    <StatusBadge
                      tone={
                        fact?.outcome === 'approved'
                          ? 'success'
                          : fact?.outcome === 'returned'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {t(
                        `reimbursementRequests.detail.lineStates.${fact?.outcome ?? 'pending'}`,
                      )}
                    </StatusBadge>
                  </dd>
                  <dt className='text-muted-foreground'>
                    {t('reimbursementRequests.form.attachments')}
                  </dt>
                  <dd className='min-w-0'>
                    <ReimbursementAttachments
                      recordId={record.id}
                      ids={line.attachmentIds}
                      refreshKey={refreshKey}
                    />
                  </dd>
                </dl>
                <InvoiceTools
                  recordId={record.id}
                  lineId={line.id}
                  fileIds={line.attachmentIds}
                  version={JSON.stringify(line)}
                  operation='verify'
                  canOperate={
                    [record.applicantId, record.createdById].includes(
                      session?.user.id ?? '',
                    ) ||
                    detail.taskActions.some(
                      (value) =>
                        value.task.stage === 'finance' &&
                        value.task.subject === line.id &&
                        value.actions.some((action) =>
                          ['approve', 'returnItem', 'reject'].includes(
                            action.name,
                          ),
                        ),
                    )
                  }
                />
              </section>
            );
          })
        )}
      </section>
      <FrozenStandards
        snapshot={record.standardSnapshot}
        categoryLabel={categoryLabel}
      />
    </div>
  );
}

function FrozenStandards({
  snapshot,
  categoryLabel,
}: {
  categoryLabel: (code: string) => string;
  snapshot: ReimbursementDetail['record']['standardSnapshot'];
}) {
  const { t, i18n } = useTranslation();
  const f = (key: string) => t(`reimbursementRequests.standard.${key}`);
  const raw = snapshot?.standard;
  const standard =
    raw && typeof raw === 'object' && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
  const rawCategories: unknown[] = Array.isArray(snapshot?.categories)
    ? snapshot.categories
    : [];
  const categories = rawCategories.filter(
    (value): value is { code: string; standardKind: string } =>
      !!value &&
      typeof value === 'object' &&
      'code' in value &&
      typeof value.code === 'string' &&
      'standardKind' in value &&
      typeof value.standardKind === 'string' &&
      ['none', 'lodging', 'allowance'].includes(value.standardKind),
  );
  const savedNumber = (key: string) =>
    typeof standard?.[key] === 'number' && Number.isFinite(standard[key])
      ? new Intl.NumberFormat(i18n.language).format(standard[key])
      : '—';
  return (
    <section className='flex flex-col gap-3'>
      <h2 className='text-base font-medium'>{f('title')}</h2>
      {!snapshot ? (
        <p className='text-sm text-muted-foreground'>{f('unsubmitted')}</p>
      ) : (
        <>
          <p className='text-sm text-muted-foreground'>{f('frozenHint')}</p>
          {snapshot.linkedKind === 'oa.travel' && standard ? (
            <dl className='grid gap-3 sm:grid-cols-[9rem_1fr]'>
              {[
                [
                  f('gradeCode'),
                  typeof standard.code === 'string' ? standard.code : '—',
                ],
                [f('gradeRank'), savedNumber('gradeRank')],
                [f('lodging'), savedNumber('lodgingPerNight')],
                [f('allowance'), savedNumber('allowancePerDay')],
              ].map(([label, value]) => (
                <div className='contents' key={label}>
                  <dt className='text-muted-foreground'>{label}</dt>
                  <dd className='min-w-0 break-words'>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className='text-sm text-muted-foreground'>
              {f('notApplicable')}
            </p>
          )}
          <dl className='grid gap-3 sm:grid-cols-[9rem_1fr]'>
            {categories.map((category) => (
              <div className='contents' key={category.code}>
                <dt className='min-w-0 break-words text-muted-foreground'>
                  {categoryLabel(category.code)}
                </dt>
                <dd>{f(`kinds.${category.standardKind}`)}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </section>
  );
}
