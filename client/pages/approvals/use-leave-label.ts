import { useTranslation } from '@nocobase/i18n/client';
import { useResource } from './use-resource.js';
import type { LeaveOptions } from './types.js';
/** Labels come from the business dictionary, including administrator-defined leave types. */
export function useLeaveLabel() {
  const { t, i18n } = useTranslation();
  const options = useResource<LeaveOptions>('leaveRequests/options');
  return (code: string) => {
    const entry = options.data?.leaveTypes?.find((v) => v.code === code);
    return (
      entry?.label[i18n.language] ??
      entry?.label['zh-CN'] ??
      entry?.label['en-US'] ??
      t('approvals.typeUnavailable')
    );
  };
}
