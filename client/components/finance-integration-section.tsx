import { externalIntegrationsEnabled } from '../../shared/external-integrations.js';
import { useRef, useState } from 'react';
import { useApiClient, ApiClientError } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useCan,
  useAuthorizationRevision,
} from '@nocobase/app-plugin-authorization/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Skeleton } from '#components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';

interface Status {
  enabled: boolean;
  state:
    'not_sent' | 'sending' | 'accepted' | 'posted' | 'rejected' | 'unknown';
  voucherNumber: string | null;
  externalId: string | null;
  resultCode: string | null;
  updatedAt: string | null;
  busy: boolean;
}
function AvailableFinanceIntegrationSection({
  kind,
  record,
}: {
  kind: 'reimbursement' | 'payment';
  record: { id: string; status: string };
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    cache = useQueryClient();
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  const resource = { type: 'settings' as const, id: 'oa.financeIntegration' };
  const read = useCan({ resource, action: 'read' }),
    send = useCan({ resource, action: 'send' });
  const paid = ['paid', 'forcedPaid'].includes(record.status);
  const key = [
    'financeIntegration',
    session?.user.id ?? '',
    revision,
    kind,
    record.id,
  ];
  const identity = JSON.stringify(key);
  const endpoint = `financeIntegration/${kind}/${encodeURIComponent(record.id)}`;
  const query = useQuery({
    queryKey: key,
    enabled: read.can && paid,
    queryFn: async () =>
      (await api.request<{ data: Status }>({ path: endpoint })).data,
  });
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [action, setAction] = useState<{
    identity: string;
    pending: boolean;
    error?: unknown;
  }>();
  const pendingRef = useRef(false);
  const active = action?.identity === identity ? action : undefined;
  const data = query.isError ? undefined : query.data;
  async function perform(mode: 'send' | 'refresh') {
    if (pendingRef.current || !send.can || !data?.enabled) return;
    pendingRef.current = true;
    setAction({ identity, pending: true });
    try {
      const response = await api.request<{ data: Status }>({
        path: `${endpoint}/${mode}`,
        method: 'POST',
        json: {},
      });
      cache.setQueryData(key, response.data);
      setAction({ identity, pending: false });
    } catch (error) {
      setAction({ identity, pending: false, error });
    } finally {
      pendingRef.current = false;
    }
  }
  if (!read.can || !paid) return null;
  const busy = active?.pending || data?.busy;
  const conflict =
    active?.error instanceof ApiClientError &&
    active.error.reason === 'SOURCE_CHANGED';
  return (
    <section
      className='flex flex-col gap-3 rounded-lg border p-4'
      aria-label={t('financeIntegration.title')}
    >
      <h2 className='text-base font-medium'>{t('financeIntegration.title')}</h2>
      {query.isPending ? <Skeleton className='h-16' /> : null}
      {query.isError ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('financeIntegration.loadFailed')}
          </AlertDescription>
          <Button
            variant='outline'
            onClick={() => {
              void query.refetch();
            }}
          >
            {t('financeIntegration.retry')}
          </Button>
        </Alert>
      ) : null}
      {active?.error ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t(
              conflict
                ? 'financeIntegration.conflict'
                : 'financeIntegration.actionFailed',
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      {data ? (
        <>
          <p role='status'>{t(`financeIntegration.states.${data.state}`)}</p>
          {!data.enabled ? (
            <p className='text-sm text-muted-foreground'>
              {t('financeIntegration.notConfigured')}
            </p>
          ) : null}
          {data.voucherNumber ? (
            <p className='break-all text-sm'>
              {t('financeIntegration.voucher', { number: data.voucherNumber })}
            </p>
          ) : null}
          {data.resultCode ? (
            <p className='text-sm text-muted-foreground'>
              {t(`financeIntegration.results.${data.resultCode}`, {
                defaultValue: t('financeIntegration.results.other'),
              })}
            </p>
          ) : null}
          {data.state === 'unknown' || data.state === 'accepted' ? (
            <p className='text-sm text-muted-foreground'>
              {t('financeIntegration.confirmBeforeRetry')}
            </p>
          ) : null}
          <div className='flex flex-wrap gap-2'>
            <Button
              size='sm'
              variant='outline'
              disabled={!!active?.pending || query.isFetching}
              onClick={() => {
                void query.refetch();
              }}
            >
              {t('financeIntegration.reload')}
            </Button>
            {send.can && data.enabled && data.state !== 'posted' ? (
              <>
                <Button
                  size='sm'
                  variant={data.state === 'not_sent' ? 'default' : 'outline'}
                  disabled={busy}
                  onClick={() => setConfirmation(identity)}
                >
                  {t(
                    data.state === 'not_sent'
                      ? 'financeIntegration.send'
                      : 'financeIntegration.resend',
                  )}
                </Button>
                {data.state !== 'not_sent' ? (
                  <Button
                    size='sm'
                    variant='default'
                    disabled={busy}
                    onClick={() => {
                      void perform('refresh');
                    }}
                  >
                    {t('financeIntegration.lookup')}
                  </Button>
                ) : null}
              </>
            ) : null}
          </div>
          <AlertDialog
            open={confirmation === identity}
            onOpenChange={(open) => {
              if (!open) setConfirmation(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('financeIntegration.confirmTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('financeIntegration.confirmDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t('financeIntegration.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setConfirmation(null);
                    void perform('send');
                  }}
                >
                  {t('financeIntegration.confirmSend')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </section>
  );
}

export function FinanceIntegrationSection(
  props: Parameters<typeof AvailableFinanceIntegrationSection>[0],
) {
  return externalIntegrationsEnabled ? (
    <AvailableFinanceIntegrationSection {...props} />
  ) : null;
}
