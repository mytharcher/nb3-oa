import { UserName } from '#components/user-name';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { PaymentAttachments } from './attachments.js';
import { moneyLabel } from './money.js';
import {
  vendorName,
  type PaymentDetail,
  type PaymentOptions,
} from './types.js';

export function PaymentFacts({
  detail,
  options,
  refreshKey = 0,
}: {
  detail: PaymentDetail;
  options?: PaymentOptions;
  refreshKey?: number;
}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const orderAccess = useCan({
    resource: { type: 'composite', id: 'oa.purchase' },
    action: 'orders',
  });
  const { record } = detail;
  const f = (key: string) => t(`paymentRequests.detail.${key}`);
  const money = (cents: number | null) =>
    cents !== null && Number.isSafeInteger(cents) && cents >= 0
      ? moneyLabel(cents, i18n.language)
      : '—';
  const person = (id: string) =>
    detail.users.find((p) => p.id === id)?.name ?? t('approvals.unknownPerson');
  const method = options?.paymentMethods.find(
    (v) => v.code === record.paymentMethod,
  );
  const methodLabel =
    method?.label[i18n.language] ??
    method?.label['en-US'] ??
    record.paymentMethod;
  const order = options?.orders.find((v) => v.id === record.purchaseOrderId);
  const rows: [string, ReactNode][] = [
    [
      t('approvals.applicant'),
      <UserName
        key={t('approvals.applicant')}
        name={record.applicant?.name ?? person(record.applicantId)}
      />,
    ] as const,
    [
      f('creator'),
      <UserName
        key={f('creator')}
        name={record.creator?.name ?? person(record.createdById)}
      />,
    ] as const,
    [t('paymentRequests.reason'), record.reason || '—'],
    [
      t('paymentRequests.vendor'),
      vendorName(record) ||
        options?.vendors.find((v) => v.id === record.vendorId)?.name ||
        '—',
    ],
    [t('paymentRequests.amount'), money(record.amountCents)],
    [f('sourceMode'), t(`paymentRequests.sourceModes.${record.sourceMode}`)],
    ...(record.contractId
      ? [
          [t('paymentRequestsForm.contractId'), record.contractId] as [
            string,
            ReactNode,
          ],
          [
            t('paymentRequestsForm.contractVersion'),
            String(
              record.sourceContractVersion ?? record.contractVersion ?? '—',
            ),
          ] as [string, ReactNode],
        ]
      : []),
    [
      f('order'),
      record.purchaseOrderId && orderAccess.can ? (
        <Link
          key='source-order'
          className='text-primary underline-offset-4 hover:underline'
          to={{
            pathname: `sourceOrder/${encodeURIComponent(record.purchaseOrderId)}`,
            search: location.search,
          }}
        >
          {order?.number ?? record.purchaseOrderId}
        </Link>
      ) : (
        (order?.number ?? record.purchaseOrderId ?? '—')
      ),
    ] as const,
    [f('noPriorReason'), record.noPriorApprovalReason || '—'],
    [f('invoice'), record.invoiceNumber || '—'],
    [f('method'), methodLabel || '—'],
    [f('failure'), record.handlingFailureReason || '—'],
    [f('voucher'), record.voucherNumber || '—'],
    [f('forcedReason'), record.forcedReason || '—'],
    [
      f('paidAt'),
      record.paidAt && options?.timeZone
        ? new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: options.timeZone,
          }).format(new Date(record.paidAt))
        : '—',
    ],
  ];
  return (
    <div className='flex flex-col gap-6'>
      <p className='text-sm text-muted-foreground'>
        {t('paymentRequests.frozenHint')}
      </p>
      <dl className='grid gap-4 sm:grid-cols-[8rem_1fr]'>
        {rows.map(([label, value]) => (
          <div key={label} className='contents'>
            <dt className='text-muted-foreground'>{label}</dt>
            <dd className='min-w-0 whitespace-pre-wrap break-words'>{value}</dd>
          </div>
        ))}
      </dl>
      <section className='flex flex-col gap-4'>
        <h2 className='text-base font-medium'>{f('sourceFacts')}</h2>
        <p className='text-sm text-muted-foreground'>{f('cumulativeHint')}</p>
        <dl className='grid gap-4 sm:grid-cols-[8rem_1fr]'>
          {[
            [f('sourceApproved'), money(record.sourceApprovedCents)],
            [f('sourceCumulative'), money(record.sourceCumulativeCents)],
            [f('sourceHeld'), money(record.sourceHeldCents)],
            [
              f('fullApproval'),
              t(
                record.fullApprovalRequired
                  ? 'paymentRequests.yes'
                  : 'paymentRequests.no',
              ),
            ],
          ].map(([label, value]) => (
            <div key={label} className='contents'>
              <dt className='text-muted-foreground'>{label}</dt>
              <dd className='min-w-0 break-words tabular-nums'>{value}</dd>
            </div>
          ))}
        </dl>
        {record.ruleSnapshot ? (
          <dl className='grid gap-4 sm:grid-cols-[8rem_1fr]'>
            {Object.entries(record.ruleSnapshot)
              .filter(([key]) =>
                [
                  'spend.vp',
                  'spend.gm',
                  'sla.remindHours',
                  'sla.escalateHours',
                  'sla.urgeCooldownHours',
                ].includes(key),
              )
              .filter(
                ([, value]) =>
                  value === null ||
                  ['string', 'number', 'boolean'].includes(typeof value),
              )
              .map(([key, value]) => (
                <div key={key} className='contents'>
                  <dt className='min-w-0 break-words text-muted-foreground'>
                    {t(`paymentRequests.rules.${key.replaceAll('.', '_')}`)}
                  </dt>
                  <dd className='min-w-0 break-words'>
                    {value === null
                      ? '—'
                      : typeof value === 'boolean'
                        ? t(
                            value
                              ? 'paymentRequests.yes'
                              : 'paymentRequests.no',
                          )
                        : typeof value === 'string' || typeof value === 'number'
                          ? String(value)
                          : '—'}
                  </dd>
                </div>
              ))}
          </dl>
        ) : (
          <p className='text-sm text-muted-foreground'>{f('notSubmitted')}</p>
        )}
      </section>
      <section className='flex flex-col gap-4'>
        <h2 className='text-base font-medium'>{f('attachments')}</h2>
        <PaymentAttachments
          recordId={record.id}
          ids={record.attachments}
          purpose='invoice'
          refreshKey={refreshKey}
        />
      </section>
      <section className='flex flex-col gap-4'>
        <h2 className='text-base font-medium'>{f('voucherAttachments')}</h2>
        <PaymentAttachments
          recordId={record.id}
          ids={record.voucherAttachments}
          purpose='voucher'
          refreshKey={refreshKey}
        />
      </section>
    </div>
  );
}
