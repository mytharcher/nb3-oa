import { formatCents } from '#lib/money';
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DepartmentPicker } from '#components/department-picker';
import { parseAmountCents, amountText } from './money.js';
import { subjectLabel, type BudgetOptions } from './options.js';
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
  BudgetAdjustmentDetail,
  BudgetAdjustmentRecord,
  SourceContext,
  DetailContext,
} from './types.js';

export default function BudgetAdjustmentFormDialog() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const parentReload = parent.reload;
  const resource = useResource<BudgetAdjustmentDetail>(
    requestId ? `budgetAdjustments/${encodeURIComponent(requestId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const [discard, setDiscard] = useState(false);
  const resolveCloseRef = useRef<((allowed: boolean) => void) | null>(null);
  const [done, setDone] = useState(false);
  const canSubmit = useCan({
    resource: { type: 'composite', id: 'oa.budgetAdjustment' },
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
      title={t(requestId ? 'budgetAdjustments.edit' : 'budgetAdjustments.new')}
      description={t('budgetAdjustments.formDescription')}
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
        <BudgetAdjustmentForm
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
        resource='oa.budgetAdjustment'
        form='budgetAdjustments-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
function BudgetAdjustmentForm({
  detail,
  allowed,
  reload,
  onBusy,
  onDirty,
  onDone,
  onReady,
}: {
  detail?: BudgetAdjustmentDetail;
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
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const options = useResource<BudgetOptions>('budgetAdjustments/options');
  useEffect(
    () => onReady(!!options.data && !options.error && !options.loading),
    [options.data, options.error, options.loading, onReady],
  );
  const [error, setError] = useState<unknown>();
  const [uncertain, setUncertain] = useState(false);
  const runningRef = useRef(false);
  const attemptRef = useRef<{ key: string; requestId: string } | null>(null);
  const [currentYear] = useState(() => new Date().getFullYear());
  const submission = useRequestFormSubmission<BudgetAdjustmentRecord>({
    resource: 'budgetAdjustments',
  });
  const schema = useMemo(
    () =>
      z
        .object({
          departmentId: z.string().min(1, t('approvals.required')),
          year: z
            .number()
            .int(t('budgetAdjustments.yearInvalid'))
            .min(1900, t('budgetAdjustments.yearInvalid'))
            .max(9999, t('budgetAdjustments.yearInvalid')),
          adjustmentType: z.enum(['transfer', 'increase']),
          subject: z.string().min(1, t('approvals.required')),
          sourceSubject: z.string(),
          amount: z
            .string()
            .refine(
              (value) => parseAmountCents(value) !== null,
              t('budgetAdjustments.amountInvalid'),
            ),
          reason: z
            .string()
            .trim()
            .min(1, t('approvals.required'))
            .max(10000, t('approvals.limit')),
        })
        .refine(
          (value) =>
            value.adjustmentType === 'increase' ||
            (!!value.sourceSubject && value.sourceSubject !== value.subject),
          {
            path: ['sourceSubject'],
            message: t('budgetAdjustments.sourceInvalid'),
          },
        ),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      departmentId: detail?.record.departmentId ?? '',
      year: detail?.record.year ?? currentYear,
      subject: detail?.record.subject ?? '',
      sourceSubject: detail?.record.sourceSubject ?? '',
      adjustmentType: detail?.record.adjustmentType ?? 'transfer',
      amount: detail ? amountText(detail.record.amountCents) : '',
      reason: detail?.record.reason ?? '',
    },
  });
  const adjustmentType = useWatch({
    control: form.control,
    name: 'adjustmentType',
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
    const { amount, sourceSubject, ...fields } = values;
    const input = {
      ...fields,
      sourceSubject:
        fields.adjustmentType === 'increase' ? null : sourceSubject,
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
            data: { record: BudgetAdjustmentRecord };
          }>({
            method: 'POST',
            path: current
              ? `budgetAdjustments/${current.id}/transition`
              : 'budgetAdjustments',
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
        failure.reason === 'BUDGET_INSUFFICIENT'
      )
        form.setError(
          'amount',
          { message: t('budgetAdjustments.insufficient') },
          { shouldFocus: true },
        );
      else if (
        failure instanceof ApiClientError &&
        failure.reason === 'BUDGET_ADJUSTMENT_INVALID_SUBJECT'
      ) {
        form.setError('subject', {
          message: t('budgetAdjustments.subjectInactive'),
        });
        document.getElementById('budgetAdjustments-subject')?.focus();
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
      {uncertain ? (
        <Alert>
          <AlertDescription>
            {t('budgetAdjustments.uncertainCreate')}
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
        id='budgetAdjustments-form'
        onSubmitCapture={submission.captureIntent}
        onKeyDown={preventComposingSubmit}
        onSubmit={(event) =>
          void form.handleSubmit(save, (errors) => {
            if (errors.departmentId)
              document.getElementById('budgetAdjustments-department')?.focus();
            else if (errors.subject)
              document.getElementById('budgetAdjustments-subject')?.focus();
            else if (errors.sourceSubject)
              document
                .getElementById('budgetAdjustments-sourceSubject')
                ?.focus();
          })(event)
        }
      >
        <FieldGroup inert={submission.submitUnknown || undefined}>
          <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]'>
            <Controller
              name='departmentId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='budgetAdjustments-department'>
                    {t('budgetAdjustments.department')} *
                  </FieldLabel>
                  <DepartmentPicker
                    id='budgetAdjustments-department'
                    value={field.value}
                    onChange={(value) => field.onChange(value)}
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                    disabled={busy || uncertain || !allowed}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field data-invalid={!!form.formState.errors.year}>
              <FieldLabel htmlFor='budgetAdjustments-year'>
                {t('budgetAdjustments.year')} *
              </FieldLabel>
              <Input
                id='budgetAdjustments-year'
                type='number'
                min={1900}
                max={9999}
                {...form.register('year', { valueAsNumber: true })}
                disabled={busy || uncertain || !allowed}
              />
              <FieldError errors={[form.formState.errors.year]} />
            </Field>
          </div>
          <Controller
            name='adjustmentType'
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor='budgetAdjustments-type'>
                  {t('budgetAdjustments.type')} *
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={busy || uncertain || !allowed}
                  items={[
                    {
                      value: 'transfer',
                      label: t('budgetAdjustments.transfer'),
                    },
                    {
                      value: 'increase',
                      label: t('budgetAdjustments.increase'),
                    },
                  ]}
                >
                  <SelectTrigger id='budgetAdjustments-type'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                    <SelectGroup>
                      {['transfer', 'increase'].map((value) => (
                        <SelectItem key={value} value={value}>
                          {t(`budgetAdjustments.${value}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <div
            className={
              adjustmentType === 'transfer'
                ? 'grid gap-4 sm:grid-cols-2'
                : 'grid gap-4'
            }
          >
            {(
              [
                ...(adjustmentType === 'transfer' ? ['sourceSubject'] : []),
                'subject',
              ] as ('subject' | 'sourceSubject')[]
            ).map((name) => (
              <Controller
                key={name}
                name={name}
                control={form.control}
                render={({ field, fieldState }) => {
                  const choices =
                    options.data?.subjects.filter(
                      (entry) => entry.active || entry.code === field.value,
                    ) ?? [];
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`budgetAdjustments-${name}`}>
                        {t(
                          name === 'subject'
                            ? 'budgetAdjustments.targetSubject'
                            : 'budgetAdjustments.sourceSubject',
                        )}{' '}
                        *
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          busy ||
                          uncertain ||
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
                          id={`budgetAdjustments-${name}`}
                          className='w-full'
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                          <SelectGroup>
                            {choices.map((entry) => (
                              <SelectItem
                                key={entry.code}
                                value={entry.code}
                                disabled={!entry.active}
                              >
                                {subjectLabel(entry, entry.code, i18n.language)}
                                {entry.active
                                  ? ''
                                  : ` (${t('budgetAdjustments.disabled')})`}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                      {choices.find((entry) => entry.code === field.value)
                        ?.active === false ? (
                        <FieldDescription>
                          {t('budgetAdjustments.subjectInactive')}
                        </FieldDescription>
                      ) : null}
                    </Field>
                  );
                }}
              />
            ))}
          </div>
          <Field data-invalid={!!form.formState.errors.amount}>
            <FieldLabel htmlFor='budgetAdjustments-amount'>
              {t('budgetAdjustments.amount')} *
            </FieldLabel>
            <Input
              id='budgetAdjustments-amount'
              inputMode='decimal'
              {...form.register('amount')}
              aria-invalid={!!form.formState.errors.amount}
              disabled={busy || uncertain || !allowed}
            />
            <FieldError errors={[form.formState.errors.amount]} />
            <FieldDescription>
              {t('budgetAdjustments.amountHint')}
            </FieldDescription>
          </Field>
          {detail?.record.heldAccount && detail.record.heldCents > 0 ? (
            <Alert>
              <AlertDescription>
                {t('budgetAdjustments.retainedHold', {
                  subject: subjectLabel(
                    options.data?.subjects.find(
                      (v) => v.code === detail.record.heldAccount!.subject,
                    ),
                    detail.record.heldAccount.subject,
                    i18n.language,
                  ),
                  amount: formatCents(detail.record.heldCents, i18n.language),
                })}
              </AlertDescription>
            </Alert>
          ) : null}
          <FieldDescription>
            {t(
              detail?.record.status === 'revision'
                ? 'budgetAdjustments.revisionHold'
                : 'budgetAdjustments.reserveHint',
            )}
          </FieldDescription>
          <Field data-invalid={!!form.formState.errors.reason}>
            <FieldLabel htmlFor='budgetAdjustments-reason'>
              {t('approvals.reason')} *
            </FieldLabel>
            <Textarea
              id='budgetAdjustments-reason'
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
