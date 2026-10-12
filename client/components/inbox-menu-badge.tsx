import {
  useInboxRefresh,
  useInboxUnreadCount,
} from '@nocobase/app-plugin-notification-in-app/client/inbox';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { useSidebar } from '#components/ui/sidebar';

/** Keeps the unread count live even while the viewer is outside the inbox. */
export function InboxMenuBadge(): ReactElement | null {
  const { t } = useTranslation();
  const { state, isMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;
  // Event-driven invalidation on inbox changes, reconnect and focus; no polling.
  useInboxRefresh();
  const unread = useInboxUnreadCount();
  const count = unread.data ?? 0;
  if (unread.isError || count <= 0) return null;

  return (
    <span
      role='status'
      aria-label={t('inbox.unreadCount', { count })}
      className={`pointer-events-none absolute rounded-full bg-primary ${collapsed ? 'top-0.5 right-0.5 size-2' : 'top-1/2 right-2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center px-1 text-xs font-medium text-primary-foreground tabular-nums'}`}
    >
      {collapsed ? null : count > 99 ? '99+' : count}
    </span>
  );
}
