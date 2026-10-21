import { UserNameText } from '#components/user-name';
import { UserName } from '#components/user-name';
import { PurchaseAttachments } from './attachments.js';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Link } from 'react-router';
import { Alert, AlertDescription } from '#components/ui/alert';
import { useResource } from '../approvals/use-resource.js';
import { amountText } from './money.js';
import { subjectLabel, type PurchaseOptions } from './options.js';
import { ErrorState } from './states.js';
import type { PurchaseDetail, PurchaseRecord } from './types.js';
export function PurchaseFacts({
  record,
  applicant,
  detail,
  focusable = false,
  orderHref,
}: {
  record: PurchaseRecord;
  applicant: string;
  detail?: PurchaseDetail;
  focusable?: boolean;
  orderHref?: string;
}) {
  const { t, i18n } = useTranslation(),
    options = useResource<PurchaseOptions>('purchaseRequests/options');
  const ordersPermission = useCan({
    resource: { type: 'composite', id: 'oa.purchase' },
    action: 'orders',
  });
  const date = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${value}T12:00:00Z`));
  const vendor = (id: string | null) =>
    id
      ? detail?.order?.vendor.id === id
        ? detail.order.vendor.name
        : (options.data?.vendors.find((v) => v.id === id)?.name ??
          t('purchases.vendorUnavailable'))
      : '—';
  const values = [
    [
      t('approvals.applicant'),
      <UserName key={t('approvals.applicant')} name={applicant} />,
    ] as const,
    [
      t('purchases.department'),
      detail?.department?.title ??
        t(
          record.departmentId
            ? 'purchases.departmentUnavailable'
            : 'purchases.departmentPending',
        ),
    ],
    [
      t('purchases.budgetYear'),
      record.year?.toString() ?? t('purchases.departmentPending'),
    ],
    [
      t('purchases.subject'),
      subjectLabel(
        options.data?.subjects.find((s) => s.code === record.subject),
        record.subject,
        i18n.language,
      ),
    ],
    [
      t('purchases.estimated'),
      `${amountText(record.estimatedCents)} ${t('purchases.yuan')}`,
    ],
    [
      t('purchases.actual'),
      record.actualCents === null
        ? '—'
        : `${amountText(record.actualCents)} ${t('purchases.yuan')}`,
    ],
    [t('purchases.expectedDate'), date(record.expectedDate)],
    [t('purchases.suggestedVendor'), vendor(record.suggestedVendorId)],
    [t('purchases.selectedVendor'), vendor(record.selectedVendorId)],
    [t('purchases.purpose'), record.purpose],
    [
      t('purchases.handler'),
      <UserName
        key={t('purchases.handler')}
        name={
          detail?.users.find((u) => u.id === record.handlingActorId)?.name ??
          '—'
        }
      />,
    ] as const,
  ];
  return (
    <div className='flex flex-col gap-4'>
      {options.error ? (
        <ErrorState error={options.error} retry={options.reload} />
      ) : null}
      <dl className='grid gap-3 sm:grid-cols-[8rem_1fr]'>
        {values.map(([key, value]) => (
          <div key={key} className='contents'>
            <dt className='text-muted-foreground'>{key}</dt>
            <dd
              id={
                focusable && key === t('purchases.estimated')
                  ? 'purchases-amount-fact'
                  : undefined
              }
              tabIndex={
                focusable && key === t('purchases.estimated') ? -1 : undefined
              }
              className='min-w-0 whitespace-pre-wrap break-words'
            >
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <section className='flex flex-col gap-3'>
        <h2 className='text-base font-medium'>{t('purchases.items')}</h2>
        {record.items.map((item, index) => (
          <div
            key={item.id}
            className='rounded-md border border-border p-4 text-sm'
          >
            <p className='font-medium break-words'>
              {index + 1}. {item.name}
            </p>
            <p className='mt-2 whitespace-pre-wrap break-words'>
              {item.specification || '—'}
            </p>
            <p className='mt-2 break-words'>
              {item.quantity} {item.unit}
            </p>
          </div>
        ))}
      </section>
      {record.quotes.length ? (
        <section className='flex flex-col gap-3'>
          <h2 className='text-base font-medium'>{t('purchases.quotes')}</h2>
          {record.quotes.map((q) => (
            <div
              key={q.vendorId}
              className='rounded-md border border-border p-4 text-sm'
            >
              <p className='font-medium break-words'>{vendor(q.vendorId)}</p>
              <PurchaseAttachments
                purchaseId={record.id}
                ids={q.attachmentIds}
              />
            </div>
          ))}
        </section>
      ) : null}
      {record.priceConfirmationRequired ? (
        <Alert>
          <AlertDescription>{t('purchases.confirmPriceHint')}</AlertDescription>
        </Alert>
      ) : null}
      {record.handlingFailureReason ? (
        <Alert>
          <AlertDescription>
            <strong>{t('purchases.states.exception')}</strong>
            <p className='mt-2 whitespace-pre-wrap break-words'>
              {record.handlingFailureReason}
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
      {record.status === 'forcedClosed' ? (
        <Alert>
          <AlertDescription>{t('purchases.forcedClosedHint')}</AlertDescription>
        </Alert>
      ) : null}
      {record.ruleSnapshot ? (
        <div className='rounded-md border p-4'>
          <p className='text-sm font-medium'>{t('purchases.frozenRules')}</p>
          <dl className='mt-3 grid gap-3 sm:grid-cols-3'>
            {(['purchase.quotes', 'spend.vp', 'spend.gm'] as const).map(
              (key) => (
                <div key={key}>
                  <dt className='text-sm text-muted-foreground'>
                    {t(`purchases.ruleLabels.${key.replace('.', '_')}`)}
                  </dt>
                  <dd className='mt-1 text-sm'>
                    {typeof record.ruleSnapshot?.[key] === 'number'
                      ? String(record.ruleSnapshot[key])
                      : '—'}{' '}
                    {t('purchases.yuan')}
                  </dd>
                </div>
              ),
            )}
          </dl>
          <p className='mt-3 text-sm text-muted-foreground'>
            {t('purchases.frozenRulesHint')}
          </p>
        </div>
      ) : null}
      {record.heldAccount ? (
        <div className='rounded-md border border-border p-4 text-sm'>
          <p className='font-medium'>{t('purchases.actualHold')}</p>
          <p className='mt-2'>
            {record.heldAccount.year} · {amountText(record.heldCents)}{' '}
            {t('purchases.yuan')}
          </p>
          <p className='mt-2 text-muted-foreground'>
            {t('purchases.holdHint')}
          </p>
        </div>
      ) : null}
      {detail?.order ? (
        <div className='rounded-md border border-border p-4 text-sm'>
          <p className='font-medium'>{t('purchases.order')}</p>
          <p className='mt-2'>
            {detail.order.number} · {detail.order.vendor.name} ·{' '}
            {amountText(detail.order.actualCents)} {t('purchases.yuan')}
          </p>
          <p className='mt-2 text-muted-foreground'>
            {t('purchases.orderHint')}
          </p>
          {ordersPermission.can && orderHref ? (
            <Link
              to={orderHref}
              className='mt-2 inline-block underline underline-offset-4'
            >
              {t('purchases.openOrder')}
            </Link>
          ) : null}
        </div>
      ) : null}
      {record.gmMerged ? (
        <Alert>
          <AlertDescription>
            <strong>{t('purchases.mergedTitle')}</strong>
            <p className='mt-2'>
              <UserNameText
                text={t('purchases.merged', {
                  name:
                    detail?.users.find(
                      (u) => u.id === record.gmMerged?.personId,
                    )?.name ?? t('approvals.unknownPerson'),
                })}
                name={
                  detail?.users.find((u) => u.id === record.gmMerged?.personId)
                    ?.name ?? t('approvals.unknownPerson')
                }
              />
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
