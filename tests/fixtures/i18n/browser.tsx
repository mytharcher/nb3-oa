import { I18nRuntime } from '@nocobase/i18n';
import { I18nProvider, useLocale, useTranslation } from '@nocobase/i18n/client';
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { DatePicker } from '../../../client/components/date-picker.js';
import locales from '../../../client/locales/index.js';
import '../../../client/styles.css';

const runtime = new I18nRuntime({
  applicationNamespace: 'nb3-oa',
  defaultLocale: 'en-US',
  locales: Object.keys(locales),
});
runtime.registerApplicationNamespace('nb3-oa', locales);
await runtime.init('en-US');

export function LanguageSmoke() {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const [date, setDate] = useState<Date>();
  return (
    <main
      className='mx-auto flex max-w-xl flex-col gap-4 p-6'
      data-locale={locale}
    >
      <label htmlFor='language'>{t('actions.language')}</label>
      <select
        id='language'
        value={locale}
        onChange={(event) => {
          void runtime.changeLanguage(event.target.value);
        }}
      >
        {runtime.getLocaleDefinitions().map((item) => (
          <option key={item.locale} value={item.locale}>
            {item.label}
          </option>
        ))}
      </select>
      <h1 className='text-2xl font-semibold'>{t('workbench.title')}</h1>
      <p>{t('auth.marketingDescription')}</p>
      <DatePicker value={date} onChange={setDate} />
      <button type='button'>{t('actions.save')}</button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <I18nProvider runtime={runtime}>
    <LanguageSmoke />
  </I18nProvider>,
);
