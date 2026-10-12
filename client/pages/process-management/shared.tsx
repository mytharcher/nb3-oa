import { useProcessText } from './text.js';
import { useTranslation } from '@nocobase/i18n/client';
import { ApiClientError } from '@nocobase/app-client';
import { RefreshCw, Workflow } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
  EmptyContent,
} from '#components/ui/empty';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Badge } from '#components/ui/badge';
export function State({ value }: { value: string }) {
  const text = useProcessText();
  return <Badge variant='outline'>{text.state(value)}</Badge>;
}
export function Refresh({
  busy,
  onClick,
}: {
  busy: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={t('processManagement.refresh')}
            variant='outline'
            size='icon'
            disabled={busy}
            onClick={onClick}
          />
        }
      >
        <RefreshCw className={busy ? 'animate-spin' : undefined} />
      </TooltipTrigger>
      <TooltipContent>{t('processManagement.refresh')}</TooltipContent>
    </Tooltip>
  );
}
export function Failure({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  const { t } = useTranslation();
  if (error instanceof ApiClientError && error.status === 401)
    return <SessionExpiredAlert />;
  const status = error instanceof ApiClientError ? error.status : 0;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        {t(
          status === 403
            ? 'processManagement.forbidden'
            : status === 404
              ? 'processManagement.gone'
              : status === 409
                ? 'processManagement.stale'
                : 'processManagement.loadFailed',
        )}
        {![403, 404].includes(status) && (
          <Button variant='outline' onClick={retry}>
            {t('processManagement.retry')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
export function EmptyList({
  filtered,
  definitions,
  onClear,
}: {
  filtered: boolean;
  definitions: boolean;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Empty className='min-h-48 border border-dashed'>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <Workflow />
        </EmptyMedia>
        <EmptyTitle>
          {t(
            filtered
              ? 'processManagement.noResults'
              : definitions
                ? 'processManagement.noDefinitions'
                : 'processManagement.empty',
          )}
        </EmptyTitle>
        <EmptyDescription>
          {t(
            filtered
              ? 'processManagement.noResultsDescription'
              : definitions
                ? 'processManagement.noDefinitionsDescription'
                : 'processManagement.emptyDescription',
          )}
        </EmptyDescription>
      </EmptyHeader>
      {filtered && (
        <EmptyContent>
          <Button variant='outline' onClick={onClear}>
            {t('processManagement.clear')}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
