import { useTranslation } from '@nocobase/i18n/client';
import { StatusBadge } from '#components/status-badge';
import type { RequestRecord } from './types.js';
import { Photos } from './photos.js';
export function Facts({
  record,
  timeZone,
}: {
  record: RequestRecord;
  timeZone: string;
}) {
  const { t, i18n } = useTranslation();
  const fields = [
    'operation',
    'category',
    'quantity',
    'purpose',
    'borrowDueDate',
    'scrapReason',
    'appraisalOpinion',
    'handlingReason',
    'exceptionReason',
  ] as const;
  return (
    <>
      <dl className='grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr]'>
        {fields.map((key) => (
          <div className='contents' key={key}>
            <dt className='text-sm text-muted-foreground'>
              {t(
                `assetRequests.${key === 'operation' ? 'operationLabel' : key}`,
              )}
            </dt>
            <dd className='whitespace-pre-wrap break-words text-sm'>
              {!Object.hasOwn(record, key) ||
              record[key] === null ||
              record[key] === '' ? (
                '—'
              ) : key === 'operation' ? (
                <StatusBadge tone='neutral'>
                  {t(`assetRequests.operations.${record.operation}`)}
                </StatusBadge>
              ) : key === 'quantity' ? (
                new Intl.NumberFormat(i18n.language).format(record.quantity!)
              ) : key === 'borrowDueDate' ? (
                new Intl.DateTimeFormat(i18n.language, {
                  timeZone: 'UTC',
                  dateStyle: 'medium',
                }).format(new Date(`${record.borrowDueDate}T00:00:00Z`))
              ) : (
                record[key]
              )}
            </dd>
          </div>
        ))}
      </dl>
      {Array.isArray(record.allocation) ? (
        <section className='flex flex-col gap-4'>
          <h2 className='text-base font-medium'>
            {t('assetRequests.allocation')}
          </h2>
          <ul className='flex flex-col gap-2'>
            {record.allocation.map((a) => (
              <li key={a.id} className='text-sm'>
                {a.code ?? '—'} · {a.serialNumber ?? '—'}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {record.id && Object.hasOwn(record, 'photos') ? (
        <section className='flex flex-col gap-4'>
          <h2 className='text-base font-medium'>{t('assetRequests.photos')}</h2>
          <Photos requestId={record.id} ids={record.photos ?? []} />
        </section>
      ) : null}
      <p className='text-xs text-muted-foreground'>
        {t('assetRequests.companyTimeZone', { timeZone })}
      </p>
    </>
  );
}
