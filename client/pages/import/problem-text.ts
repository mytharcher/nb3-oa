import { useTranslation } from '@nocobase/i18n/client';

import { PROBLEM_CODES, type ImportRowError } from './types.js';

/** The sentence of one problem, from its code; an unknown code (a newer server) still reads sensibly. */
export function useProblemText(): (error: ImportRowError) => string {
  const { t } = useTranslation();
  return (error) =>
    (PROBLEM_CODES as readonly string[]).includes(error.code)
      ? t(`import.errors.${error.code}`, {
          value: error.value ?? '',
          header: error.header ?? '',
          ...error.params,
        })
      : t('import.errors.unknown');
}
