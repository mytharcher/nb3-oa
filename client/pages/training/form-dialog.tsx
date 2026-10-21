import { useRequestFormSubmission } from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DateTimePicker } from '#components/date-time-picker';
import { Checkbox } from '#components/ui/checkbox';
import { parseAmountCents, amountText } from './money.js';
import type { TrainingOptions } from './options.js';
import { fieldViolationsOf } from '../platform/shared/errors.js';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
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
  TrainingDetail,
  TrainingRecord,
  SourceContext,
  DetailContext,
} from './types.js';

export default function TrainingFormDialog() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const parentReload = parent.reload;
  const resource = useResource<TrainingDetail>(
    requestId ? `trainingRequests/${encodeURIComponent(requestId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const [discard, setDiscard] = useState(false);
  const resolveCloseRef = useRef<((allowed: boolean) => void) | null>(null);
  const [done, setDone] = useState(false);
  const canSubmit = useCan({
    resource: { type: 'composite', id: 'oa.training' },
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
      title={t(requestId ? 'training.edit' : 'training.new')}
      description={t('training.formDescription')}
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
        <TrainingForm
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
        resource='oa.training'
        form='training-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
function TrainingForm({
  detail,
  allowed,
  reload,
  onBusy,
  onDirty,
  onDone,
  onReady,
}: {
  detail?: TrainingDetail;
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
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const options = useResource<TrainingOptions>('trainingRequests/options');
  useEffect(
    () => onReady(!!options.data && !options.error && !options.loading),
    [options.data, options.error, options.loading, onReady],
  );
  const [error, setError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const runningRef = useRef(false);
  const attemptRef = useRef<{ key: string; requestId: string } | null>(null);
  const submission = useRequestFormSubmission<TrainingRecord>({
    resource: 'trainingRequests',
  });
  const schema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .trim()
            .min(1, t('approvals.required'))
            .max(255, t('approvals.limit')),
          institution: z
            .string()
            .trim()
            .min(1, t('approvals.required'))
            .max(255, t('approvals.limit')),
          startAt: z
            .string()
            .refine(
              (v) => Number.isFinite(Date.parse(v)),
              t('training.dateInvalid'),
            ),
          endAt: z
            .string()
            .refine(
              (v) => Number.isFinite(Date.parse(v)),
              t('training.dateInvalid'),
            ),
          usesWorkingTime: z.boolean(),
          amount: z
            .string()
            .refine(
              (v) => parseAmountCents(v) !== null,
              t('training.amountInvalid'),
            ),
          reason: z
            .string()
            .trim()
            .min(1, t('approvals.required'))
            .max(10000, t('approvals.limit')),
        })
        .refine((v) => Date.parse(v.startAt) < Date.parse(v.endAt), {
          path: ['endAt'],
          message: t('training.dateInvalid'),
        }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: detail?.record.name ?? '',
      institution: detail?.record.institution ?? '',
      startAt: detail?.record.startAt ?? '',
      endAt: detail?.record.endAt ?? '',
      usesWorkingTime: detail?.record.usesWorkingTime ?? false,
      amount: detail ? amountText(detail.record.amountCents) : '0.00',
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
    const { amount, ...fields } = values;
    const input = {
      ...fields,
      amountCents: parseAmountCents(amount)!,
    };
    const key = JSON.stringify({
      version: detail?.record.lifecycleVersion,
      input,
    });
    if (attemptRef.current?.key !== key)
      attemptRef.current = { key, requestId: createRequestId() };
    try {
      const draftRequestId = attemptRef.current.requestId;
      const savedRecord = await submission.save(
        { input },
        detail?.record,
        async (current) => {
          const result = await api.request<{
            data: { record: TrainingRecord };
          }>({
            method: 'POST',
            path: current
              ? `trainingRequests/${current.id}/transition`
              : 'trainingRequests',
            json: current
              ? {
                  transition: 'edit',
                  version: current.lifecycleVersion,
                  requestId: draftRequestId,
                  input,
                }
              : {
                  ...input,
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
            : 'training.actionForm.saved',
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
          const field = violation === 'amountCents' ? 'amount' : violation;
          if (
            [
              'name',
              'institution',
              'startAt',
              'endAt',
              'amount',
              'reason',
            ].includes(field)
          )
            form.setError(field as 'name', { message: t('training.invalid') });
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
      const field = Object.keys(form.formState.errors)[0] as 'name' | undefined;
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
          <AlertDescription>{t('training.uncertainCreate')}</AlertDescription>
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
        id='training-form'
        onSubmitCapture={submission.captureIntent}
        onSubmit={(event) => void form.handleSubmit(save)(event)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
      >
        <FieldGroup inert={submission.submitUnknown || undefined}>
          <div className='grid gap-4 sm:grid-cols-2'>
            {(['name', 'institution'] as const).map((name) => (
              <Field key={name} data-invalid={!!form.formState.errors[name]}>
                <FieldLabel htmlFor={`training-${name}`}>
                  {t(`training.${name}`)} *
                </FieldLabel>
                <Input
                  id={`training-${name}`}
                  {...form.register(name)}
                  disabled={busy || uncertain || !allowed}
                  aria-invalid={!!form.formState.errors[name]}
                />
                <FieldError errors={[form.formState.errors[name]]} />
              </Field>
            ))}
          </div>
          {(['startAt', 'endAt'] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`training-${name}`}>
                    {t(`training.${name}`)} *
                  </FieldLabel>
                  <DateTimePicker
                    id={`training-${name}`}
                    value={field.value}
                    onChange={field.onChange}
                    timeZone={options.data?.timeZone ?? 'UTC'}
                    disabled={busy || uncertain || !allowed || !options.data}
                    invalid={fieldState.invalid}
                    timeLabel={t(`training.${name}`)}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ))}
          <FieldDescription>
            {t('training.timeZone', { zone: options.data?.timeZone ?? '—' })}
          </FieldDescription>
          <Controller
            name='usesWorkingTime'
            control={form.control}
            render={({ field }) => (
              <Field orientation='horizontal'>
                <Checkbox
                  id='training-working'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={busy || uncertain || !allowed}
                />
                <FieldLabel htmlFor='training-working'>
                  {t('training.usesWorkingTime')}
                </FieldLabel>
              </Field>
            )}
          />
          <Field data-invalid={!!form.formState.errors.amount}>
            <FieldLabel htmlFor='training-amount'>
              {t('training.amount')} *
            </FieldLabel>
            <Input
              id='training-amount'
              inputMode='decimal'
              {...form.register('amount')}
              aria-invalid={!!form.formState.errors.amount}
              disabled={busy || uncertain || !allowed}
            />
            <FieldError errors={[form.formState.errors.amount]} />
            <FieldDescription>{t('training.amountHint')}</FieldDescription>
          </Field>
          <FieldDescription>{t('training.approvalHint')}</FieldDescription>
          <Field data-invalid={!!form.formState.errors.reason}>
            <FieldLabel htmlFor='training-reason'>
              {t('approvals.reason')} *
            </FieldLabel>
            <Textarea
              id='training-reason'
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
