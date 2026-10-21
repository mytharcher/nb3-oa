import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { formatLeaveDate } from './format-date.js';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { format, parseISO } from 'date-fns';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  useOutletContext,
  useParams,
  useSearchParams,
  useLocation,
} from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DatePicker } from '#components/date-picker';
import { Button } from '#components/ui/button';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
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
  CancellationDetail,
  CancellationRecord,
  SourceContext,
  DetailContext,
  CancellationOriginal,
} from './types.js';
import type { LeaveRecord } from '../approvals/types.js';

export default function CancellationFormDialog() {
  const { requestId: routeRequestId } = useParams();
  const location = useLocation();
  // A new cancellation can be nested under a leave detail whose requestId belongs to the original.
  const requestId = location.pathname.endsWith('/newCancellation')
    ? undefined
    : routeRequestId;
  const { t } = useTranslation();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const parentReload = parent.reload;
  const resource = useResource<CancellationDetail>(
    requestId ? `leaveCancellations/${encodeURIComponent(requestId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const [discard, setDiscard] = useState(false);
  const resolveCloseRef = useRef<((allowed: boolean) => void) | null>(null);
  const [done, setDone] = useState(false);
  const [sourceReady, setSourceReady] = useState(false);
  const canSubmit = useCan({
    resource: { type: 'composite', id: 'oa.leaveCancellation' },
    action: 'submit',
  }).can;
  const allowed = requestId
    ? resource.data?.view.available.some((a) => a.name === 'edit' && a.allowed)
    : canSubmit;
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
        requestId ? 'leaveCancellations.edit' : 'leaveCancellations.new',
      )}
      description={t('leaveCancellations.formDescription')}
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
            done ||
            !allowed ||
            !sourceReady ||
            resource.loading ||
            !!resource.error
          }
        />
      }
    >
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : requestId && !resource.data ? (
        <FieldsSkeleton fields={4} />
      ) : (
        <CancellationForm
          key={
            resource.data
              ? `${resource.data.record.id}:${resource.data.record.lifecycleVersion}`
              : 'new'
          }
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
          onSourceReady={setSourceReady}
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
        resource='oa.leaveCancellation'
        form='leaveCancellations-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
function CancellationForm({
  detail,
  allowed,
  reload,
  onBusy,
  onDirty,
  onDone,
  onSourceReady,
}: {
  detail?: CancellationDetail;
  allowed: boolean;
  reload: () => void;
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
  onDone: () => void;
  onSourceReady: (ready: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const { session } = useAuthentication();
  const [query] = useSearchParams();
  const originals = useResource<LeaveRecord[]>('leaveRequests?view=mine');
  const [error, setError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const runningRef = useRef(false);
  const attemptRef = useRef<{ key: string; requestId: string } | null>(null);
  const submission = useRequestFormSubmission<CancellationRecord>({
    resource: 'leaveCancellations',
  });
  const schema = useMemo(
    () =>
      z.object({
        originalLeaveId: z.string().min(1, t('approvals.required')),
        cancelAll: z.boolean(),
        endDate: z.string().min(1, t('approvals.required')),
        endHalf: z.enum(['am', 'pm']),
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
      originalLeaveId:
        detail?.record.originalLeaveId ??
        query.get('originalLeaveId') ??
        parent.detail?.record.id ??
        '',
      cancelAll: detail?.record.cancelAll ?? false,
      endDate: detail?.record.endDate ?? '',
      endHalf: detail?.record.endHalf ?? 'pm',
      reason: detail?.record.reason ?? '',
    },
  });
  const originalId = useWatch({
    control: form.control,
    name: 'originalLeaveId',
  });
  const cancelAll = useWatch({ control: form.control, name: 'cancelAll' });
  const source = useResource<CancellationOriginal>(
    originalId
      ? `leaveCancellations/originals/${encodeURIComponent(originalId)}`
      : null,
  );
  const chosen = source.data;
  useEffect(() => {
    onSourceReady(!!chosen && !source.loading && !source.error);
  }, [chosen, source.loading, source.error, onSourceReady]);
  useEffect(() => {
    if (chosen && !detail && !form.getValues('endDate')) {
      form.setValue('endDate', chosen.endDate);
      form.setValue('endHalf', chosen.endHalf);
    }
  }, [chosen, detail, form]);
  useEffect(
    () => onDirty(form.formState.isDirty),
    [onDirty, form.formState.isDirty],
  );
  async function save(values: z.infer<typeof schema>) {
    if (
      !allowed ||
      runningRef.current ||
      uncertain ||
      !chosen ||
      source.loading ||
      source.error
    )
      return;
    runningRef.current = true;
    onBusy(true);
    setError(undefined);
    const { originalLeaveId, ...input } = values;
    if (input.cancelAll) {
      input.endDate = chosen.endDate;
      input.endHalf = chosen.endHalf;
    }
    const key = JSON.stringify({
      version: detail?.record.lifecycleVersion,
      input,
    });
    if (attemptRef.current?.key !== key)
      attemptRef.current = { key, requestId: createRequestId() };
    try {
      const draftRequestId = attemptRef.current.requestId;
      const savedRecord = await submission.save(
        { input, originalLeaveId },
        detail?.record,
        async (current) => {
          const result = await api.request<{
            data: { record: CancellationRecord };
          }>({
            method: 'POST',
            path: current
              ? `leaveCancellations/${current.id}/transition`
              : 'leaveCancellations',
            json: current
              ? {
                  transition: 'edit',
                  version: current.lifecycleVersion,
                  requestId: draftRequestId,
                  input,
                }
              : { ...input, originalLeaveId },
          });
          return result.data.record;
        },
      );
      const result = { data: { record: await submission.finish(savedRecord) } };
      onDone();
      form.reset(values);
      onDirty(false);
      if (detail) parent.update?.(result.data.record);
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
      if (
        failure instanceof ApiClientError &&
        [
          'CANCELLATION_RANGE_INVALID',
          'CANCELLATION_NO_WORKDAYS',
          'CANCELLATION_ALREADY_STARTED',
        ].includes(failure.reason ?? '')
      )
        form.setError(
          'endDate',
          { message: t('leaveCancellations.invalidRange') },
          { shouldFocus: true },
        );
      else if (
        failure instanceof ApiClientError &&
        ['CANCELLATION_ORIGINAL_INVALID', 'CANCELLATION_NO_REMAINDER'].includes(
          failure.reason ?? '',
        )
      )
        form.setError(
          'originalLeaveId',
          { message: t('leaveCancellations.invalidOriginal') },
          { shouldFocus: true },
        );
      else setError(failure);
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
            {t('leaveCancellations.uncertainCreate')}
          </AlertDescription>
        </Alert>
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : null}
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      <form
        id='leaveCancellations-form'
        onSubmitCapture={submission.captureIntent}
        onKeyDown={preventComposingSubmit}
        onSubmit={(event) => void form.handleSubmit(save)(event)}
      >
        <FieldGroup inert={submission.submitUnknown || undefined}>
          {!detail ? (
            <Controller
              name='originalLeaveId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='cancellation-original'>
                    {t('leaveCancellations.original')} *
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('endDate', '');
                    }}
                    disabled={
                      busy || uncertain || !allowed || originals.loading
                    }
                    items={(originals.data ?? [])
                      .filter(
                        (r) =>
                          r.status === 'approved' &&
                          r.applicantId === session?.user.id,
                      )
                      .map((r) => ({ value: r.id, label: r.number ?? r.id }))}
                  >
                    <SelectTrigger
                      id='cancellation-original'
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue
                        placeholder={t('leaveCancellations.chooseOriginal')}
                      />
                    </SelectTrigger>
                    <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                      <SelectGroup>
                        {(originals.data ?? [])
                          .filter(
                            (r) =>
                              r.status === 'approved' &&
                              r.applicantId === session?.user.id,
                          )
                          .map((r) => (
                            <SelectItem
                              key={r.id}
                              value={r.id}
                              className='whitespace-normal'
                            >
                              {r.number ?? r.id} ·{' '}
                              {formatLeaveDate(r.startDate, i18n.language)} –{' '}
                              {formatLeaveDate(r.endDate, i18n.language)}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ) : null}
          {originals.error ? (
            <ErrorState error={originals.error} retry={originals.reload} />
          ) : !detail &&
            originals.data &&
            !originals.data.some(
              (r) =>
                r.status === 'approved' && r.applicantId === session?.user.id,
            ) ? (
            <Alert>
              <AlertDescription>
                {t('leaveCancellations.noOriginals')}
              </AlertDescription>
            </Alert>
          ) : null}
          {source.error ? (
            <ErrorState error={source.error} retry={source.reload} />
          ) : source.loading ? (
            <FieldsSkeleton fields={2} />
          ) : chosen ? (
            <FieldDescription>
              {t('leaveCancellations.sourceRange', {
                name: chosen.number ?? chosen.id,
                start: formatLeaveDate(chosen.startDate, i18n.language),
                end: formatLeaveDate(chosen.endDate, i18n.language),
                zone: chosen.timeZone,
              })}
            </FieldDescription>
          ) : null}
          <Controller
            name='cancelAll'
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='cancellation-mode'>
                  {t('leaveCancellations.mode')} *
                </FieldLabel>
                <Select
                  value={field.value ? 'all' : 'shorten'}
                  onValueChange={(v) => field.onChange(v === 'all')}
                  disabled={busy || uncertain || !allowed}
                  items={['all', 'shorten'].map((v) => ({
                    value: v,
                    label: t(`leaveCancellations.${v}`),
                  }))}
                >
                  <SelectTrigger id='cancellation-mode'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                    <SelectGroup>
                      {['all', 'shorten'].map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(`leaveCancellations.${v}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          {!cancelAll ? (
            <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]'>
              <Controller
                name='endDate'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='cancellation-end'>
                      {t('leaveCancellations.actualEnd')} *
                    </FieldLabel>
                    <DatePicker
                      disabledDays={
                        chosen
                          ? [
                              { before: parseISO(chosen.startDate) },
                              { after: parseISO(chosen.endDate) },
                            ]
                          : undefined
                      }
                      id='cancellation-end'
                      className='w-full'
                      value={field.value ? parseISO(field.value) : undefined}
                      onChange={(v) =>
                        field.onChange(v ? format(v, 'yyyy-MM-dd') : '')
                      }
                      invalid={fieldState.invalid}
                      disabled={busy || uncertain || !allowed || !chosen}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name='endHalf'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor='cancellation-half'>
                      {t('leaveCancellations.endHalf')} *
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={busy || uncertain || !allowed}
                      items={['am', 'pm'].map((v) => ({
                        value: v,
                        label: t(`approvals.${v}`),
                      }))}
                    >
                      <SelectTrigger id='cancellation-half' className='w-full'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                        <SelectGroup>
                          {['am', 'pm'].map((v) => (
                            <SelectItem key={v} value={v}>
                              {t(`approvals.${v}`)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </div>
          ) : null}
          <Field data-invalid={!!form.formState.errors.reason}>
            <FieldLabel htmlFor='leaveCancellations-reason'>
              {t('approvals.reason')} *
            </FieldLabel>
            <Textarea
              id='leaveCancellations-reason'
              {...form.register('reason')}
              aria-invalid={!!form.formState.errors.reason}
              disabled={busy || uncertain || !allowed}
            />
            <FieldError errors={[form.formState.errors.reason]} />
          </Field>
          <FieldDescription>
            {t('leaveCancellations.policyHint')}
          </FieldDescription>
        </FieldGroup>
      </form>
    </>
  );
}
