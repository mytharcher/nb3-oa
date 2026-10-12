import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useLocation, useOutletContext, useParams } from 'react-router';
import { z } from 'zod';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { DepartmentPicker } from '#components/department-picker';
import { Button } from '#components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
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
import { Spinner } from '#components/ui/spinner';
import { createRequestId } from '../approvals/request-id.js';
import { fieldViolationsOf } from '../platform/shared/errors.js';
import { useBalanceResource } from './resource.js';
import { BudgetError, BudgetSkeleton } from './states.js';
import {
  BUDGET_SETTINGS,
  label,
  money,
  amountCents,
  type Budget,
  type Subject,
  type BudgetContext,
} from './types.js';
export default function BudgetFormDialog() {
  const { budgetId } = useParams(),
    { t } = useTranslation();
  const latest = useBalanceResource<{ data: Budget }>(
    budgetId ? `budgets/${encodeURIComponent(budgetId)}` : null,
  );
  const options = useBalanceResource<{ data: { subjects: Subject[] } }>(
    'budgets/options',
  );
  const [busy, setBusy] = useState(false),
    [discard, setDiscard] = useState(false);
  const busyRef = useRef(false),
    dirtyRef = useRef(false),
    resolverRef = useRef<((v: boolean) => void) | null>(null);
  const p = useCan({
    resource: { type: 'settings', id: BUDGET_SETTINGS },
    action: 'update',
  });
  const allowed = p.can && !p.isPending && !p.error;
  const ready =
    allowed &&
    !latest.loading &&
    !latest.error &&
    (!budgetId || !!latest.data) &&
    !!options.data &&
    !options.error;
  return (
    <>
      <RouteDialog
        title={t(`budgets.${budgetId ? 'adjustTitle' : 'new'}`)}
        description={t(
          budgetId ? 'budgets.adjustDescription' : 'budgets.newDescription',
        )}
        beforeClose={() => {
          if (busyRef.current) return false;
          if (!dirtyRef.current) return true;
          setDiscard(true);
          return new Promise<boolean>((resolve) => {
            resolverRef.current = resolve;
          });
        }}
        footer={<Footer busy={busy} disabled={!ready} />}
      >
        {latest.error ? (
          <BudgetError error={latest.error} retry={latest.reload} />
        ) : options.error ? (
          <BudgetError error={options.error} retry={options.reload} />
        ) : !allowed && !p.isPending ? (
          <Alert variant='destructive'>
            <AlertDescription>{t('budgets.error.forbidden')}</AlertDescription>
          </Alert>
        ) : !ready ? (
          <BudgetSkeleton />
        ) : (
          <BudgetForm
            key={budgetId ?? 'new'}
            budget={latest.data?.data}
            subjects={options.data!.data.subjects}
            onBusy={(v) => {
              busyRef.current = v;
              setBusy(v);
            }}
            onDirty={(v) => {
              dirtyRef.current = v;
            }}
          />
        )}
      </RouteDialog>
      <AlertDialog
        open={discard}
        onOpenChange={(v) => {
          if (!v) {
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
            <AlertDialogCancel>{t('budgets.cancel')}</AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={() => {
                dirtyRef.current = false;
                setDiscard(false);
                resolverRef.current?.(true);
                resolverRef.current = null;
              }}
            >
              {t('approvals.discardConfirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
function Footer({ busy, disabled }: { busy: boolean; disabled: boolean }) {
  const { close } = useRouteOverlay(),
    { t } = useTranslation();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('budgets.cancel')}
      </Button>
      <Button type='submit' form='budget-form' disabled={busy || disabled}>
        {busy ? <Spinner data-icon='inline-start' /> : null}
        {t('budgets.save')}
      </Button>
    </>
  );
}
function BudgetForm({
  budget,
  subjects,
  onBusy,
  onDirty,
}: {
  budget?: Budget;
  subjects: Subject[];
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay(),
    parent = useOutletContext<BudgetContext>(),
    location = useLocation();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const runningRef = useRef(false),
    attemptRef = useRef<{ key: string; requestKey: string } | null>(null);
  const [defaultYear] = useState(() => String(new Date().getFullYear()));
  const form = useForm({
    resolver: zodResolver(
      z.object({
        departmentId: z.string().min(1, t('budgets.required')),
        year: z
          .string()
          .regex(/^\d{4}$/, t('budgets.invalidYear'))
          .refine(
            (v) => Number(v) >= 1900 && Number(v) <= 9999,
            t('budgets.invalidYear'),
          ),
        subject: z.string().min(1, t('budgets.required')),
        deltaAmount: z.string().refine(
          (v) => {
            const n = amountCents(v);
            return n !== undefined && n !== 0 && (!!budget || n > 0);
          },
          t(budget ? 'budgets.invalidAmount' : 'budgets.positiveAmount'),
        ),
        reason: z
          .string()
          .trim()
          .min(1, t('budgets.required'))
          .max(4000, t('budgets.longReason')),
      }),
    ),
    defaultValues: {
      departmentId: budget?.departmentId ?? '',
      year: budget ? String(budget.year) : defaultYear,
      subject: budget?.subject ?? '',
      deltaAmount: '',
      reason: '',
    },
  });
  const existing = useBalanceResource<{
    data: Budget[];
    meta: { total: number };
  }>(
    error instanceof ApiClientError && error.reason === 'BUDGET_ALREADY_EXISTS'
      ? 'budgets'
      : null,
    {
      departmentId: form.getValues('departmentId'),
      year: form.getValues('year'),
      subject: form.getValues('subject'),
    },
  );
  // Dirty state is read by the route close guard; transient requests never replace the user's input.
  useEffect(
    () => onDirty(form.formState.isDirty),
    [onDirty, form.formState.isDirty],
  );
  async function save(values: {
    departmentId: string;
    year: string;
    subject: string;
    deltaAmount: string;
    reason: string;
  }) {
    if (runningRef.current) return;
    runningRef.current = true;
    setBusy(true);
    onBusy(true);
    setError(undefined);
    const payload = budget
      ? { deltaAmount: values.deltaAmount, reason: values.reason }
      : { ...values, year: Number(values.year) };
    const key = JSON.stringify([budget?.id, payload]);
    if (attemptRef.current?.key !== key)
      attemptRef.current = { key, requestKey: createRequestId() };
    try {
      const result = await api.request<{ data: Budget }>({
        method: 'POST',
        path: budget
          ? `budgets/${encodeURIComponent(budget.id)}/adjustments`
          : 'budgets/allocations',
        json: { ...payload, requestKey: attemptRef.current.requestKey },
      });
      parent.onSaved(result.data);
      toaster.show({
        type: 'success',
        title: t('budgets.saved', { name: result.data.department.title }),
      });
      form.reset(values);
      onDirty(false);
      onBusy(false);
      setBusy(false);
      await close();
    } catch (e) {
      setError(e);
      for (const field of fieldViolationsOf(e))
        if (
          ['departmentId', 'year', 'subject', 'deltaAmount', 'reason'].includes(
            field,
          )
        )
          form.setError(field as keyof typeof values, {
            message: t('budgets.invalidField'),
          });
    } finally {
      runningRef.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  const submit = (event?: FormEvent<HTMLFormElement>) =>
    form.handleSubmit(save)(event);
  const selected = budget ? label(budget.subjectLabel, i18n.language) : '';
  const conflictAccount = existing.data?.data.find(
    (b) =>
      b.departmentId === form.getValues('departmentId') &&
      b.year === Number(form.getValues('year')) &&
      b.subject === form.getValues('subject'),
  );
  return (
    <form
      id='budget-form'
      className='flex flex-col gap-4'
      onSubmit={(event) => void submit(event)}
    >
      {error ? (
        <>
          <BudgetError error={error} retry={() => void submit()} />
          {conflictAccount ? (
            <Button
              variant='outline'
              render={
                <Link
                  to={{
                    pathname: `../${conflictAccount.id}`,
                    search: location.search,
                  }}
                />
              }
            >
              {t('budgets.openExisting')}
            </Button>
          ) : null}
        </>
      ) : null}
      {budget ? (
        <p className='text-sm text-muted-foreground'>
          {t('budgets.currentAccount', {
            department: budget.department.title,
            year: budget.year,
            subject: selected,
            amount: money(budget.allocatedCents, i18n.language),
          })}
        </p>
      ) : null}
      <FieldGroup>
        {!budget ? (
          <>
            <Controller
              control={form.control}
              name='departmentId'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='budget-form-department'>
                    {t('budgets.department')} *
                  </FieldLabel>
                  <DepartmentPicker
                    id='budget-form-department'
                    value={field.value}
                    onChange={field.onChange}
                    disabled={busy}
                    invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name='year'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='budget-form-year'>
                    {t('budgets.year')} *
                  </FieldLabel>
                  <Input
                    id='budget-form-year'
                    inputMode='numeric'
                    {...field}
                    disabled={busy}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name='subject'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor='budget-form-subject'>
                    {t('budgets.subject')} *
                  </FieldLabel>
                  <Select
                    items={subjects
                      .filter((s) => s.active)
                      .map((s) => ({
                        value: s.code,
                        label: label(s.label, i18n.language),
                      }))}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={busy}
                  >
                    <SelectTrigger
                      id='budget-form-subject'
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder={t('budgets.selectSubject')} />
                    </SelectTrigger>
                    <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                      <SelectGroup>
                        {subjects
                          .filter((s) => s.active)
                          .map((s) => (
                            <SelectItem key={s.code} value={s.code}>
                              {label(s.label, i18n.language)}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </>
        ) : null}
        <Controller
          control={form.control}
          name='deltaAmount'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='budget-form-amount'>
                {t(budget ? 'budgets.changeAmount' : 'budgets.amount')} *
              </FieldLabel>
              <Input
                id='budget-form-amount'
                inputMode='decimal'
                {...field}
                disabled={busy}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                {t(budget ? 'budgets.deltaHint' : 'budgets.amountHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='reason'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='budget-form-reason'>
                {t('budgets.reason')} *
              </FieldLabel>
              <Textarea
                id='budget-form-reason'
                {...field}
                disabled={busy}
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
