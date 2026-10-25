import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useAuthorizationRevision,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { createTaskCenterDataSource } from '@nocobase/app-plugin-task-center/client';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@nocobase/i18n/client';
import { PERSONAL_WORK_REFRESH } from '#lib/personal-work-refresh';
import { MenuCountBadge } from './inbox-menu-badge.js';

// Match the center's actionable/read-required sources; applicant tracking is not pending work.
const sources = [
  'approval.task',
  'approval.cc',
  'oa.workItem',
  'oa.announcementReceipt',
] as const;

/** Use the existing personal task statistics, mounted only beside the authorized menu entry. */
export function TaskCenterMenuBadge() {
  const { t } = useTranslation();
  const { session } = useAuthentication();
  const api = useApiClient();
  const revision = useAuthorizationRevision();
  const page = useCan({
    resource: { type: 'page', id: 'oa.approvals' },
    action: 'access',
  });
  const location = useLocation();
  const enabled = !!session && page.can && !page.isPending && !page.error;
  const tasks = useQuery({
    queryKey: ['oa-personal-attention', session?.user.id, revision],
    enabled,
    queryFn: async () => {
      const source = createTaskCenterDataSource(api);
      const rows = await Promise.all(
        sources.map(async (key) => (await source.statistics(key)).pending),
      );
      return rows.reduce((sum, count) => sum + count, 0);
    },
  });
  const { refetch } = tasks;
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      void refetch();
    };
    window.addEventListener(PERSONAL_WORK_REFRESH, refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener(PERSONAL_WORK_REFRESH, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [enabled, refetch]);
  // Route changes re-read server facts; the initial fetch belongs to useQuery itself.
  const { pathname } = location;
  const seenPathRef = useRef(pathname);
  useEffect(() => {
    if (seenPathRef.current === pathname) return;
    seenPathRef.current = pathname;
    if (enabled) void refetch();
  }, [pathname, enabled, refetch]);
  if (!enabled) return null;
  // A failed count is unknown, never zero.
  const count = tasks.isError ? undefined : tasks.isPending ? 0 : tasks.data;
  return (
    <MenuCountBadge
      value={count}
      label={
        tasks.isError
          ? t('taskCenter.attention.pendingUnknown')
          : t('taskCenter.attention.pendingCount', { count: count ?? 0 })
      }
    />
  );
}
