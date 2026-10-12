import {
  titleText,
  type Translate,
} from '#pages/administration/authorization/management';
import { useTranslation } from '@nocobase/i18n/client';
import { useCallback } from 'react';

import type { DutyRoleTitle } from './types.js';

/** A seeded role's title is a translation descriptor; a renamed one is plain text. */
export function useRoleTitle(): (title: DutyRoleTitle) => string {
  const { t } = useTranslation();
  return useCallback(
    // The application's `t` takes the descriptor's `ns` option, which is all `titleText` passes.
    (title: DutyRoleTitle) => titleText(title, t as unknown as Translate),
    [t],
  );
}
