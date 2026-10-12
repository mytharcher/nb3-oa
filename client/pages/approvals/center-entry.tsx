import type { AppClientRouteComponentLoader } from '@nocobase/app-client/plugins';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { createElement, type ReactNode } from 'react';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Skeleton } from '#components/ui/skeleton';

/** Home has no page grant. Preserve the child business grant and check the center grant separately. */
export function centerEntry(
  loader: AppClientRouteComponentLoader,
): AppClientRouteComponentLoader {
  return async () => {
    const module = await loader();
    const Page = module.default;
    return {
      ...module,
      default: () => createElement(CenterEntry, null, createElement(Page)),
    };
  };
}
export function CenterEntry({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const grant = useCan({
    resource: { type: 'page', id: 'oa.approvals' },
    action: 'access',
  });
  if (grant.isPending) return <Skeleton className='h-24' />;
  if (!grant.can || grant.error)
    return (
      <Alert variant='destructive'>
        <AlertDescription>{t('approvals.error.forbidden')}</AlertDescription>
      </Alert>
    );
  return children;
}
