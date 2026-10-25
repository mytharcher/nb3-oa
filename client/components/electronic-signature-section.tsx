import { useRef, useState } from 'react';
import { useApiClient, ApiClientError } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useScheduleResource } from '../pages/personal-schedules/resource';
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
  timeZone: string;
  state: string;
  externalId: string | null;
  signedAt: string | null;
  archivedAt: string | null;
  signingUrl: string | null;
  resultCode: string | null;
  busy: boolean;
  canSend: boolean;
  canDownload: boolean;
}
export function ElectronicSignatureSection({
  kind,
  id,
  onComplete,
}: {
  kind: 'contract' | 'seal';
  id: string;
  onComplete?: () => void;
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    read = useCan({
      resource: { type: 'settings', id: 'oa.electronicSignatures' },
      action: 'read',
    }),
    endpoint = `electronicSignatures/${kind}/${encodeURIComponent(id)}`,
    r = useScheduleResource<{ data: Status }>(read.can ? endpoint : null),
    data = r.data?.data;
  const [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false),
    pendingRef = useRef(false);
  async function perform(mode: 'send' | 'refresh' | 'download') {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setBusy(true);
    setError(false);
    try {
      if (mode === 'download') {
        const blob = await new Response(
            await api.stream({ path: `${endpoint}/download` }),
          ).blob(),
          url = URL.createObjectURL(blob),
          a = document.createElement('a');
        a.href = url;
        a.download = `signed-${id}.pdf`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const response = await api.request<{ data: Status }>({
          path: `${endpoint}/${mode}`,
          method: 'POST',
          json: {},
        });
        r.reload();
        if (response.data.state === 'archived') onComplete?.();
      }
    } catch {
      setError(true);
    } finally {
      pendingRef.current = false;
      setBusy(false);
    }
  }
  if (!read.can) return null;
  const unavailable =
    r.error instanceof ApiClientError && r.error.status === 412;
  return (
    <section
      className='flex min-w-0 flex-col gap-3 rounded-lg border p-4'
      aria-label={t('electronicSignatures.title')}
    >
      <h2 className='text-base font-medium'>
        {t('electronicSignatures.title')}
      </h2>
      {r.loading && !data ? <Skeleton className='h-16' /> : null}
      {r.error ? (
        <Alert variant={unavailable ? 'default' : 'destructive'}>
          <AlertDescription>
            {t(
              unavailable
                ? 'electronicSignatures.notEligible'
                : 'electronicSignatures.loadFailed',
            )}
          </AlertDescription>
          {!unavailable ? (
            <Button variant='outline' onClick={r.reload}>
              {t('electronicSignatures.retry')}
            </Button>
          ) : null}
        </Alert>
      ) : null}
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('electronicSignatures.actionFailed')}
          </AlertDescription>
        </Alert>
      ) : null}
      {data ? (
        <>
          <p role='status'>{t(`electronicSignatures.states.${data.state}`)}</p>
          <p className='text-sm text-muted-foreground'>
            {t(
              data.state === 'archived'
                ? 'electronicSignatures.archivedHint'
                : data.enabled
                  ? 'electronicSignatures.hint'
                  : 'electronicSignatures.notConfigured',
            )}
          </p>
          {data.resultCode ? (
            <Alert>
              <AlertDescription>
                {t('electronicSignatures.recovery')}
              </AlertDescription>
            </Alert>
          ) : null}
          {data.externalId ? (
            <p className='break-all text-sm'>
              {t('electronicSignatures.reference', { value: data.externalId })}
            </p>
          ) : null}
          {data.signedAt ? (
            <p className='text-sm'>
              {t('electronicSignatures.signedAt', {
                at: new Intl.DateTimeFormat(i18n.language, {
                  timeZone: data.timeZone,
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(data.signedAt)),
              })}
            </p>
          ) : null}
          <div className='flex flex-wrap gap-2'>
            {data.enabled &&
            data.canSend &&
            ['not_sent', 'pending', 'unknown'].includes(data.state) ? (
              <Button
                disabled={busy || data.busy}
                onClick={() => setConfirm(true)}
              >
                {t('electronicSignatures.send')}
              </Button>
            ) : null}
            {data.enabled &&
            data.canSend &&
            !['not_sent', 'pending', 'archived'].includes(data.state) ? (
              <Button
                variant='outline'
                disabled={busy || data.busy}
                onClick={() => {
                  void perform('refresh');
                }}
              >
                {t('electronicSignatures.refresh')}
              </Button>
            ) : null}
            {data.signingUrl && ['accepted', 'signing'].includes(data.state) ? (
              <Button
                variant='outline'
                nativeButton={false}
                render={
                  <a
                    href={data.signingUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                  />
                }
              >
                {t('electronicSignatures.open')}
              </Button>
            ) : null}
            {data.canDownload ? (
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => {
                  void perform('download');
                }}
              >
                {t('electronicSignatures.download')}
              </Button>
            ) : null}
          </div>
        </>
      ) : null}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('electronicSignatures.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('electronicSignatures.confirmHint')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('electronicSignatures.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirm(false);
                void perform('send');
              }}
            >
              {t('electronicSignatures.send')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
