import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { Alert, AlertDescription } from '#components/ui/alert';
import type { ReactElement, ReactNode } from 'react';

import { useAuthorizationTranslation } from '../i18n.js';
import { Button } from '#components/ui/button';
import { Card } from '#components/ui/card';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';

/** The chrome every Authorization settings page renders inside. */
export function PermissionsPage({
  title,
  description,
  fill = false,
  children,
}: {
  title: string;
  description: string;
  /**
   * Fill the host's scroll viewport on large screens so a page with its own
   * scroll regions does not also scroll the page around them. Below the floor
   * the whole page grows and the host scrolls it once, rather than squeezing
   * the content past the page padding.
   */
  fill?: boolean;
  children: ReactNode;
}): ReactElement {
  return (
    <PageContainer
      className={
        fill ? 'lg:flex lg:h-full lg:min-h-[36rem] lg:flex-col' : undefined
      }
    >
      <PageHeader title={title} description={description} />
      {children}
    </PageContainer>
  );
}

export function PageLoading(): ReactElement {
  return <ApplicationTableSkeleton />;
}

export function PageError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}): ReactElement {
  const t = useAuthorizationTranslation();
  return (
    <Alert variant='destructive'>
      <div className='flex flex-col gap-3'>
        <AlertDescription>{message ?? t('page.loadFailed')}</AlertDescription>
        {onRetry ? (
          <Button onClick={onRetry} variant='outline'>
            {t('common.retry')}
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}

/** The refusal the page itself produces, in the same card shape as an error. */
export function PageForbidden({ message }: { message: string }): ReactElement {
  return (
    <Card className='grid min-h-64 place-items-center p-6 text-center'>
      <p className='max-w-prose text-sm text-muted-foreground'>{message}</p>
    </Card>
  );
}
