import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { format, parseISO } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DatePicker } from '#components/date-picker';
import { UserPicker } from '#components/user-picker';
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
  OvertimeDetail,
  OvertimeRecord,
  SourceContext,
  DetailContext,
} from './types.js';

export default function OvertimeFormDialog() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const parentReload = parent.reload;
  const resource = useResource<OvertimeDetail>(
    requestId ? `overtimeRequests/${encodeURIComponent(requestId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const [discard, setDiscard] = useState(false);
  const resolveCloseRef = useRef<((allowed: boolean) => void) | null>(null);
  const [done, setDone] = useState(false);
  const canSubmit = useCan({
    resource: { type: 'composite', id: 'oa.overtime' },
    action: 'submit',
  }).can;
  const canDelegate = useCan({
    resource: { type: 'composite', id: 'oa.overtime' },
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
      title={t(requestId ? 'overtime.edit' : 'overtime.new')}
      description={t('overtime.formDescription')}
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
          disabled={done || !allowed || resource.loading || !!resource.error}
        />
      }
    >
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : requestId && !resource.data ? (
        <FieldsSkeleton fields={4} />
      ) : (
        <OvertimeForm
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
        resource='oa.overtime'
        form='overtime-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
function OvertimeForm({
  detail,
  allowed,
  reload,
  onBusy,
  onDirty,
  onDone,
}: {
  detail?: OvertimeDetail;
  allowed: boolean;
  reload: () => void;
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { session } = useAuthentication();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const delegate = useCan({
    resource: { type: 'composite', id: 'oa.overtime' },
    action: 'delegate',
  }).can;
  const pick = useCan({
    resource: { type: 'user', id: '*' },
    action: 'read',
  }).can;
  const [error, setError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const runningRef = useRef(false);
  const attemptRef = useRef<{ key: string; requestId: string } | null>(null);
  const submission = useRequestFormSubmission<OvertimeRecord>({
    resource: 'overtimeRequests',
  });
  const schema = useMemo(
    () =>
      z.object({
        applicantId: z.string(),
        date: z.string().min(1, t('approvals.required')),
        minutes: z
          .number()
          .int(t('overtime.durationInvalid'))
          .min(1, t('overtime.durationInvalid'))
          .max(1440, t('overtime.durationInvalid')),
        settlement: z.enum(['compensatory', 'pay']),
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
      date: detail?.record.date ?? '',
      minutes: detail?.record.minutes ?? 240,
      settlement: detail?.record.settlement ?? 'compensatory',
      reason: detail?.record.reason ?? '',
    },
  });
  useEffect(
    () => onDirty(form.formState.isDirty),
    [onDirty, form.formState.isDirty],
  );
  async function save(values: z.infer<typeof schema>) {
    if (!allowed || runningRef.current || uncertain) return;
    runningRef.current = true;
    onBusy(true);
    setError(undefined);
    const { applicantId, ...input } = values;
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
            data: { record: OvertimeRecord };
          }>({
            method: 'POST',
            path: current
              ? `overtimeRequests/${current.id}/transition`
              : 'overtimeRequests',
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
                  pick &&
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
      if (
        failure instanceof ApiClientError &&
        failure.reason === 'OVERTIME_INVALID_DURATION'
      )
        form.setError(
          'minutes',
          { message: t('overtime.durationInvalid') },
          { shouldFocus: true },
        );
      else if (
        failure instanceof ApiClientError &&
        ['OVERTIME_INVALID_DATE', 'OVERTIME_DUPLICATE_DATE'].includes(
          failure.reason ?? '',
        )
      )
        form.setError(
          'date',
          {
            message: t(
              failure.reason === 'OVERTIME_DUPLICATE_DATE'
                ? 'overtime.duplicate'
                : 'overtime.invalid',
            ),
          },
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
          <AlertDescription>{t('overtime.uncertainCreate')}</AlertDescription>
        </Alert>
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : null}
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      <form
        id='overtime-form'
        onSubmitCapture={submission.captureIntent}
        onKeyDown={preventComposingSubmit}
        onSubmit={(event) => void form.handleSubmit(save)(event)}
      >
        <FieldGroup inert={submission.submitUnknown || undefined}>
          {delegate && pick && !detail ? (
            <Controller
              name='applicantId'
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='overtime-applicant'>
                    {t('approvals.applicant')}
                  </FieldLabel>
                  <UserPicker
                    id='overtime-applicant'
                    value={field.value}
                    onChange={field.onChange}
                    disabled={
                      busy ||
                      uncertain ||
                      !allowed ||
                      !!submission.current.current
                    }
                  />
                </Field>
              )}
            />
          ) : null}
          <Controller
            name='date'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='overtime-date'>
                  {t('overtime.date')} *
                </FieldLabel>
                <DatePicker
                  id='overtime-date'
                  className='w-full'
                  value={field.value ? parseISO(field.value) : undefined}
                  onChange={(v) =>
                    field.onChange(v ? format(v, 'yyyy-MM-dd') : '')
                  }
                  invalid={fieldState.invalid}
                  disabled={busy || uncertain || !allowed}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Field data-invalid={!!form.formState.errors.minutes}>
            <FieldLabel htmlFor='overtime-minutes'>
              {t('overtime.minutes')} *
            </FieldLabel>
            <Input
              id='overtime-minutes'
              type='number'
              min={1}
              max={1440}
              step={1}
              {...form.register('minutes', { valueAsNumber: true })}
              aria-invalid={!!form.formState.errors.minutes}
              disabled={busy || uncertain || !allowed}
            />
            <FieldError errors={[form.formState.errors.minutes]} />
          </Field>
          <Controller
            name='settlement'
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='overtime-settlement'>
                  {t('overtime.settlement')} *
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={busy || uncertain || !allowed}
                  items={['compensatory', 'pay'].map((v) => ({
                    value: v,
                    label: t(`overtime.${v}`),
                  }))}
                >
                  <SelectTrigger id='overtime-settlement'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='w-auto min-w-(--anchor-width)'>
                    <SelectGroup>
                      {['compensatory', 'pay'].map((v) => (
                        <SelectItem key={v} value={v}>
                          {t(`overtime.${v}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Field data-invalid={!!form.formState.errors.reason}>
            <FieldLabel htmlFor='overtime-reason'>
              {t('approvals.reason')} *
            </FieldLabel>
            <Textarea
              id='overtime-reason'
              {...form.register('reason')}
              aria-invalid={!!form.formState.errors.reason}
              disabled={busy || uncertain || !allowed}
            />
            <FieldError errors={[form.formState.errors.reason]} />
          </Field>
          <FieldDescription>{t('overtime.policyHint')}</FieldDescription>
        </FieldGroup>
      </form>
    </>
  );
}
