import { useEffect, useRef, useState } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useAuthorizationRevision,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Dialog, DialogTitle, DialogDescription } from '#components/ui/dialog';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { ReimbursementAttachments } from './attachments.js';
import { moneyLabel } from './money.js';
export interface RecognizedInvoice {
  number: string;
  date: string;
  amountCents: number;
}
interface Result {
  enabled: boolean;
  state: string;
  busy: boolean;
  receivedAt: string | null;
  result: {
    state: string;
    facts?: RecognizedInvoice;
    reference?: string;
    checkedAt?: string;
  } | null;
}
export function InvoiceTools({
  recordId,
  lineId,
  fileIds,
  version,
  operation,
  disabled = false,
  canOperate = true,
  onApply,
  current,
}: {
  recordId: string;
  lineId: string;
  fileIds: readonly string[];
  version: string;
  operation: 'recognize' | 'verify';
  disabled?: boolean;
  canOperate?: boolean;
  onApply?: (facts: RecognizedInvoice) => void;
  current?: Partial<RecognizedInvoice>;
}) {
  const api = useApiClient(),
    { t, i18n } = useTranslation(),
    { session } = useAuthentication(),
    revision = useAuthorizationRevision();
  const can =
    useCan({
      resource: { type: 'settings', id: 'oa.invoiceRecognition' },
      action: operation,
    }).can && canOperate;
  const readable = useCan({
    resource: { type: 'settings', id: 'oa.invoiceRecognition' },
    action: 'read',
  }).can;
  const visible = operation === 'verify' ? readable : can;
  const identity = JSON.stringify([
    session?.user.id,
    revision,
    recordId,
    lineId,
    fileIds,
    operation,
  ]);
  const [value, setValue] = useState<{
    identity: string;
    version: string;
    fileId: string;
    data?: Result;
    error?: boolean;
    pending?: boolean;
  }>();
  const [open, setOpen] = useState(false),
    pendingRef = useRef(false);
  const generationRef = useRef(0);
  const active = value?.identity === identity ? value : undefined,
    changed = !!active && active.version !== version;
  const firstFile = fileIds[0];
  useEffect(() => {
    if (operation !== 'verify' || !visible || !firstFile) return;
    const controller = new AbortController();
    const generation = ++generationRef.current;
    api
      .request<{ data: Result }>({
        path: `invoiceRecognition/${encodeURIComponent(recordId)}/${encodeURIComponent(lineId)}/${encodeURIComponent(firstFile)}/verify`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (
            !controller.signal.aborted &&
            generation === generationRef.current &&
            !pendingRef.current
          )
            setValue({ identity, version, fileId: firstFile, data });
        },
        () => {
          if (
            !controller.signal.aborted &&
            generation === generationRef.current &&
            !pendingRef.current
          )
            setValue({ identity, version, fileId: firstFile, error: true });
        },
      );
    return () => controller.abort();
  }, [api, visible, firstFile, identity, lineId, operation, recordId, version]);
  async function run(fileId: string, refresh = false, read = false) {
    if (pendingRef.current || disabled || (read ? !readable : !can)) return;
    generationRef.current++;
    pendingRef.current = true;
    setValue({ identity, version, fileId, pending: true });
    try {
      const { data } = await api.request<{ data: Result }>({
        path: `invoiceRecognition/${encodeURIComponent(recordId)}/${encodeURIComponent(lineId)}/${encodeURIComponent(fileId)}/${operation}${refresh ? '/refresh' : ''}`,
        method: read ? 'GET' : 'POST',
        ...(read ? {} : { json: {} }),
      });
      setValue({ identity, version, fileId, data });
      if (operation === 'recognize' && data.result?.facts) setOpen(true);
    } catch {
      setValue({ identity, version, fileId, error: true });
    } finally {
      pendingRef.current = false;
    }
  }
  if (!visible || !fileIds.length) return null;
  const f = (key: string) => t(`invoiceRecognition.${key}`);
  return (
    <section aria-label={f('title')} className='flex flex-col gap-2'>
      <div className='flex flex-wrap gap-2'>
        {can &&
          fileIds.map((id, index) => (
            <Button
              key={id}
              type='button'
              size='sm'
              variant='outline'
              disabled={
                disabled ||
                active?.pending ||
                active?.data?.busy ||
                active?.data?.enabled === false
              }
              onClick={() => void run(id)}
            >
              {t(`invoiceRecognition.${operation}Attachment`, {
                index: index + 1,
              })}
            </Button>
          ))}
      </div>
      {active?.data?.enabled === false ? (
        <p className='text-sm text-muted-foreground'>{f('notConfigured')}</p>
      ) : null}
      {active?.pending ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {f('processing')}
        </p>
      ) : null}
      {active?.error ? (
        <Alert variant='destructive'>
          <AlertDescription>{f('failed')}</AlertDescription>
        </Alert>
      ) : null}
      {changed ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {f('changed')}
        </p>
      ) : active?.data ? (
        <p role='status' className='text-sm'>
          {t(`invoiceRecognition.states.${active.data.state}`, {
            defaultValue: f('unconfirmed'),
          })}
        </p>
      ) : null}
      {active?.data ? (
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={disabled || active.pending}
          onClick={() => void run(active.fileId, false, true)}
        >
          {f('reload')}
        </Button>
      ) : null}
      {active?.data?.receivedAt && !changed ? (
        <p className='text-xs text-muted-foreground'>
          {t('invoiceRecognition.receivedAt', {
            time: new Date(active.data.receivedAt).toLocaleString(
              i18n.language,
            ),
          })}
        </p>
      ) : null}
      {can && active?.data?.state === 'unknown' && !changed ? (
        <Button
          type='button'
          size='sm'
          variant='outline'
          disabled={disabled || active.pending}
          onClick={() => void run(active.fileId, true)}
        >
          {f('recover')}
        </Button>
      ) : null}
      {active?.data?.result?.reference && !changed ? (
        <p className='break-all text-sm text-muted-foreground'>
          {t('invoiceRecognition.reference', {
            reference: active.data.result.reference,
          })}
        </p>
      ) : null}
      <Dialog
        open={open && !!active && can && !disabled}
        onOpenChange={setOpen}
      >
        <FormDrawerContent>
          <FormDrawerHeader>
            <DialogTitle>{f('confirmTitle')}</DialogTitle>
            <DialogDescription>{f('confirmDescription')}</DialogDescription>
          </FormDrawerHeader>
          <FormDrawerBody>
            {active ? (
              <ReimbursementAttachments
                recordId={recordId}
                ids={[active.fileId]}
              />
            ) : null}
            {active?.data?.result?.facts ? (
              <dl className='grid grid-cols-2 gap-3'>
                <dt>{f('number')}</dt>
                <dd className='break-all'>{active.data.result.facts.number}</dd>
                <dt>{f('date')}</dt>
                <dd>{active.data.result.facts.date}</dd>
                <dt>{f('amount')}</dt>
                <dd>
                  {moneyLabel(
                    active.data.result.facts.amountCents,
                    i18n.language,
                  )}
                </dd>
              </dl>
            ) : null}
            {current ? (
              <div className='rounded-md border p-3 text-sm'>
                <p className='mb-2 font-medium'>{f('currentValues')}</p>
                <dl className='grid grid-cols-2 gap-2'>
                  <dt>{f('number')}</dt>
                  <dd className='break-all'>{current.number || '—'}</dd>
                  <dt>{f('date')}</dt>
                  <dd>{current.date || '—'}</dd>
                  <dt>{f('amount')}</dt>
                  <dd>
                    {current.amountCents === undefined
                      ? '—'
                      : moneyLabel(current.amountCents, i18n.language)}
                  </dd>
                </dl>
              </div>
            ) : null}
            {changed ? (
              <Alert variant='destructive'>
                <AlertDescription>{f('changed')}</AlertDescription>
              </Alert>
            ) : null}
          </FormDrawerBody>
          <FormDrawerFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
            >
              {f('cancel')}
            </Button>
            <Button
              type='button'
              disabled={changed || !active?.data?.result?.facts || disabled}
              onClick={() => {
                const facts = active?.data?.result?.facts;
                if (facts && !changed && can && !disabled) {
                  onApply?.(facts);
                  setOpen(false);
                }
              }}
            >
              {f('apply')}
            </Button>
          </FormDrawerFooter>
        </FormDrawerContent>
      </Dialog>
    </section>
  );
}
