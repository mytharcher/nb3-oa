import { useTranslation } from '@nocobase/i18n/client';
import type { SupplyRecord } from './types.js';
export function SupplyItems({ record }: { record: SupplyRecord }) {
  const { t, i18n } = useTranslation();
  return (
    <div className='flex flex-col gap-4'>
      {record.items.map((item) => {
        const label = record.itemSnapshot?.[item.code]?.label;
        return (
          <section
            key={item.code}
            className='flex flex-col gap-3 rounded-md border p-4'
          >
            <h3 className='break-words text-sm font-medium'>
              {label?.[i18n.language] ??
                label?.['zh-CN'] ??
                label?.['en-US'] ??
                item.code}{' '}
              · {t('supplies.quantityValue', { quantity: item.quantity })}
            </h3>
            {item.printInfo ? (
              <dl className='grid gap-2 text-sm sm:grid-cols-2'>
                {Object.entries(item.printInfo).map(([key, value]) => (
                  <div key={key}>
                    <dt className='text-muted-foreground'>
                      {t(`supplies.print.${key}`)}
                    </dt>
                    <dd className='whitespace-pre-wrap break-words'>
                      {value || '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
