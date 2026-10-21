import { useProcessText } from './text.js';
import { useEffect, useId, useRef, useState, useContext } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { createRequestKey } from '#lib/request-key';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { Spinner } from '#components/ui/spinner';
import { Button } from '#components/ui/button';
import { Textarea } from '#components/ui/textarea';
import { Label } from '#components/ui/label';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';
import { useExecution } from './execution-context.js';
import { ProcessListContext } from './resource.js';
import type { DetailDto } from '../../../server/routes/process-management/schemas.js';
export function TerminateProcess() {
  const resource = useExecution(),
    detail = resource.data?.data,
    api = useApiClient(),
    { t } = useTranslation(),
    text = useProcessText(),
    toaster = useToaster(),
    reloadList = useContext(ProcessListContext);
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [reason, setReason] = useState(''),
    [validated, setValidated] = useState(false),
    [error, setError] = useState<string>();
  const [version, setVersion] = useState<number>(),
    requestIdRef = useRef(createRequestKey()),
    activeRef = useRef(true),
    reasonRef = useRef<HTMLTextAreaElement>(null),
    id = useId();
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);
  const offer = detail?.actions.find((a) => a.action === 'terminate');
  if (!detail || !offer) return null;
  const consequence =
    detail.record.kind === 'oa.vehicleRequest'
      ? 'vehicle'
      : ['oa.leave', 'oa.leaveCancellation'].includes(detail.record.kind)
        ? 'leave'
        : [
              'oa.loan',
              'oa.payment',
              'oa.reimbursement',
              'oa.purchase',
              'oa.travel',
              'oa.travelCancellation',
              'oa.expensePlan',
              'oa.budgetAdjustment',
            ].includes(detail.record.kind)
          ? 'funding'
          : detail.record.kind === 'oa.supplies'
            ? 'stock'
            : 'ordinary';
  const label =
    detail.record.number ??
    `${text.name(detail.record.kind)} · ${detail.record.recordLabel}`;
  const path = `processManagement/executions/${encodeURIComponent(detail.record.kind)}/${encodeURIComponent(detail.record.id)}`;
  async function prepare() {
    setOpen(true);
    setBusy(true);
    setError(undefined);
    setValidated(false);
    setVersion(undefined);
    requestIdRef.current = createRequestKey();
    try {
      const result = await api.request<{ data: { version: number } }>({
        path: `${path}/managementOptions`,
        method: 'POST',
        json: { action: 'terminate' },
      });
      if (activeRef.current) setVersion(result.data.version);
    } catch (e) {
      if (activeRef.current)
        setError(
          e instanceof ApiClientError && e.status === 409
            ? 'stale'
            : 'submitFailed',
        );
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  async function submit() {
    setValidated(true);
    if (!reason.trim()) {
      reasonRef.current?.focus();
      return;
    }
    if (version === undefined || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const result = await api.request<{ data: { detail: DetailDto } }>({
        path: `${path}/managementActions`,
        method: 'POST',
        json: {
          action: 'terminate',
          reason,
          requestId: requestIdRef.current,
          expectedVersion: version,
        },
      });
      if (!activeRef.current) return;
      resource.update({ data: result.data.detail });
      reloadList();
      setOpen(false);
      toaster.show({
        type: 'success',
        title: t('processManagement.terminated', { recordLabel: label }),
      });
    } catch (e) {
      if (activeRef.current) {
        setError(
          e instanceof ApiClientError && e.status === 409
            ? 'stale'
            : e instanceof ApiClientError
              ? 'submitFailed'
              : 'unknown',
        );
        setVersion(undefined);
        resource.reload();
      }
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  return (
    <>
      <Tooltip>
        <TooltipTrigger
          render={<span tabIndex={offer.allowed ? undefined : 0} />}
        >
          <Button
            variant='destructive'
            disabled={!offer.allowed || resource.loading}
            onClick={() => void prepare()}
          >
            {t('processManagement.terminate')}
          </Button>
        </TooltipTrigger>
        {!offer.allowed && (
          <TooltipContent>
            {t(
              offer.reason === 'notConnected'
                ? 'processManagement.notConnected'
                : detail.record.kind === 'oa.vehicleRequest'
                  ? 'processManagement.vehicleTerminationGuard'
                  : 'processManagement.unavailable',
            )}
          </TooltipContent>
        )}
      </Tooltip>
      <AlertDialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('processManagement.terminateTitle', { recordLabel: label })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(`processManagement.terminationConsequences.${consequence}`)}{' '}
              {t('processManagement.terminationDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>
                {t(`processManagement.${error}`)}
              </AlertDescription>
            </Alert>
          )}
          <form
            id={`${id}-form`}
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className='flex flex-col gap-2'
          >
            <Label htmlFor={id}>{t('processManagement.reason')} *</Label>
            <Textarea
              ref={reasonRef}
              id={id}
              value={reason}
              disabled={busy}
              aria-invalid={validated && !reason.trim()}
              onChange={(event) => setReason(event.target.value)}
            />
            {validated && !reason.trim() && (
              <p className='text-sm text-destructive'>
                {t('processManagement.reasonRequired')}
              </p>
            )}
          </form>
          <AlertDialogFooter>
            {error && version === undefined && !busy ? (
              <Button variant='outline' onClick={() => void prepare()}>
                {t('processManagement.retry')}
              </Button>
            ) : null}
            <AlertDialogCancel disabled={busy}>
              {t('processManagement.cancel')}
            </AlertDialogCancel>
            <Button
              variant='destructive'
              type='submit'
              form={`${id}-form`}
              disabled={busy || version === undefined}
            >
              {busy ? <Spinner data-icon='inline-start' /> : null}
              {t('processManagement.terminate')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
