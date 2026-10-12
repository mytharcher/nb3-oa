import { useRequestFormSubmission } from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '#components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { useSearchParams } from 'react-router';
import type { TravelRecord } from '../travel/types.js';

import { fieldViolationsOf } from '../platform/shared/errors.js';
import { Button } from '#components/ui/button';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '#components/ui/field';

import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { useResource } from '../approvals/use-resource.js';
import { createRequestId } from '../approvals/request-id.js';
import { ErrorState } from './states.js';
import type {
  TravelCancellationDetail,
  TravelCancellationRecord,
  SourceContext,
  DetailContext,
} from './types.js';

export default function TravelCancellationFormDialog() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const parentReload = parent.reload;
  const resource = useResource<TravelCancellationDetail>(
    requestId ? `travelCancellations/${encodeURIComponent(requestId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const [discard, setDiscard] = useState(false);
  const resolveCloseRef = useRef<((allowed: boolean) => void) | null>(null);
  const [done, setDone] = useState(false);
  const canSubmit = useCan({
    resource: { type: 'composite', id: 'oa.travelCancellation' },
    action: 'submit',
  }).can;
  const canDelegate = useCan({
    resource: { type: 'composite', id: 'oa.travelCancellation' },
    action: 'delegate',
  }).can;
  const allowed = requestId
    ? resource.data?.view.available.some((a) => a.name === 'edit' && a.allowed)
    : canSubmit || canDelegate;
  useEffect(() => {
    if (
      resource.error instanceof ApiClientError &&
      resource.error.status === 404
    )
      parentReload();
  }, [resource.error, parentReload]);
  return (
    <RouteDrawer
      printable
      className='text-sm sm:max-w-2xl'
      title={t(
        requestId ? 'travelCancellation.edit' : 'travelCancellation.new',
      )}
      description={t('travelCancellation.formDescription')}
      beforeClose={() => {
        if (busyRef.current) return false;
        if (!dirtyRef.current) return true;
        setDiscard(true);
        return new Promise<boolean>((resolve) => {
          resolveCloseRef.current = resolve;
        });
      }}
      footer={
        <FormFooter
          revision={resource.data?.record.status === 'revision'}
          busy={busy}
          disabled={
            done || !ready || !allowed || resource.loading || !!resource.error
          }
        />
      }
    >
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : requestId && !resource.data ? (
        <FieldsSkeleton fields={4} />
      ) : (
        <TravelCancellationForm
          key={
            resource.data
              ? `${resource.data.record.id}:${resource.data.record.lifecycleVersion}`
              : 'new'
          }
          onReady={setReady}
          detail={resource.data}
          allowed={!!allowed}
          reload={resource.reload}
          onBusy={(value) => {
            busyRef.current = value;
            setBusy(value);
          }}
          onDirty={(value) => {
            dirtyRef.current = value;
          }}
          onDone={() => setDone(true)}
        />
      )}
      <AlertDialog
        open={discard}
        onOpenChange={(open) => {
          if (!open) {
            setDiscard(false);
            resolveCloseRef.current?.(false);
            resolveCloseRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('approvals.discard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('approvals.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('approvals.cancel')}</AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={() => {
                dirtyRef.current = false;
                setDiscard(false);
                resolveCloseRef.current?.(true);
                resolveCloseRef.current = null;
              }}
            >
              {t('approvals.discardConfirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteDrawer>
  );
}
function FormFooter({
  busy,
  disabled,
  revision,
}: {
  busy: boolean;
  disabled: boolean;
  revision?: boolean;
}) {
  const { close } = useRouteOverlay();
  const { t } = useTranslation();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('approvals.cancel')}
      </Button>
      <RequestFormButtons
        revision={revision}
        resource='oa.travelCancellation'
        form='travel-cancellation-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
function TravelCancellationForm({
  detail,
  allowed,
  reload,
  onBusy,
  onDirty,
  onDone,
  onReady,
}: {
  detail?: TravelCancellationDetail;
  allowed: boolean;
  reload: () => void;
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
  onDone: () => void;
  onReady: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { session } = useAuthentication();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const delegate = useCan({
    resource: { type: 'composite', id: 'oa.travelCancellation' },
    action: 'delegate',
  }).can;
  const [query] = useSearchParams();
  const options = useResource<TravelRecord[]>('travelRequests?view=mine');
  useEffect(
    () => onReady(!!options.data && !options.error && !options.loading),
    [options.data, options.error, options.loading, onReady],
  );
  const [error, setError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const runningRef = useRef(false);
  const attemptRef = useRef<{ key: string; requestId: string } | null>(null);
  const submission = useRequestFormSubmission<TravelCancellationRecord>({
    resource: 'travelCancellations',
  });
  const schema = useMemo(
    () =>
      z.object({
        applicantId: z.string(),
        sourceId: z.string().min(1, t('approvals.required')),
        reason: z
          .string()
          .trim()
          .min(1, t('approvals.required'))
          .max(10000, t('approvals.limit')),
      }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      applicantId: '',
      sourceId: detail?.record.sourceId ?? query.get('sourceId') ?? '',
      reason: detail?.record.reason ?? '',
    },
  });
  useEffect(
    () => onDirty(form.formState.isDirty),
    [onDirty, form.formState.isDirty],
  );
  async function save(values: z.infer<typeof schema>) {
    if (
      !allowed ||
      runningRef.current ||
      uncertain ||
      !options.data ||
      options.error ||
      options.loading
    )
      return;
    runningRef.current = true;
    onBusy(true);
    setError(undefined);
    const { applicantId: _chosenApplicant, ...input } = values;
    const applicantId =
      options.data?.find((r) => r.id === input.sourceId)?.applicantId ??
      detail?.record.applicantId ??
      session?.user.id ??
      '';
    const key = JSON.stringify({
      version: detail?.record.lifecycleVersion,
      input,
    });
    if (attemptRef.current?.key !== key)
      attemptRef.current = { key, requestId: createRequestId() };
    try {
      const draftRequestId = attemptRef.current.requestId;
      const savedRecord = await submission.save(
        { input, applicantId },
        detail?.record,
        async (current) => {
          const result = await api.request<{
            data: { record: TravelCancellationRecord };
          }>({
            method: 'POST',
            path: current
              ? `travelCancellations/${current.id}/transition`
              : 'travelCancellations',
            json: current
              ? {
                  transition: 'edit',
                  version: current.lifecycleVersion,
                  requestId: draftRequestId,
                  input,
                }
              : {
                  ...input,
                  ...(delegate &&
                  applicantId &&
                  applicantId !== session?.user.id
                    ? { applicantId }
                    : {}),
                },
          });
          return result.data.record;
        },
      );
      const result = { data: { record: await submission.finish(savedRecord) } };
      onDone();
      form.reset(values);
      onDirty(false);
      parent.update?.(result.data.record);
      parent.reload();
      toaster.show({
        type: 'success',
        title: t(
          submission.intent.current === 'submit'
            ? 'approvals.submitted'
            : 'approvals.saved',
          {
            name: result.data.record.number ?? t('approvals.draft'),
          },
        ),
      });
      runningRef.current = false;
      onBusy(false);
      await close();
    } catch (failure) {
      setError(failure);
      if (failure instanceof ApiClientError) {
        for (const violation of fieldViolationsOf(failure)) {
          const field = violation;
          if (['sourceId', 'reason'].includes(field))
            form.setError(field as 'sourceId', {
              message: t('travelCancellation.invalid'),
            });
        }
      }
      // Create has no server idempotency contract. Never repeat an uncertain creation: the transaction may have committed.
      if (
        !detail &&
        !submission.current.current &&
        (!(failure instanceof ApiClientError) || failure.status >= 500)
      ) {
        setUncertain(true);
        onDone();
        parent.reload();
      }
    } finally {
      runningRef.current = false;
      onBusy(false);
    }
  }
  useEffect(() => {
    if (!form.formState.isSubmitting) {
      const field = Object.keys(form.formState.errors)[0] as
        'sourceId' | undefined;
      if (field) form.setFocus(field);
    }
  }, [form.formState.isSubmitting, form.formState.errors, form]);
  const busy = form.formState.isSubmitting;
  return (
    <>
      {!allowed ? (
        <Alert>
          <AlertDescription>{t('approvals.readOnly')}</AlertDescription>
        </Alert>
      ) : null}
      {uncertain ? (
        <Alert>
          <AlertDescription>
            {t('travelCancellation.uncertainCreate')}
          </AlertDescription>
        </Alert>
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : null}
      {options.error ? (
        <ErrorState error={options.error} retry={options.reload} />
      ) : options.loading ? (
        <FieldsSkeleton fields={1} />
      ) : null}
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      <form
        id='travel-cancellation-form'
        onSubmitCapture={submission.captureIntent}
        onSubmit={(event) => void form.handleSubmit(save)(event)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
      >
        <FieldGroup inert={submission.submitUnknown || undefined}>
          <Controller
            name='sourceId'
            control={form.control}
            render={({ field }) => (
              <Field data-invalid={!!form.formState.errors.sourceId}>
                <FieldLabel htmlFor='travel-cancellation-source'>
                  {t('travelCancellation.source')} *
                </FieldLabel>
                <Select
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? '')}
                  disabled={busy || uncertain || !allowed}
                >
                  <SelectTrigger
                    id='travel-cancellation-source'
                    aria-invalid={!!form.formState.errors.sourceId}
                  >
                    <SelectValue
                      placeholder={t('travelCancellation.chooseSource')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(options.data ?? [])
                      .filter((r) => r.approvalGrantedAt && !r.cancelledAt)
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.number ?? r.destination} · {r.destination}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.sourceId]} />
                <FieldDescription>
                  {t('travelCancellation.effectHint')}
                </FieldDescription>
              </Field>
            )}
          />
          <Field data-invalid={!!form.formState.errors.reason}>
            <FieldLabel htmlFor='travel-cancellation-reason'>
              {t('approvals.reason')} *
            </FieldLabel>
            <Textarea
              id='travel-cancellation-reason'
              {...form.register('reason')}
              aria-invalid={!!form.formState.errors.reason}
              disabled={busy || uncertain || !allowed}
            />
            <FieldError errors={[form.formState.errors.reason]} />
          </Field>
        </FieldGroup>
      </form>
    </>
  );
}
