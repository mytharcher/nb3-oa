import { useEffect } from 'react';
import { Link } from 'react-router';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Database } from 'lucide-react';
import { Button } from '#components/ui/button';
import { useResource } from '../platform/shared/use-resource.js';
export function DemoBanner() {
  const { t } = useTranslation();
  const manage = useCan({
    resource: { type: 'settings', id: 'oa.demoData' },
    action: 'read',
  });
  const result = useResource<{ present: boolean; busy: boolean }>(
    'demoData/presence',
  );
  useEffect(() => {
    const timer = setInterval(result.reload, 15000);
    return () => clearInterval(timer);
  }, [result.reload]);
  if (!result.data || result.error) return null;
  return (
    <section
      className='flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4 text-sm'
      aria-label={t('demoData.title')}
    >
      <Database className='size-4 shrink-0' />
      <p className='min-w-0 flex-1'>
        {t(
          result.data.present
            ? 'demoData.presentBanner'
            : 'demoData.absentBanner',
        )}
        {!manage.can && !result.data.present
          ? ` ${t('demoData.askBanner')}`
          : ''}
      </p>
      {manage.can && (
        <Button variant='outline' render={<Link to='/demo-data' />}>
          {t(result.data.present ? 'demoData.manage' : 'demoData.importBanner')}
        </Button>
      )}
    </section>
  );
}
