import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';

import type { ImportKind } from './types.js';

/**
 * Downloads a kind's template through the API client, so the session and base path apply as for every request, then
 * hands the bytes to the browser under a translated file name. A failure is an error toast (guideline I3).
 */
export function useTemplateDownload(): (kind: ImportKind) => Promise<void> {
  const api = useApiClient();
  const toaster = useToaster();
  const { t } = useTranslation();
  return async (kind) => {
    try {
      const stream = await api.stream({ path: `imports/templates/${kind}` });
      const blob = await new Response(stream).blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = t('import.templateFile', {
        kind: t(`import.kinds.${kind}`),
      });
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toaster.show({ type: 'error', title: t('import.toast.templateFailed') });
    }
  };
}
