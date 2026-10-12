import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext, useParams, useSearchParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DatePicker } from '#components/date-picker';
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
import { useResource } from '../approvals/use-resource.js';
import { createRequestId } from '../approvals/request-id.js';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { ErrorState } from './states.js';
import { amountText, parseAmountCents } from './money.js';
import type {
  LoanRequestDetail,
  LoanRequestRecord,
  SourceContext,
} from './types.js';
export interface LoanOptions {
  timeZone: string;
  paymentAccountReady: boolean;
  travelSources: { id: string; number: string | null; amountCents: number }[];
  rules: Record<string, unknown>;
}
export default function LoanFormDialog() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const resource = useResource<LoanRequestDetail>(
    requestId ? `loanRequests/${requestId}` : null,
  );
  const options = useResource<LoanOptions>('loanRequests/options');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false),
    [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false);
  const resolverRef = useRef<((allowed: boolean) => void) | null>(null);
  return (
    <RouteDrawer
      printable
      className='text-sm sm:max-w-2xl'
      title={t(requestId ? 'loanRequests.edit' : 'loanRequests.new')}
      beforeClose={() => {
        if (busy) return false;
        if (!dirty) return true;
        setDiscard(true);
        return new Promise<boolean>((resolve) => {
          resolverRef.current = resolve;
        });
      }}
      footer={
        <LoanFormFooter
          revision={resource.data?.record.status === 'revision'}
          busy={busy}
          disabled={
            !ready ||
            !!resource.error ||
            !!options.error ||
            resource.loading ||
            options.loading
          }
        />
      }
    >
      {resource.error ? (
        <ErrorState error={resource.error} retry={resource.reload} />
      ) : options.error ? (
        <ErrorState error={options.error} retry={options.reload} />
      ) : !options.data || (requestId && !resource.data) ? (
        <FieldsSkeleton />
      ) : (
        <LoanForm
          key={requestId ?? 'new'}
          detail={resource.data}
          options={options.data}
          onReady={setReady}
          onBusy={setBusy}
          onDirty={setDirty}
        />
      )}
      <AlertDialog
        open={discard}
        onOpenChange={(open) => {
          if (!open) {
            setDiscard(false);
            resolverRef.current?.(false);
            resolverRef.current = null;
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
                setDiscard(false);
                resolverRef.current?.(true);
                resolverRef.current = null;
              }}
            >
              {t('approvals.discard')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteDrawer>
  );
}
function LoanFormFooter({
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
      <Button
        variant='outline'
        disabled={busy}
        onClick={() => {
          void close();
        }}
      >
        {t('approvals.cancel')}
      </Button>
      <RequestFormButtons
        revision={revision}
        resource='oa.loan'
        form='loan-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
function LoanForm({
  detail,
  options,
  onBusy,
  onReady,
  onDirty,
}: {
  detail?: LoanRequestDetail;
  options: LoanOptions;
  onReady: (v: boolean) => void;
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    parent = useOutletContext<SourceContext>(),
    { close } = useRouteOverlay();
  const [params] = useSearchParams();
  const submission = useRequestFormSubmission<LoanRequestRecord>({
    resource: 'loanRequests',
  });
  const record = detail?.record;
  const permission = useCan({
    resource: { type: 'composite', id: 'oa.loan' },
    action: 'submit',
  });
  const [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [committed, setCommitted] = useState(false);
  const [version, setVersion] = useState(record?.lifecycleVersion);
  const [needsLatest, setNeedsLatest] = useState(false);
  const [latest, setLatest] = useState<LoanRequestDetail>();
  const [loadingLatest, setLoadingLatest] = useState(false);
  async function loadLatest() {
    if (!record || loadingLatest) return;
    setLoadingLatest(true);
    try {
      const result = await api.request<{ data: LoanRequestDetail }>({
        path: `loanRequests/${record.id}`,
      });
      setLatest(result.data);
    } catch (e) {
      setError(e);
    } finally {
      setLoadingLatest(false);
    }
  }
  const attemptRef = useRef<{ payload: string; key: string } | null>(null);
  const schema = useMemo(
    () =>
      z.object({
        reason: z.string().trim().min(1, t('approvals.required')).max(10000),
        amount: z
          .string()
          .refine(
            (v) => parseAmountCents(v) !== null,
            t('loanRequests.invalidAmount'),
          ),
        dueDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, t('approvals.required')),
        travelId: z
          .string()
          .refine(
            (v) => !v || options.travelSources.some((s) => s.id === v),
            t('loanRequests.invalidTravel'),
          ),
      }),
    [t, options.travelSources],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      reason: record?.reason ?? '',
      amount: record
        ? amountText(record.amountCents)
        : (params.get('amount') ?? ''),
      dueDate: record?.dueDate ?? '',
      travelId: record?.travelId ?? params.get('travelId') ?? '',
    },
  });
  useEffect(
    () => onDirty(form.formState.isDirty),
    [form.formState.isDirty, onDirty],
  );
  const allowed =
    !needsLatest &&
    permission.can &&
    !permission.isPending &&
    !permission.error &&
    (!detail ||
      detail.view.available.some((v) => v.name === 'edit' && v.allowed));
  useEffect(
    () => onReady(allowed && !committed),
    [allowed, committed, onReady],
  );
  async function submit(values: z.infer<typeof schema>) {
    if (!allowed || busy || committed) return;
    setBusy(true);
    onBusy(true);
    setError(undefined);
    const input = {
      reason: values.reason,
      amountCents: parseAmountCents(values.amount)!,
      dueDate: values.dueDate,
      travelId: values.travelId || null,
    };
    const payload = JSON.stringify({
      input,
      version,
    });
    if (attemptRef.current?.payload !== payload)
      attemptRef.current = { payload, key: createRequestId() };
    try {
      const draftRequestId = attemptRef.current.key;
      const savedRecord = await submission.save(
        input,
        record
          ? { ...record, lifecycleVersion: version ?? record.lifecycleVersion }
          : undefined,
        async (current) => {
          const { data } = await api.request<{
            data: { record: LoanRequestRecord };
          }>({
            method: 'POST',
            path: current
              ? `loanRequests/${current.id}/transition`
              : 'loanRequests',
            json: current
              ? {
                  transition: 'edit',
                  version: current.lifecycleVersion,
                  requestId: draftRequestId,
                  input,
                }
              : { ...input, requestId: draftRequestId },
          });
          return data.record;
        },
      );
      await submission.finish(savedRecord);

      setCommitted(true);
      onDirty(false);
      parent.reload();
      await close();
    } catch (e) {
      if (e instanceof ApiClientError && e.status === 409) setNeedsLatest(true);
      if (
        e instanceof ApiClientError &&
        e.reason === 'LOAN_REQUEST_INVALID_DATE'
      ) {
        form.setError('dueDate', { message: t('loanRequests.invalidDate') });
        document.getElementById('loan-due')?.focus();
      }
      if (
        e instanceof ApiClientError &&
        e.reason === 'LOAN_REQUEST_PERSONAL_LIMIT'
      ) {
        form.setError('amount', { message: t('loanRequests.errors.quota') });
        form.setFocus('amount');
      }
      setError(e);
    } finally {
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <form
      id='loan-form'
      onSubmitCapture={submission.captureIntent}
      onKeyDown={preventComposingSubmit}
      onSubmit={(event) => {
        void form.handleSubmit(submit)(event);
      }}
      className='flex flex-col gap-5'
    >
      {!allowed && !needsLatest ? (
        <Alert>
          <AlertDescription>{t('loanRequests.readOnly')}</AlertDescription>
        </Alert>
      ) : null}
      {!options.paymentAccountReady ? (
        <Alert>
          <AlertDescription>{t('loanRequests.bankMissing')}</AlertDescription>
        </Alert>
      ) : null}
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      {error ? (
        <ErrorState
          error={error}
          retry={() => {
            setError(undefined);
          }}
        />
      ) : null}
      {needsLatest ? (
        <section className='flex flex-col gap-3 rounded-md border border-border p-4'>
          <p className='text-sm'>{t('loanRequests.conflict')}</p>
          <Button
            type='button'
            variant='outline'
            disabled={loadingLatest}
            onClick={() => {
              void loadLatest();
            }}
          >
            {t('loanRequests.loadLatest')}
          </Button>
          {latest ? (
            <>
              <p className='text-sm whitespace-pre-wrap break-words'>
                {t('loanRequests.latestFacts', {
                  version: latest.record.lifecycleVersion,
                  amount: amountText(latest.record.amountCents),
                  date: latest.record.dueDate,
                  reason: latest.record.reason,
                })}
              </p>
              {latest.view.available.some(
                (v) => v.name === 'edit' && v.allowed,
              ) ? (
                <Button
                  type='button'
                  onClick={() => {
                    submission.adopt(latest.record);
                    setVersion(latest.record.lifecycleVersion);
                    setNeedsLatest(false);
                    setError(undefined);
                  }}
                >
                  {t('loanRequests.adoptVersion')}
                </Button>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {t('loanRequests.noLongerEditable')}
                </p>
              )}
            </>
          ) : null}
        </section>
      ) : null}
      <FieldGroup inert={submission.submitUnknown || undefined}>
        <Field data-invalid={!!form.formState.errors.reason}>
          <FieldLabel htmlFor='loan-reason'>
            {t('loanRequests.reason')} *
          </FieldLabel>
          <Textarea
            id='loan-reason'
            {...form.register('reason')}
            aria-invalid={!!form.formState.errors.reason}
            disabled={!allowed || busy || committed}
          />
          <FieldError errors={[form.formState.errors.reason]} />
        </Field>
        <Field data-invalid={!!form.formState.errors.amount}>
          <FieldLabel htmlFor='loan-amount'>
            {t('loanRequests.amount')} *
          </FieldLabel>
          <Input
            id='loan-amount'
            inputMode='decimal'
            {...form.register('amount')}
            aria-invalid={!!form.formState.errors.amount}
            disabled={!allowed || busy || committed}
          />
          <FieldDescription>{t('loanRequests.amountHint')}</FieldDescription>
          <FieldError errors={[form.formState.errors.amount]} />
        </Field>
        <Controller
          name='dueDate'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='loan-due'>
                {t('loanRequests.dueDate')} *
              </FieldLabel>
              <DatePicker
                id='loan-due'
                value={field.value ? parseISO(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                }
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                disabled={!allowed || busy || committed}
              />
              <FieldDescription>
                {t('loanRequests.companyDate', { zone: options.timeZone })}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name='travelId'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='loan-travel'>
                {t('loanRequests.travel')}
              </FieldLabel>
              <Select
                value={field.value || 'none'}
                onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                disabled={!allowed || busy || committed}
              >
                <SelectTrigger
                  id='loan-travel'
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value='none'>
                      {t('loanRequests.noTravel')}
                    </SelectItem>
                    {options.travelSources.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.number ?? s.id} · {amountText(s.amountCents)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
