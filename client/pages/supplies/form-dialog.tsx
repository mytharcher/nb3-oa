import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { Minus } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch, useFieldArray } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { useResource } from '../approvals/use-resource.js';
import { createRequestId } from '../approvals/request-id.js';
import { ErrorState } from './states.js';
import type {
  SupplyDetail,
  SupplyRecord,
  SourceContext,
  DetailContext,
} from './types.js';
export default function SupplyFormDialog() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const parentReload = parent.reload;
  const resource = useResource<SupplyDetail>(
    requestId ? `supplyRequests/${encodeURIComponent(requestId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const [done, setDone] = useState(false);
  const [discard, setDiscard] = useState(false);
  const resolveCloseRef = useRef<((allowed: boolean) => void) | null>(null);
  const submit = useCan({
    resource: { type: 'composite', id: 'oa.supplies' },
    action: 'submit',
  }).can;
  const allowed = requestId
    ? resource.data?.view.available.some((a) => a.name === 'edit' && a.allowed)
    : submit;
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
      title={t(requestId ? 'supplies.edit' : 'supplies.new')}
      description={t('supplies.formDescription')}
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
        <FieldsSkeleton fields={5} />
      ) : (
        <SupplyForm
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
        resource='oa.supplies'
        form='supplyRequests-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
interface OfficeItem {
  code: string;
  label: Record<string, string>;
  active: boolean;
  extra: { requiresPrintInfo: boolean };
}
const PRINT_FIELDS = [
  'name',
  'title',
  'phone',
  'email',
  'address',
  'department',
] as const;
const emptyPrint = () =>
  Object.fromEntries(PRINT_FIELDS.map((key) => [key, ''])) as Record<
    (typeof PRINT_FIELDS)[number],
    string
  >;
function SupplyForm({
  detail,
  allowed,
  reload,
  onBusy,
  onDirty,
  onDone,
  onReady,
}: {
  detail?: SupplyDetail;
  allowed: boolean;
  reload: () => void;
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
  onDone: () => void;
  onReady: (ready: boolean) => void;
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay();
  const parent = useOutletContext<SourceContext & Partial<DetailContext>>();
  const options = useResource<{ officeItems: OfficeItem[] }>(
    'supplyRequests/options',
  );
  const [saving, setSaving] = useState(false),
    [unknownDetail, setUnknownDetail] = useState<SupplyDetail | null>(null);
  const unknownEdit = !!unknownDetail && unknownDetail === detail;
  const [error, setError] = useState<unknown>(),
    [uncertain, setUncertain] = useState(false),
    [saved, setSaved] = useState(false);
  const runningRef = useRef(false),
    uncertainRef = useRef(false),
    attemptRef = useRef<{ key: string; requestId: string } | null>(null);
  useEffect(() => {
    onReady(
      !!options.data &&
        !options.loading &&
        !options.error &&
        options.data.officeItems.length > 0 &&
        !unknownEdit &&
        !uncertain &&
        !saved,
    );
  }, [
    options.data,
    options.loading,
    options.error,
    onReady,
    unknownEdit,
    uncertain,
    saved,
  ]);
  const catalog = useMemo(
    () => options.data?.officeItems ?? [],
    [options.data],
  );
  const requiresPrint = (code: string) =>
    detail?.record.status === 'exception' && detail.record.itemSnapshot?.[code]
      ? detail.record.itemSnapshot[code].extra.requiresPrintInfo
      : catalog.find((item) => item.code === code)?.extra.requiresPrintInfo ===
        true;
  const submission = useRequestFormSubmission<SupplyRecord>({
    resource: 'supplyRequests',
  });
  const schema = useMemo(
    () =>
      z
        .object({
          purpose: z
            .string()
            .trim()
            .min(1, t('approvals.required'))
            .max(10000, t('approvals.limit')),
          items: z
            .array(
              z.object({
                code: z.string().min(1, t('approvals.required')),
                quantity: z
                  .number()
                  .int()
                  .min(1, t('supplies.quantityInvalid'))
                  .max(100000, t('approvals.limit')),
                printInfo: z.object({
                  name: z.string().max(200),
                  title: z.string().max(200),
                  phone: z.string().max(100),
                  email: z.string().max(254),
                  address: z.string().max(500),
                  department: z.string().max(200),
                }),
              }),
            )
            .min(1, t('approvals.required'))
            .max(100, t('approvals.limit')),
        })
        .superRefine((value, ctx) => {
          const seen = new Set<string>();
          value.items.forEach((item, index) => {
            if (seen.has(item.code))
              ctx.addIssue({
                code: 'custom',
                path: ['items', index, 'code'],
                message: t('supplies.duplicate'),
              });
            seen.add(item.code);
            const needsPrint =
              detail?.record.status === 'exception' &&
              detail.record.itemSnapshot?.[item.code]
                ? detail.record.itemSnapshot[item.code].extra.requiresPrintInfo
                : catalog.find((entry) => entry.code === item.code)?.extra
                    .requiresPrintInfo === true;
            if (needsPrint)
              for (const key of PRINT_FIELDS) {
                if (key !== 'department' && !item.printInfo[key].trim())
                  ctx.addIssue({
                    code: 'custom',
                    path: ['items', index, 'printInfo', key],
                    message: t('approvals.required'),
                  });
              }
            if (
              needsPrint &&
              item.printInfo.email &&
              !z.email().safeParse(item.printInfo.email).success
            )
              ctx.addIssue({
                code: 'custom',
                path: ['items', index, 'printInfo', 'email'],
                message: t('supplies.emailInvalid'),
              });
          });
        }),
    [t, catalog, detail],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      purpose: detail?.record.purpose ?? '',
      items: detail?.record.items.map((item) => ({
        ...item,
        printInfo: { ...emptyPrint(), ...item.printInfo },
      })) ?? [{ code: '', quantity: 1, printInfo: emptyPrint() }],
    },
  });
  const lines = useFieldArray({ control: form.control, name: 'items' }),
    values = useWatch({ control: form.control });
  useEffect(
    () => onDirty(form.formState.isDirty),
    [form.formState.isDirty, onDirty],
  );
  const label = (code: string) => {
    const frozen = detail?.record.itemSnapshot?.[code]?.label,
      live = catalog.find((item) => item.code === code)?.label;
    const source = frozen ?? live;
    return (
      source?.[i18n.language] ?? source?.['zh-CN'] ?? source?.['en-US'] ?? code
    );
  };
  async function save(value: z.infer<typeof schema>) {
    if (!allowed || runningRef.current || uncertainRef.current || !options.data)
      return;
    runningRef.current = true;
    setSaving(true);
    onBusy(true);
    setError(undefined);
    const input = {
      purpose: value.purpose,
      items: value.items.map((item) => ({
        code: item.code,
        quantity: item.quantity,
        ...(requiresPrint(item.code) ? { printInfo: item.printInfo } : {}),
      })),
    };
    try {
      const key = JSON.stringify({
        version: detail?.record.lifecycleVersion,
        input,
      });
      if (attemptRef.current?.key !== key)
        attemptRef.current = { key, requestId: createRequestId() };
      const draftRequestId = attemptRef.current.requestId;
      const savedRecord = await submission.save(
        input,
        detail?.record,
        async (current) => {
          const response = await api.request<{
            data: { record: SupplyRecord };
          }>({
            method: 'POST',
            path: current
              ? `supplyRequests/${current.id}/transition`
              : 'supplyRequests',
            json: current
              ? {
                  transition: 'edit',
                  version: current.lifecycleVersion,
                  requestId: draftRequestId,
                  input,
                }
              : input,
          });
          return response.data.record;
        },
      );
      const response = {
        data: { record: await submission.finish(savedRecord) },
      };
      setSaved(true);
      onDone();
      form.reset(value);
      onDirty(false);
      parent.update?.(response.data.record);
      parent.reload();
      toaster.show({
        type: 'success',
        title: t(
          submission.intent.current === 'submit'
            ? 'approvals.submitted'
            : 'approvals.saved',
          {
            name: response.data.record.number ?? t('approvals.draft'),
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
      if (
        !detail &&
        !submission.current.current &&
        (!(failure instanceof ApiClientError) || failure.status >= 500)
      ) {
        uncertainRef.current = true;
        setUncertain(true);
      }
      if (
        failure instanceof ApiClientError &&
        [
          'SUPPLY_PRINT_INFO_REQUIRED',
          'SUPPLY_INVALID_ITEMS',
          'SUPPLY_ITEM_UNAVAILABLE',
        ].includes(failure.reason ?? '')
      ) {
        const index = Math.max(
          0,
          value.items.findIndex((item) => requiresPrint(item.code)),
        );
        const field =
          failure.reason === 'SUPPLY_PRINT_INFO_REQUIRED'
            ? (`items.${index}.printInfo.name` as const)
            : (`items.${index}.code` as const);
        form.setError(field, {
          message: t(
            failure.reason === 'SUPPLY_PRINT_INFO_REQUIRED'
              ? 'supplies.printRequired'
              : 'supplies.invalid',
          ),
        });
        form.setFocus(field);
      } else setError(failure);
    } finally {
      runningRef.current = false;
      setSaving(false);
      onBusy(false);
    }
  }
  const locked = !allowed || saved || uncertain || saving || unknownEdit;
  return (
    <form
      id='supplyRequests-form'
      onSubmitCapture={submission.captureIntent}
      onKeyDown={preventComposingSubmit}
      onSubmit={(event) => {
        void form.handleSubmit(save)(event);
      }}
      className='flex flex-col gap-6'
    >
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      {!allowed ? (
        <Alert>
          <AlertDescription>{t('approvals.readOnly')}</AlertDescription>
        </Alert>
      ) : null}
      {error ? <ErrorState error={error} retry={reload} /> : null}
      {uncertain ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('supplies.uncertainCreate')}</AlertDescription>
        </Alert>
      ) : null}
      {unknownEdit ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('supplies.unknownEdit')}
            <Button
              type='button'
              variant='outline'
              disabled={saving}
              onClick={reload}
            >
              {t('approvals.loadLatest')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {options.data?.officeItems.length === 0 ? (
        <Alert>
          <AlertDescription>{t('supplies.emptyCatalog')}</AlertDescription>
        </Alert>
      ) : null}
      {options.error ? (
        <ErrorState error={options.error} retry={options.reload} />
      ) : null}
      {options.loading ? <FieldsSkeleton fields={3} /> : null}
      {detail?.record.status === 'exception' ? (
        <Alert>
          <AlertDescription>{t('supplies.resubmitHint')}</AlertDescription>
        </Alert>
      ) : null}
      <FieldGroup inert={submission.submitUnknown || undefined}>
        <Field data-invalid={!!form.formState.errors.purpose}>
          <FieldLabel htmlFor='supply-purpose'>
            {t('supplies.purpose')}{' '}
            <span aria-hidden='true' className='text-destructive'>
              *
            </span>
          </FieldLabel>
          <Textarea
            id='supply-purpose'
            disabled={locked}
            aria-invalid={!!form.formState.errors.purpose}
            {...form.register('purpose')}
          />
          <FieldError errors={[form.formState.errors.purpose]} />
        </Field>
        {lines.fields.map((line, index) => {
          const code = values.items?.[index]?.code ?? '';
          const print = requiresPrint(code);
          const items = [...catalog];
          if (code && !items.some((item) => item.code === code))
            items.push({
              code,
              label: detail?.record.itemSnapshot?.[code]?.label ?? {},
              active: false,
              extra: { requiresPrintInfo: print },
            });
          return (
            <section
              key={line.id}
              className='flex flex-col gap-4 rounded-md border p-4'
            >
              <div className='flex items-center justify-between gap-2'>
                <h2 className='text-sm font-medium'>
                  {t('supplies.line', { number: index + 1 })}
                </h2>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  aria-label={t('supplies.remove', { number: index + 1 })}
                  disabled={locked || lines.fields.length === 1}
                  onClick={() => lines.remove(index)}
                >
                  <Minus />
                </Button>
              </div>
              <div className='grid gap-4 sm:grid-cols-[1fr_8rem]'>
                <Controller
                  control={form.control}
                  name={`items.${index}.code`}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={!!fieldState.error}>
                      <FieldLabel htmlFor={`supply-item-${index}`}>
                        {t('supplies.item')}{' '}
                        <span aria-hidden='true' className='text-destructive'>
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => field.onChange(v ?? '')}
                        disabled={locked || options.loading}
                      >
                        <SelectTrigger
                          id={`supply-item-${index}`}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          aria-invalid={!!fieldState.error}
                        >
                          <SelectValue>
                            {code ? label(code) : t('supplies.chooseItem')}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                          <SelectGroup>
                            {items.map((item) => (
                              <SelectItem key={item.code} value={item.code}>
                                <span className='whitespace-normal break-words'>
                                  {label(item.code)}
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
                <Field
                  data-invalid={
                    !!form.formState.errors.items?.[index]?.quantity
                  }
                >
                  <FieldLabel htmlFor={`supply-quantity-${index}`}>
                    {t('supplies.quantity')}{' '}
                    <span aria-hidden='true' className='text-destructive'>
                      *
                    </span>
                  </FieldLabel>
                  <Input
                    id={`supply-quantity-${index}`}
                    type='number'
                    min={1}
                    max={100000}
                    step={1}
                    disabled={locked}
                    aria-invalid={
                      !!form.formState.errors.items?.[index]?.quantity
                    }
                    {...form.register(`items.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                  <FieldError
                    errors={[form.formState.errors.items?.[index]?.quantity]}
                  />
                </Field>
              </div>
              {print ? (
                <div className='grid gap-4 sm:grid-cols-2'>
                  {PRINT_FIELDS.map((key) => (
                    <Field
                      key={key}
                      data-invalid={
                        !!form.formState.errors.items?.[index]?.printInfo?.[key]
                      }
                    >
                      <FieldLabel htmlFor={`supply-print-${index}-${key}`}>
                        {t(`supplies.print.${key}`)}{' '}
                        <span aria-hidden='true' className='text-destructive'>
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        id={`supply-print-${index}-${key}`}
                        disabled={locked}
                        aria-invalid={
                          !!form.formState.errors.items?.[index]?.printInfo?.[
                            key
                          ]
                        }
                        {...form.register(`items.${index}.printInfo.${key}`)}
                      />
                      <FieldError
                        errors={[
                          form.formState.errors.items?.[index]?.printInfo?.[
                            key
                          ],
                        ]}
                      />
                    </Field>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
        <Button
          type='button'
          variant='outline'
          disabled={locked || lines.fields.length >= 100}
          onClick={() =>
            lines.append({ code: '', quantity: 1, printInfo: emptyPrint() })
          }
        >
          {t('supplies.addItem')}
        </Button>
      </FieldGroup>
    </form>
  );
}
