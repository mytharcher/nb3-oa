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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DatePicker } from '#components/date-picker';
import { format, parseISO } from 'date-fns';
import { parseAmountCents, amountText } from './money.js';
import { subjectLabel, type ExpenseOptions } from './options.js';
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
import { fieldViolationsOf } from '../platform/shared/errors.js';
import type {
  ExpensePlanDetail,
  ExpensePlanRecord,
  SourceContext,
  DetailContext,
} from './types.js';

export default function ExpensePlanFormDialog() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const parentReload = parent.reload;
  const resource = useResource<ExpensePlanDetail>(
    requestId ? `expensePlans/${encodeURIComponent(requestId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const [discard, setDiscard] = useState(false);
  const resolveCloseRef = useRef<((allowed: boolean) => void) | null>(null);
  const [done, setDone] = useState(false);
  const canSubmit = useCan({
    resource: { type: 'composite', id: 'oa.expensePlan' },
    action: 'submit',
  }).can;
  const canDelegate = useCan({
    resource: { type: 'composite', id: 'oa.expensePlan' },
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
      title={t(requestId ? 'expensePlans.edit' : 'expensePlans.new')}
      description={t('expensePlans.formDescription')}
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
        <ExpensePlanForm
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
        resource='oa.expensePlan'
        form='expensePlans-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
function ExpensePlanForm({
  detail,
  allowed,
  reload,
  onBusy,
  onDirty,
  onDone,
  onReady,
}: {
  detail?: ExpensePlanDetail;
  allowed: boolean;
  reload: () => void;
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
  onDone: () => void;
  onReady: (v: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { session } = useAuthentication();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const delegate = useCan({
    resource: { type: 'composite', id: 'oa.expensePlan' },
    action: 'delegate',
  }).can;
  const pick = useCan({
    resource: { type: 'user', id: '*' },
    action: 'read',
  }).can;
  const options = useResource<ExpenseOptions>('expensePlans/options');
  const [error, setError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const [unknownDetail, setUnknownDetail] = useState<ExpensePlanDetail | null>(
    null,
  );
  const unknownEdit = !!unknownDetail && unknownDetail === detail;
  const locked = uncertain || unknownEdit;
  useEffect(
    () =>
      onReady(
        !!options.data &&
          options.data.matterTypes.some((v) => v.active) &&
          options.data.subjects.some((v) => v.active) &&
          !options.error &&
          !options.loading &&
          !locked,
      ),
    [options.data, options.error, options.loading, locked, onReady],
  );
  const runningRef = useRef(false);
  const attemptRef = useRef<{ key: string; requestId: string } | null>(null);

  const submission = useRequestFormSubmission<ExpensePlanRecord>({
    resource: 'expensePlans',
  });
  const schema = useMemo(
    () =>
      z.object({
        applicantId: z.string(),
        matterType: z.string().min(1, t('approvals.required')),
        subject: z.string().min(1, t('approvals.required')),
        amount: z
          .string()
          .refine(
            (v) => parseAmountCents(v) !== null,
            t('expensePlans.amountInvalid'),
          ),
        participants: z
          .number()
          .int(t('expensePlans.participantsInvalid'))
          .min(1, t('expensePlans.participantsInvalid'))
          .max(100000, t('expensePlans.participantsInvalid')),
        eventDate: z
          .string()
          .refine(
            (v) =>
              /^\d{4}-\d{2}-\d{2}$/.test(v) &&
              Number.isFinite(Date.parse(`${v}T12:00:00Z`)) &&
              new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v,
            t('expensePlans.dateInvalid'),
          ),
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
      matterType: detail?.record.matterType ?? '',
      subject: detail?.record.subject ?? '',
      amount: detail ? amountText(detail.record.amountCents) : '',
      participants: detail?.record.participants ?? 1,
      eventDate: detail?.record.eventDate ?? '',
      reason: detail?.record.reason ?? '',
    },
  });
  const applicantId = useWatch({ control: form.control, name: 'applicantId' });
  const eventDate = useWatch({ control: form.control, name: 'eventDate' });
  useEffect(
    () => onDirty(form.formState.isDirty),
    [onDirty, form.formState.isDirty],
  );
  async function save(values: z.infer<typeof schema>) {
    if (
      !allowed ||
      runningRef.current ||
      locked ||
      !options.data ||
      options.error ||
      options.loading
    )
      return;
    for (const [name, entries] of [
      ['matterType', options.data.matterTypes],
      ['subject', options.data.subjects],
    ] as const) {
      if (
        !entries.find((entry) => entry.code === values[name] && entry.active)
      ) {
        form.setError(name, { message: t('expensePlans.subjectInactive') });
        document.getElementById(`expensePlans-${name}`)?.focus();
        return;
      }
    }
    runningRef.current = true;
    onBusy(true);
    setError(undefined);
    const { applicantId, amount, ...fields } = values;
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
        { input, applicantId },
        detail?.record,
        async (current) => {
          const result = await api.request<{
            data: { record: ExpensePlanRecord };
          }>({
            method: 'POST',
            path: current
              ? `expensePlans/${current.id}/transition`
              : 'expensePlans',
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
        detail &&
        !submission.current.current &&
        (!(failure instanceof ApiClientError) || failure.status >= 500)
      )
        setUnknownDetail(detail);
      const fields = fieldViolationsOf(failure).map((field) =>
        field === 'amountCents' ? 'amount' : field,
      );
      const first = fields.find(
        (
          field,
        ): field is
          | 'amount'
          | 'subject'
          | 'matterType'
          | 'participants'
          | 'eventDate'
          | 'reason' =>
          [
            'amount',
            'subject',
            'matterType',
            'participants',
            'eventDate',
            'reason',
          ].includes(field),
      );
      if (first) {
        form.setError(first, { message: t('expensePlans.errors.invalid') });
        document.getElementById(`expensePlans-${first}`)?.focus();
      }
      if (
        failure instanceof ApiClientError &&
        failure.reason === 'BUDGET_INSUFFICIENT'
      )
        form.setError(
          'amount',
          { message: t('expensePlans.errors.insufficient') },
          { shouldFocus: true },
        );
      else if (
        failure instanceof ApiClientError &&
        failure.reason === 'EXPENSE_PLAN_INVALID_DICTIONARY'
      ) {
        form.setError('subject', {
          message: t('expensePlans.subjectInactive'),
        });
        document.getElementById('expensePlans-subject')?.focus();
      } else setError(failure);
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
    if (!form.formState.isSubmitting && form.formState.errors.amount)
      form.setFocus('amount');
  }, [form.formState.isSubmitting, form.formState.errors.amount, form]);
  const busy = form.formState.isSubmitting;
  return (
    <>
      {!allowed ? (
        <Alert>
          <AlertDescription>{t('approvals.readOnly')}</AlertDescription>
        </Alert>
      ) : null}
      {unknownEdit ? (
        <Alert>
          <AlertDescription>{t('expensePlans.unknownEdit')}</AlertDescription>
          <Button variant='outline' onClick={reload}>
            {t('approvals.loadLatest')}
          </Button>
        </Alert>
      ) : null}
      {uncertain ? (
        <Alert>
          <AlertDescription>
            {t('expensePlans.uncertainCreate')}
          </AlertDescription>
        </Alert>
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : null}
      {options.data &&
      (!options.data.matterTypes.some((v) => v.active) ||
        !options.data.subjects.some((v) => v.active)) ? (
        <Alert>
          <AlertDescription>{t('expensePlans.optionsEmpty')}</AlertDescription>
        </Alert>
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
        id='expensePlans-form'
        onSubmitCapture={submission.captureIntent}
        onKeyDown={preventComposingSubmit}
        onSubmit={(event) =>
          void form.handleSubmit(save, (errors) => {
            if (errors.matterType)
              document.getElementById('expensePlans-matterType')?.focus();
            else if (errors.eventDate)
              document.getElementById('expensePlans-eventDate')?.focus();
            else if (errors.subject)
              document.getElementById('expensePlans-subject')?.focus();
          })(event)
        }
      >
        <FieldGroup inert={submission.submitUnknown || undefined}>
          {delegate && pick && !detail ? (
            <Controller
              name='applicantId'
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='expensePlans-applicant'>
                    {t('approvals.applicant')}
                  </FieldLabel>
                  <UserPicker
                    id='expensePlans-applicant'
                    value={field.value}
                    onChange={field.onChange}
                    disabled={
                      busy || locked || !allowed || !!submission.current.current
                    }
                  />
                </Field>
              )}
            />
          ) : null}
          <FieldDescription>
            {applicantId && applicantId !== session?.user.id
              ? t('expensePlans.proxyDepartment')
              : t('expensePlans.primaryDepartment', {
                  department:
                    options.data?.department?.title ??
                    t('expensePlans.departmentMissing'),
                })}
          </FieldDescription>
          {(['matterType', 'subject'] as const).map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => {
                const choices =
                  (name === 'matterType'
                    ? options.data?.matterTypes
                    : options.data?.subjects
                  )?.filter(
                    (entry) => entry.active || entry.code === field.value,
                  ) ?? [];
                return (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`expensePlans-${name}`}>
                      {t(`expensePlans.${name}`)} *
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={
                        busy ||
                        locked ||
                        !allowed ||
                        !options.data ||
                        !!options.error
                      }
                      items={choices.map((entry) => ({
                        value: entry.code,
                        label: subjectLabel(entry, entry.code, i18n.language),
                      }))}
                    >
                      <SelectTrigger
                        className='h-auto min-h-9'
                        id={`expensePlans-${name}`}
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue className='whitespace-normal break-words text-left' />
                      </SelectTrigger>
                      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                        <SelectGroup>
                          {choices.map((entry) => (
                            <SelectItem
                              key={entry.code}
                              value={entry.code}
                              disabled={!entry.active}
                            >
                              <span className='break-words'>
                                {subjectLabel(entry, entry.code, i18n.language)}
                                {entry.active
                                  ? ''
                                  : ` (${t('expensePlans.disabled')})`}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                    {choices.find((entry) => entry.code === field.value)
                      ?.active === false ? (
                      <FieldDescription>
                        {t('expensePlans.subjectInactive')}
                      </FieldDescription>
                    ) : null}
                  </Field>
                );
              }}
            />
          ))}
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field data-invalid={!!form.formState.errors.participants}>
              <FieldLabel htmlFor='expensePlans-participants'>
                {t('expensePlans.participants')} *
              </FieldLabel>
              <Input
                id='expensePlans-participants'
                inputMode='numeric'
                type='number'
                min={1}
                max={100000}
                {...form.register('participants', { valueAsNumber: true })}
                aria-invalid={!!form.formState.errors.participants}
                disabled={busy || locked || !allowed}
              />
              <FieldError errors={[form.formState.errors.participants]} />
            </Field>
            <Controller
              name='eventDate'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='expensePlans-eventDate'>
                    {t('expensePlans.eventDate')} *
                  </FieldLabel>
                  <DatePicker
                    id='expensePlans-eventDate'
                    value={field.value ? parseISO(field.value) : undefined}
                    onChange={(date) =>
                      field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                    }
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                    disabled={busy || locked || !allowed}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
          <FieldDescription>
            {t('expensePlans.year', {
              year: eventDate.slice(0, 4) || '—',
              timeZone: options.data?.timeZone ?? '—',
            })}
          </FieldDescription>
          <Field data-invalid={!!form.formState.errors.amount}>
            <FieldLabel htmlFor='expensePlans-amount'>
              {t('expensePlans.amount')} *
            </FieldLabel>
            <Input
              id='expensePlans-amount'
              inputMode='decimal'
              {...form.register('amount')}
              aria-invalid={!!form.formState.errors.amount}
              disabled={busy || locked || !allowed}
            />
            <FieldError errors={[form.formState.errors.amount]} />
            <FieldDescription>{t('expensePlans.amountHint')}</FieldDescription>
          </Field>
          {detail?.record.heldAccount && detail.record.heldCents > 0 ? (
            <Alert>
              <AlertDescription>
                {t('expensePlans.retainedHold', {
                  subject: subjectLabel(
                    options.data?.subjects.find(
                      (v) => v.code === detail.record.heldAccount!.subject,
                    ),
                    detail.record.heldAccount.subject,
                    i18n.language,
                  ),
                  amount: amountText(detail.record.heldCents),
                })}
              </AlertDescription>
            </Alert>
          ) : null}
          <FieldDescription>
            {t(
              detail?.record.status === 'revision'
                ? 'expensePlans.revisionHold'
                : 'expensePlans.reserveHint',
            )}
          </FieldDescription>
          <Field data-invalid={!!form.formState.errors.reason}>
            <FieldLabel htmlFor='expensePlans-reason'>
              {t('approvals.reason')} *
            </FieldLabel>
            <Textarea
              id='expensePlans-reason'
              {...form.register('reason')}
              aria-invalid={!!form.formState.errors.reason}
              disabled={busy || locked || !allowed}
            />
            <FieldError errors={[form.formState.errors.reason]} />
          </Field>
        </FieldGroup>
      </form>
    </>
  );
}
