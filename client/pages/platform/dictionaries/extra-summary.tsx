import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { TruncatedText } from '../shared/truncated-text.js';
import type { DictionaryExtraField } from '../shared/types.js';

/**
 * An entry's attributes as one line of text: a true flag by its name, a number as "name: value", an empty nullable
 * number as "name: no limit". Every attribute name needs `platform.dictionaries.extra.<name>` in the locales.
 */
export function ExtraSummary({
  fields,
  extra,
}: {
  readonly fields: readonly DictionaryExtraField[];
  readonly extra: Record<string, unknown> | null;
}): ReactElement {
  const { t } = useTranslation();
  const parts = fields.flatMap((field) => {
    const value = extra?.[field.name];
    const name = t(`platform.dictionaries.extra.${field.name}`);
    if (field.type === 'boolean') return value === true ? [name] : [];
    if (value === null || value === undefined)
      return field.nullable
        ? [t('platform.dictionaries.extraUnlimited', { name })]
        : [];
    return [
      t('platform.dictionaries.extraValue', {
        name,
        value:
          typeof value === 'number' ? String(value) : JSON.stringify(value),
      }),
    ];
  });
  if (parts.length === 0)
    return <span className='text-muted-foreground'>—</span>;
  return <TruncatedText text={parts.join(' · ')} className='max-w-80' />;
}
