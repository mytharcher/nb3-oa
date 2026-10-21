import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { useDiscardGuard } from './use-discard-guard.js';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { BackButton } from '#components/back-button';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteFormPage } from '#components/route-form-page';
import { DatePicker } from '#components/date-picker';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldLabel,
  FieldError,
  FieldDescription,
  FieldGroup,
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
import { FieldsSkeleton } from '../platform/shared/states.js';
import { fieldViolationsOf } from '../platform/shared/errors.js';
import { useResource } from '../approvals/use-resource.js';
import { createRequestId } from '../approvals/request-id.js';
import { ErrorState } from './states.js';
import { parseAmountCents, amountText, quantityText } from './money.js';
import { subjectLabel, type PurchaseOptions } from './options.js';
import type {
  PurchaseDetail,
  PurchaseRecord,
  SourceContext,
  DetailContext,
} from './types.js';
export default function PurchaseFormPage() {
  const { t: drawerTitle } = useTranslation();
  const { requestId } = useParams(),
    parent = useOutletContext<SourceContext & Partial<DetailContext>>(),
    resource = useResource<PurchaseDetail>(
      requestId ? `purchaseRequests/${encodeURIComponent(requestId)}` : null,
    ),
    can = useCan({
      resource: { type: 'composite', id: 'oa.purchase' },
      action: 'submit',
    });
  useEffect(() => {
    if (
      resource.error instanceof ApiClientError &&
      resource.error.status === 404
    )
      parent.reload();
  }, [resource.error, parent]);
  return (
    <RouteFormPage
      printable
      title={drawerTitle(requestId ? 'purchases.edit' : 'purchases.new')}
    >
      <PageContainer>
        <BackButton />
        {resource.error && !resource.data ? (
          <ErrorState error={resource.error} retry={resource.reload} />
        ) : requestId && !resource.data ? (
          <FieldsSkeleton fields={8} />
        ) : (
          <PurchaseForm
            key={requestId ?? 'new'}
            detail={resource.data}
            sourceReady={!requestId || (!resource.loading && !resource.error)}
            allowed={
              requestId
                ? !!resource.data?.view.available.some(
                    (a) => a.name === 'edit' && a.allowed,
                  )
                : can.can
            }
            reload={parent.reload}
            update={parent.update}
          />
        )}
      </PageContainer>
    </RouteFormPage>
  );
}
function PurchaseForm({
  detail,
  sourceReady,
  allowed,
  reload,
  update,
}: {
  detail?: PurchaseDetail;
  sourceReady: boolean;
  allowed: boolean;
  reload: () => void;
  update?: DetailContext['update'];
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    navigate = useNavigate(),
    location = useLocation(),
    options = useResource<PurchaseOptions>('purchaseRequests/options'),
    initialRecord = detail?.record;
  const [replacement, setReplacement] = useState<PurchaseDetail>();
  const record = replacement?.record ?? initialRecord;
  const currentAllowed = replacement
    ? replacement.view.available.some((a) => a.name === 'edit' && a.allowed)
    : allowed;
  const schema = useMemo(
    () =>
      z.object({
        items: z
          .array(
            z.object({
              id: z.string().min(1),
              name: z.string().trim().min(1, t('approvals.required')).max(255),
              specification: z.string().max(2000),
              quantity: z
                .string()
                .refine(
                  (v) => quantityText(v) !== undefined,
                  t('purchases.quantityInvalid'),
                ),
              unit: z.string().trim().min(1, t('approvals.required')).max(64),
            }),
          )
          .min(1)
          .max(100),
        subject: z.string().min(1, t('approvals.required')),
        amount: z
          .string()
          .refine(
            (v) => parseAmountCents(v) !== null,
            t('purchases.amountInvalid'),
          ),
        expectedDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, t('purchases.dateInvalid')),
        suggestedVendorId: z.string(),
        purpose: z.string().trim().min(1, t('approvals.required')).max(10000),
      }),
    [t],
  );
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
      resolver: zodResolver(schema),
      defaultValues: {
        items: record?.items ?? [
          {
            id: createRequestId(),
            name: '',
            specification: '',
            quantity: '1',
            unit: '',
          },
        ],
        subject: record?.subject ?? '',
        amount: record ? amountText(record.estimatedCents) : '',
        expectedDate: record?.expectedDate ?? '',
        suggestedVendorId: record?.suggestedVendorId ?? '',
        purpose: record?.purpose ?? '',
      },
    }),
    items = useFieldArray({
      control: form.control,
      name: 'items',
      keyName: 'fieldKey',
    });
  const [error, setError] = useState<unknown>(),
    [unknown, setUnknown] = useState(false),
    [saved, setSaved] = useState(false),
    [checking, setChecking] = useState(false),
    [busy, setBusy] = useState(false),
    busyRef = useRef(false),
    savedRef = useRef(false),
    errorRef = useRef<HTMLDivElement>(null),
    commandRef = useRef<{ key: string; requestId: string } | undefined>(
      undefined,
    );
  const dirty = form.formState.isDirty && !saved,
    locked =
      busy ||
      unknown ||
      saved ||
      !currentAllowed ||
      !sourceReady ||
      options.loading ||
      !!options.error;
  const discardDialog = useDiscardGuard(
    dirty,
    busy || unknown || checking,
    saved,
  );
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);
  useEffect(() => {
    if (
      error &&
      !busy &&
      !fieldViolationsOf(error).length &&
      !(
        error instanceof ApiClientError &&
        error.reason === 'BUDGET_INSUFFICIENT'
      )
    )
      errorRef.current?.focus();
  }, [error, busy]);
  const submission = useRequestFormSubmission<PurchaseRecord>({
    resource: 'purchaseRequests',
  });
  async function save(values: Values) {
    if (busyRef.current || locked) return;
    const subject = options.data?.subjects.find(
        (s) => s.code === values.subject,
      ),
      vendor = values.suggestedVendorId
        ? options.data?.vendors.find((v) => v.id === values.suggestedVendorId)
        : undefined;
    if (!subject?.active) {
      form.setError('subject', { message: t('purchases.subjectInactive') });
      form.setFocus('subject');
      return;
    }
    if (values.suggestedVendorId && !vendor?.active) {
      form.setError('suggestedVendorId', {
        message: t('purchases.vendorInactive'),
      });
      form.setFocus('suggestedVendorId');
      return;
    }
    const input = {
      items: values.items.map((item) => ({
        ...item,
        quantity: quantityText(item.quantity)!,
      })),
      subject: values.subject,
      estimatedCents: parseAmountCents(values.amount)!,
      expectedDate: values.expectedDate,
      suggestedVendorId: values.suggestedVendorId || null,
      purpose: values.purpose,
    };
    const key = JSON.stringify(input);
    if (commandRef.current?.key !== key)
      commandRef.current = { key, requestId: createRequestId() };
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const draftRequestId = commandRef.current.requestId;
      const savedRecord = await submission.save(
        input,
        record,
        async (current) => {
          const result = await api.request<{
            data: { record: PurchaseRecord };
          }>({
            method: 'POST',
            path: current
              ? `purchaseRequests/${current.id}/transition`
              : 'purchaseRequests',
            json: current
              ? {
                  transition: 'edit',
                  version: current.lifecycleVersion,
                  requestId: draftRequestId,
                  input,
                }
              : input,
          });
          return result.data.record;
        },
      );
      const result = { data: { record: await submission.finish(savedRecord) } };

      savedRef.current = true;
      setSaved(true);
      form.reset(values);
      update?.(result.data.record);
      reload();
      toaster.show({
        type: 'success',
        title: t(
          submission.intent.current === 'submit'
            ? 'approvals.submitted'
            : 'purchases.saved',
          { name: result.data.record.number ?? t('approvals.draft') },
        ),
      });
      await navigate(
        {
          pathname:
            record || submission.intent.current === 'submit'
              ? '..'
              : `../purchase/${result.data.record.id}`,
          search: location.search,
        },
        { relative: 'route', replace: true },
      );
    } catch (failure) {
      setError(failure);
      const fields = (
        failure instanceof ApiClientError &&
        failure.reason === 'BUDGET_INSUFFICIENT'
          ? ['estimatedCents']
          : fieldViolationsOf(failure)
      ).map((field) => (field === 'estimatedCents' ? 'amount' : field));
      for (const field of fields)
        form.setError(field as keyof Values, {
          message: t('purchases.fieldInvalid'),
        });
      if (fields[0]) {
        form.setFocus(fields[0] as keyof Values);
        if (fields[0] === 'expectedDate')
          document.getElementById('purchase-date')?.focus();
      }
      if (
        !submission.current.current &&
        (!(failure instanceof ApiClientError) || failure.status >= 500)
      )
        setUnknown(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  async function verify() {
    if (!record || checking) return;
    setChecking(true);
    try {
      const latest = (
        await api.request<{ data: PurchaseDetail }>({
          path: `purchaseRequests/${record.id}`,
        })
      ).data;
      if (latest.record.lifecycleVersion === record.lifecycleVersion) {
        setUnknown(false);
        setError(undefined);
      } else {
        submission.adopt(latest.record);
        setReplacement(latest);
        commandRef.current = undefined;
        setUnknown(false);
        setError(undefined);
        reload();
      }
    } catch (failure) {
      setError(failure);
    } finally {
      setChecking(false);
    }
  }
  return (
    <>
      {discardDialog}
      {replacement ? (
        <Alert>
          <AlertDescription>
            {t('purchases.localInputsRetained')}
          </AlertDescription>
        </Alert>
      ) : null}
      <PageHeader
        title={t(record ? 'purchases.edit' : 'purchases.new')}
        description={t('purchases.formDescription')}
        actions={
          <>
            <Button
              type='button'
              variant='outline'
              disabled={busy || unknown || checking}
              onClick={() => {
                void navigate({
                  pathname: '..',
                  search: location.search,
                  hash: location.hash,
                });
              }}
            >
              {t('approvals.cancel')}
            </Button>
            <RequestFormButtons
              revision={record?.status === 'revision'}
              resource='oa.purchase'
              form='purchase-form'
              busy={busy}
              disabled={
                !currentAllowed ||
                unknown ||
                checking ||
                !options.data ||
                !!options.error ||
                options.loading
              }
            />
          </>
        }
      />
      {!currentAllowed ? (
        <Alert>
          <AlertDescription>
            {t('approvals.noAvailableAction')}
          </AlertDescription>
        </Alert>
      ) : null}
      {options.error ? (
        <ErrorState error={options.error} retry={options.reload} />
      ) : null}
      {error ? (
        <div ref={errorRef} tabIndex={-1} className='outline-none'>
          <ErrorState error={error} retry={options.reload} />
        </div>
      ) : null}
      {unknown ? (
        <Alert>
          <AlertDescription>
            <p>
              {t(record ? 'purchases.unknownEdit' : 'purchases.unknownCreate')}
            </p>
            {record ? (
              <Button
                className='mt-3'
                variant='outline'
                disabled={checking || busy}
                onClick={() => void verify()}
              >
                {t('purchases.loadLatest')}
              </Button>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      <form
        id='purchase-form'
        onSubmitCapture={submission.captureIntent}
        onKeyDown={preventComposingSubmit}
        className='max-w-4xl'
        onSubmit={(event) => {
          void form.handleSubmit(save)(event);
        }}
      >
        <FieldGroup inert={submission.submitUnknown || undefined}>
          <p className='text-sm text-muted-foreground'>
            {t('purchases.primaryDepartment', {
              department:
                options.data?.department?.title ??
                t('purchases.departmentMissing'),
            })}
          </p>
          <p className='text-sm text-muted-foreground'>
            {t('purchases.yearHint', {
              timeZone: options.data?.timeZone ?? '—',
            })}
          </p>
          <Field>
            <FieldLabel htmlFor='purchase-purpose'>
              {t('purchases.purpose')} *
            </FieldLabel>
            <Textarea
              id='purchase-purpose'
              disabled={
                !currentAllowed ||
                unknown ||
                checking ||
                !options.data ||
                !!options.error ||
                options.loading
              }
              {...form.register('purpose')}
            />
            <FieldError errors={[form.formState.errors.purpose]} />
          </Field>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Controller
              name='subject'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor='purchase-subject'>
                    {t('purchases.subject')} *
                  </FieldLabel>
                  <Select
                    value={field.value || null}
                    onValueChange={(v) => field.onChange(v ?? '')}
                    disabled={
                      !currentAllowed ||
                      unknown ||
                      checking ||
                      !options.data ||
                      !!options.error ||
                      options.loading
                    }
                  >
                    <SelectTrigger
                      id='purchase-subject'
                      ref={field.ref}
                      aria-invalid={fieldState.invalid}
                      className='w-full'
                    >
                      <SelectValue>
                        {subjectLabel(
                          options.data?.subjects.find(
                            (s) => s.code === field.value,
                          ),
                          field.value,
                          i18n.language,
                        ) || t('purchases.selectSubject')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                      <SelectGroup>
                        {options.data?.subjects.map((s) => (
                          <SelectItem
                            key={s.code}
                            value={s.code}
                            disabled={!s.active}
                          >
                            <span className='whitespace-normal break-words'>
                              {subjectLabel(s, s.code, i18n.language)}
                              {!s.active ? ` (${t('purchases.disabled')})` : ''}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor='purchase-amount'>
                {t('purchases.estimated')} *
              </FieldLabel>
              <Input
                id='purchase-amount'
                inputMode='decimal'
                disabled={
                  !currentAllowed ||
                  unknown ||
                  checking ||
                  !options.data ||
                  !!options.error ||
                  options.loading
                }
                {...form.register('amount')}
              />
              <FieldDescription>{t('purchases.amountHint')}</FieldDescription>
              <FieldError errors={[form.formState.errors.amount]} />
            </Field>
          </div>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Controller
              name='expectedDate'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor='purchase-date'>
                    {t('purchases.expectedDate')} *
                  </FieldLabel>
                  <DatePicker
                    id='purchase-date'
                    className='w-full'
                    value={field.value ? parseISO(field.value) : undefined}
                    onChange={(v) =>
                      field.onChange(v ? format(v, 'yyyy-MM-dd') : '')
                    }
                    disabled={
                      !currentAllowed ||
                      unknown ||
                      checking ||
                      !options.data ||
                      !!options.error ||
                      options.loading
                    }
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Controller
              name='suggestedVendorId'
              control={form.control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel htmlFor='purchase-vendor'>
                    {t('purchases.suggestedVendor')}
                  </FieldLabel>
                  <Select
                    value={field.value || 'none'}
                    onValueChange={(v) =>
                      field.onChange(v === 'none' ? '' : (v ?? ''))
                    }
                    disabled={
                      !currentAllowed ||
                      unknown ||
                      checking ||
                      !options.data ||
                      !!options.error ||
                      options.loading
                    }
                  >
                    <SelectTrigger
                      id='purchase-vendor'
                      ref={field.ref}
                      className='w-full'
                    >
                      <SelectValue>
                        {field.value
                          ? (options.data?.vendors.find(
                              (v) => v.id === field.value,
                            )?.name ?? t('purchases.vendorUnavailable'))
                          : t('purchases.noSuggestedVendor')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                      <SelectGroup>
                        <SelectItem value='none'>
                          {t('purchases.noSuggestedVendor')}
                        </SelectItem>
                        {options.data?.vendors.map((v) => (
                          <SelectItem
                            key={v.id}
                            value={v.id}
                            disabled={!v.active}
                          >
                            <span className='whitespace-normal break-words'>
                              {v.name} · {v.category}
                              {!v.active ? ` (${t('purchases.disabled')})` : ''}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </div>
          <section className='flex flex-col gap-4'>
            <h2 className='text-base font-medium'>{t('purchases.items')}</h2>
            {items.fields.map((item, index) => (
              <div
                key={item.fieldKey}
                className='rounded-md border border-border p-4'
              >
                <FieldGroup inert={submission.submitUnknown || undefined}>
                  <p className='font-medium'>
                    {t('purchases.itemNumber', { number: index + 1 })}
                  </p>
                  <Field>
                    <FieldLabel htmlFor={`item-${item.id}-name`}>
                      {t('purchases.itemName')} *
                    </FieldLabel>
                    <Input
                      id={`item-${item.id}-name`}
                      disabled={
                        !currentAllowed ||
                        unknown ||
                        checking ||
                        !options.data ||
                        !!options.error ||
                        options.loading
                      }
                      {...form.register(`items.${index}.name`)}
                    />
                    <FieldError
                      errors={[form.formState.errors.items?.[index]?.name]}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`item-${item.id}-spec`}>
                      {t('purchases.specification')}
                    </FieldLabel>
                    <Textarea
                      id={`item-${item.id}-spec`}
                      disabled={
                        !currentAllowed ||
                        unknown ||
                        checking ||
                        !options.data ||
                        !!options.error ||
                        options.loading
                      }
                      {...form.register(`items.${index}.specification`)}
                    />
                    <FieldError
                      errors={[
                        form.formState.errors.items?.[index]?.specification,
                      ]}
                    />
                  </Field>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <Field>
                      <FieldLabel htmlFor={`item-${item.id}-quantity`}>
                        {t('purchases.quantity')} *
                      </FieldLabel>
                      <Input
                        id={`item-${item.id}-quantity`}
                        inputMode='decimal'
                        disabled={
                          !currentAllowed ||
                          unknown ||
                          checking ||
                          !options.data ||
                          !!options.error ||
                          options.loading
                        }
                        {...form.register(`items.${index}.quantity`)}
                      />
                      <FieldError
                        errors={[
                          form.formState.errors.items?.[index]?.quantity,
                        ]}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`item-${item.id}-unit`}>
                        {t('purchases.unit')} *
                      </FieldLabel>
                      <Input
                        id={`item-${item.id}-unit`}
                        disabled={
                          !currentAllowed ||
                          unknown ||
                          checking ||
                          !options.data ||
                          !!options.error ||
                          options.loading
                        }
                        {...form.register(`items.${index}.unit`)}
                      />
                      <FieldError
                        errors={[form.formState.errors.items?.[index]?.unit]}
                      />
                    </Field>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    className='self-start'
                    disabled={locked || items.fields.length === 1}
                    onClick={() => items.remove(index)}
                  >
                    {t('purchases.removeItem')}
                  </Button>
                </FieldGroup>
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              className='self-start'
              disabled={locked || items.fields.length >= 100}
              onClick={() =>
                items.append({
                  id: createRequestId(),
                  name: '',
                  specification: '',
                  quantity: '1',
                  unit: '',
                })
              }
            >
              {t('purchases.addItem')}
            </Button>
            <p className='text-sm text-muted-foreground'>
              {t('purchases.quantityHint')}
            </p>
          </section>
          <p className='text-sm text-muted-foreground'>
            {t('purchases.reserveHint')}
          </p>
        </FieldGroup>
      </form>
    </>
  );
}
