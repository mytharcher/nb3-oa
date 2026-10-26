import { useTranslation } from '@nocobase/i18n/client';
import { Link, Navigate } from 'react-router';
import { Loading } from '#components/loading';
import { Button } from '#components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '#components/ui/alert';
import { useSystemNavigation } from '#components/system-navigation-context';
import { firstNavigationPath } from '../../routing/system-navigation.js';

/** The entry selects an authorized existing page; system pages retain their original URLs and guards. */
export default function SystemEntry() {
  const { t } = useTranslation();
  const { items, loading, failed, retry } = useSystemNavigation();
  if (loading)
    return <Loading className='h-full' label={t('status.loadingPage')} />;
  if (failed)
    return (
      <div className='p-6'>
        <Alert variant='destructive'>
          <AlertTitle>{t('status.pageFailed')}</AlertTitle>
          <AlertDescription>
            <p>{t('status.routeFailedDescription')}</p>
            <Button variant='outline' onClick={retry}>
              {t('status.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  const path = firstNavigationPath(items);
  if (path) return <Navigate to={path} replace />;
  return (
    <section className='grid h-full place-items-center p-6'>
      <div className='flex max-w-lg flex-col gap-3 text-center'>
        <h1 className='text-xl font-semibold'>{t('status.denied')}</h1>
        <p className='text-sm text-muted-foreground'>
          {t('status.deniedDescription')}
        </p>
        <Button role='link' nativeButton={false} render={<Link to='/' />}>
          {t('status.backHome')}
        </Button>
      </div>
    </section>
  );
}
