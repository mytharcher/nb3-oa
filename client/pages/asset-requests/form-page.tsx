import { preventComposingSubmit } from '#hooks/use-request-form-submission';
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  DrawerFormContext,
  DrawerFormFooterContext,
} from '#components/drawer-form-context';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@nocobase/i18n/client';
import { useNavigationGuard, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteFormPage } from '#components/route-form-page';
import { DatePicker } from '#components/date-picker';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { Alert, AlertDescription } from '#components/ui/alert';
import { useResource } from './resource.js';
import { ErrorState, FieldsSkeleton } from './states.js';
import { useCommand, clearCommands } from './command.js';
import { Photos } from './photos.js';
import { AssetPicker } from './pickers.js';
import { violations } from './errors.js';
import { useSourceTrail, focusSource } from './breadcrumb.js';
import {
  editableRecord,
  requestInput,
  statusOf,
  type Detail,
  type RequestInput,
  type RequestRecord,
  type Options,
  type SourceContext,
} from './types.js';
export default function AssetRequestForm() {
  const { session } = useAuthentication();
  return <AssetRequestFormContent key={session?.user.id ?? ''} />;
}
function AssetRequestFormContent() {
  const { requestId } = useParams();
  const { t } = useTranslation();
  const { session } = useAuthentication();
  const actor = session?.user.id ?? '';
  const draftKey = `oa:assetRequests:draft:${actor}`;
  const [ownDraftId, setOwnDraftId] = useState(
    () => requestId ?? sessionStorage.getItem(draftKey) ?? undefined,
  );
  const draftId = requestId ?? ownDraftId;
  const [createdHere, setCreatedHere] = useState(false);
  const r = useResource<{ data: Detail }>(
    draftId ? `assetRequests/${encodeURIComponent(draftId)}` : null,
  );
  const create = useCan({
    resource: { type: 'composite', id: 'oa.assetRequests' },
    action: 'create',
  });
  const options = useResource<{ data: Options }>(
    create.can ? 'assetRequests/options' : null,
  );
  return (
    <RouteFormPage
      printable
      title={t(requestId ? 'assetRequests.editTitle' : 'assetRequests.new')}
    >
      <PageContainer className='max-w-4xl'>
        <PageHeader
          title={t(requestId ? 'assetRequests.editTitle' : 'assetRequests.new')}
        />
        {draftId && !createdHere && r.loading && !r.data ? (
          <FieldsSkeleton />
        ) : (
          <RequestForm
            key={`${actor}:${requestId ?? 'new'}`}
            initial={r.data?.data}
            options={options.data?.data}
            optionsError={options.error}
            optionsLoading={options.loading}
            requestId={requestId}
            draftId={draftId}
            setDraftId={(id) => {
              setCreatedHere(true);
              setOwnDraftId(id);
              if (!requestId) sessionStorage.setItem(draftKey, id);
            }}
            onReload={r.reload}
            readError={r.error}
            draftKey={draftKey}
          />
        )}
      </PageContainer>
    </RouteFormPage>
  );
}
function RequestForm({
  initial,
  options,
  optionsError,
  optionsLoading,
  requestId,
  draftId,
  setDraftId,
  onReload,
  readError,
  draftKey,
}: {
  initial?: Detail;
  options?: Options;
  optionsError: unknown;
  optionsLoading: boolean;
  requestId?: string;
  draftId?: string;
  setDraftId: (id: string) => void;
  onReload: () => void;
  readError: unknown;
  draftKey: string;
}) {
  const { t } = useTranslation(),
    toaster = useToaster(),
    navigate = useNavigate();
  const parent = useOutletContext<SourceContext>();
  const trail = useSourceTrail(
    t(requestId ? 'assetRequests.editTitle' : 'assetRequests.new'),
    true,
  );
  const command = useCommand(`form:${requestId ?? 'new'}`);
  const lifecycle = useCommand(`submit:${requestId ?? 'new'}`);
  const create = useCan({
      resource: { type: 'composite', id: 'oa.assetRequests' },
      action: 'create',
    }),
    edit = useCan({
      resource: { type: 'composite', id: 'oa.assetRequests' },
      action: 'edit',
    }),
    operate = useCan({
      resource: { type: 'composite', id: 'oa.assetRequests' },
      action: 'operate',
    });
  const [discard, setDiscard] = useState(false);
  const [savedRecord, setSavedRecord] = useState(initial?.record),
    [uploadBusy, setUploadBusy] = useState(false),
    [denied, setDenied] = useState(false),
    [submitIntent, setSubmitIntent] = useState(false);
  const submissionAttemptedRef = useRef(false);
  const form = useForm<RequestInput>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    resolver: async (raw) => {
      const values = requestInput(raw);
      const errors: Partial<
        Record<keyof RequestInput, { type: string; message: string }>
      > = {};
      const fail = (key: keyof RequestInput, message: string) => {
        errors[key] = { type: 'validate', message };
      };
      if (
        !Number.isInteger(values.quantity) ||
        values.quantity < 1 ||
        values.quantity > 100
      )
        fail('quantity', t('assetRequests.quantityInvalid'));
      for (const key of ['purpose', 'scrapReason'] as const)
        if (values[key].length > 2000) fail(key, t('assetRequests.textLimit'));
      if (submissionAttemptedRef.current) {
        if (!values.purpose.trim())
          fail('purpose', t('assetRequests.required'));
        if (values.operation === 'scrap') {
          if (values.assetIds.length !== 1)
            fail('assetIds', t('assetRequests.required'));
          if (!values.scrapReason.trim())
            fail('scrapReason', t('assetRequests.required'));
          if (!values.photos.length)
            fail('photos', t('assetRequests.photoRequired'));
        } else if (!values.category)
          fail('category', t('assetRequests.required'));
        if (values.operation === 'borrow') {
          const now = new Intl.DateTimeFormat('en-CA', {
            timeZone: options?.timeZone ?? initial?.timeZone ?? 'UTC',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date());
          if (!values.borrowDueDate || values.borrowDueDate <= now)
            fail('borrowDueDate', t('assetRequests.futureDate'));
        }
      }
      return { values: Object.keys(errors).length ? {} : values, errors };
    },
    defaultValues:
      initial && editableRecord(initial.record)
        ? requestInput(initial.record)
        : command.pending
          ? requestInput(command.pending.json)
          : {
              operation: 'use',
              category: null,
              quantity: 1,
              purpose: '',
              assetIds: [],
              borrowDueDate: null,
              scrapReason: '',
              photos: [],
            },
  });
  const record =
    savedRecord &&
    (savedRecord.lifecycleVersion ?? -1) >=
      (initial?.record.lifecycleVersion ?? -1)
      ? savedRecord
      : initial?.record;
  const savedRef = useRef(false);
  const reloadRequestedRef = useRef(false);
  const reloadSourceRef = useRef(initial);
  const reloadLatest = () => {
    reloadRequestedRef.current = true;
    reloadSourceRef.current = initial;
    onReload();
  };
  const hydratedRef = useRef(initial?.record.lifecycleVersion);
  useEffect(() => {
    if (initial) {
      if (
        reloadRequestedRef.current &&
        initial !== reloadSourceRef.current &&
        editableRecord(initial.record)
      ) {
        form.reset(requestInput(initial.record));
        hydratedRef.current = initial.record.lifecycleVersion;
        reloadRequestedRef.current = false;
        command.clearError();
        lifecycle.clearError();
      }
      if (
        !form.formState.isDirty &&
        editableRecord(initial.record) &&
        hydratedRef.current !== initial.record.lifecycleVersion
      ) {
        form.reset(requestInput(initial.record));
        hydratedRef.current = initial.record.lifecycleVersion;
      }
    }
  }, [initial, form, command, lifecycle]);
  const error = readError ?? command.error ?? lifecycle.error;
  const errorRef = useRef<unknown>(undefined);
  const forbidden = denied || [401, 403].includes(statusOf(error) ?? 0);
  useEffect(() => {
    if (errorRef.current === error) return;
    errorRef.current = error;
    if ([401, 403].includes(statusOf(error) ?? 0)) {
      form.reset({
        operation: 'use',
        category: null,
        quantity: 1,
        purpose: '',
        assetIds: [],
        borrowDueDate: null,
        scrapReason: '',
        photos: [],
      });
      sessionStorage.removeItem(draftKey);
      clearCommands(command.actor);
    }
    if (statusOf(error) === 404) {
      savedRef.current = true;
      parent?.reload?.();
      toaster.show({
        type: 'error',
        title: t('assetRequests.missingNamed', {
          name: record?.number ?? t('assetRequests.draft'),
        }),
      });
      void navigate(
        { pathname: trail.source, search: trail.search },
        { replace: true },
      );
      focusSource();
    }
  }, [
    error,
    command.actor,
    form,
    draftKey,
    parent,
    toaster,
    t,
    navigate,
    trail.source,
    trail.search,
    record?.number,
  ]);
  const onDenied = useCallback(() => {
    setDenied(true);
    setSavedRecord(undefined);
    form.reset({
      operation: 'use',
      category: null,
      quantity: 1,
      purpose: '',
      borrowDueDate: null,
      assetIds: [],
      photos: [],
      scrapReason: '',
    });
    clearCommands(command.actor);
  }, [form, command.actor]);
  const complete = !draftId || editableRecord(record);
  const allowed =
    (!draftId ? create.can : edit.can) &&
    complete &&
    !readError &&
    !forbidden &&
    statusOf(error) !== 409;
  const frozen = !!command.pending || !!lifecycle.pending;
  const busy = command.busy || lifecycle.busy || uploadBusy;
  const locked = busy || frozen || !allowed;
  const operation = useWatch({ control: form.control, name: 'operation' });
  useNavigationGuard(() => {
    if (forbidden || savedRef.current) return true;
    if (busy || frozen) return false;
    if (!form.formState.isDirty) return true;
    setDiscard(true);
    return false;
  });
  useEffect(() => {
    const fields = violations(error).filter((f): f is keyof RequestInput =>
      [
        'operation',
        'category',
        'assetIds',
        'quantity',
        'purpose',
        'borrowDueDate',
        'scrapReason',
        'photos',
      ].includes(f),
    );
    fields.forEach((f) =>
      form.setError(f, {
        type: 'server',
        message: t('assetRequests.required'),
      }),
    );
    if (fields[0]) form.setFocus(fields[0]);
  }, [error, form, t]);
  const photos = useWatch({ control: form.control, name: 'photos' });
  const name = record?.number ?? t('assetRequests.draft');
  async function save(
    values: RequestInput,
  ): Promise<RequestRecord | undefined> {
    if (!allowed || command.busy || lifecycle.busy) return;
    const result = await command.execute<{ data: RequestRecord }>({
      method: draftId ? 'PATCH' : 'POST',
      path: draftId ? `assetRequests/${draftId}` : 'assetRequests',
      json: {
        ...requestInput(values),
        ...(draftId ? { lifecycleVersion: record!.lifecycleVersion } : {}),
      },
    });
    if (result) {
      setSavedRecord(result.data);
      if (result.data.id) setDraftId(result.data.id);
      form.reset(requestInput(values));
      parent?.reload?.();
      return result.data;
    }
    return undefined;
  }
  async function finish(values: RequestInput, submit: boolean) {
    if (submit) {
      if (
        !operate.can ||
        optionsLoading ||
        (options && (!options.eligible || !options.department || !options.head))
      )
        return;
    }
    setSubmitIntent(submit);
    const saved = await save(values);
    if (!saved) return;
    if (submit) {
      if (saved.lifecycleVersion === undefined || !saved.id) return;
      const result = await lifecycle.execute<{ data: Detail }>({
        method: 'POST',
        path: `assetRequests/${saved.id}/lifecycle`,
        json: { action: 'submit', lifecycleVersion: saved.lifecycleVersion },
      });
      if (!result) return;
      parent?.updateDetail?.(result.data);
    } else if (parent?.detail && saved.id === parent.detail.record.id)
      parent.updateDetail?.({ ...parent.detail, record: saved });
    sessionStorage.removeItem(draftKey);
    parent?.reload?.();
    toaster.show({
      type: 'success',
      title: t(submit ? 'assetRequests.submitted' : 'assetRequests.saved', {
        name: saved.number ?? name,
      }),
    });
    savedRef.current = true;
    await navigate({ pathname: trail.parent, search: trail.search });
    focusSource();
  }
  async function retryExact() {
    const result = command.pending
      ? await command.execute<{ data: RequestRecord }>()
      : undefined;
    if (result) {
      setSavedRecord(result.data);
      if (result.data.id) setDraftId(result.data.id);
      onReload();
      parent?.reload?.();
    }
    const submitted = lifecycle.pending
      ? await lifecycle.execute<{ data: Detail }>()
      : undefined;
    if (submitted) {
      parent?.updateDetail?.(submitted.data);
      parent?.reload?.();
      sessionStorage.removeItem(draftKey);
      toaster.show({
        type: 'success',
        title: t('assetRequests.submitted', {
          name: submitted.data.record.number ?? name,
        }),
      });
      savedRef.current = true;
      await navigate({ pathname: trail.parent, search: trail.search });
      focusSource();
    }
  }
  if (forbidden) return <ErrorState error={{ status: 403 }} />;
  return (
    <>
      {error ? (
        <ErrorState
          error={error}
          retry={statusOf(error) === 409 ? reloadLatest : undefined}
        />
      ) : null}
      {optionsError ? <ErrorState error={optionsError} /> : null}
      {!complete ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('assetRequests.missingFields')}
          </AlertDescription>
        </Alert>
      ) : null}
      {options &&
      (!options.eligible || !options.department || !options.head) ? (
        <Alert>
          <AlertDescription>
            {t(
              !options.eligible
                ? 'assetRequests.noEligibleEmployee'
                : !options.department
                  ? 'assetRequests.noDepartment'
                  : 'assetRequests.noActiveHead',
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      {frozen ? (
        <Alert>
          <AlertDescription>
            {t('assetRequests.unknownResult')}
          </AlertDescription>
          <Button
            variant='outline'
            disabled={busy}
            onClick={() => void retryExact()}
          >
            {t('assetRequests.retryExact')}
          </Button>
        </Alert>
      ) : null}
      <form
        id='asset-request-form'
        onKeyDown={preventComposingSubmit}
        onSubmit={(e) => {
          e.preventDefault();
          const submitter = e.nativeEvent.submitter;
          const submitting =
            submitter instanceof HTMLButtonElement &&
            submitter.value === 'submit';
          submissionAttemptedRef.current = submitting;
          void form.handleSubmit((v) => finish(v, submitting))(e);
        }}
      >
        <fieldset disabled={locked} className='flex flex-col gap-6'>
          <FieldGroup>
            <Controller
              name='operation'
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor='asset-operation'>
                    {t('assetRequests.operationLabel')}{' '}
                    <span aria-hidden='true' className='text-destructive'>
                      *
                    </span>
                  </FieldLabel>
                  <Select
                    value={field.value}
                    items={(['use', 'borrow', 'scrap'] as const).map(
                      (value) => ({
                        value,
                        label: t(`assetRequests.operations.${value}`),
                      }),
                    )}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('borrowDueDate', null);
                      form.setValue('scrapReason', '');
                      form.setValue('photos', []);
                      form.setValue('assetIds', []);
                      if (v === 'scrap') form.setValue('quantity', 1);
                    }}
                    disabled={locked}
                  >
                    <SelectTrigger id='asset-operation'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                      <SelectGroup>
                        {(['use', 'borrow', 'scrap'] as const).map((v) => (
                          <SelectItem key={v} value={v}>
                            {t(`assetRequests.operations.${v}`)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]'>
              {operation !== 'scrap' ? (
                <Controller
                  name='category'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='asset-category'>
                        {t('assetRequests.category')}{' '}
                        <span aria-hidden='true' className='text-destructive'>
                          *
                        </span>
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={locked}
                        items={options?.categories.map((c) => ({
                          value: c.code,
                          label: c.title,
                        }))}
                      >
                        <SelectTrigger
                          id='asset-category'
                          aria-invalid={fieldState.invalid}
                          className='w-full'
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                          <SelectGroup>
                            {(
                              options?.categories ??
                              (field.value
                                ? [{ code: field.value, title: field.value }]
                                : [])
                            ).map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              ) : (
                <Controller
                  name='assetIds'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor='asset-selection'>
                        {t('assetRequests.asset')}{' '}
                        <span aria-hidden='true' className='text-destructive'>
                          *
                        </span>
                      </FieldLabel>
                      <AssetPicker
                        id='asset-selection'
                        onDenied={onDenied}
                        requestId={draftId}
                        value={field.value[0] ?? ''}
                        onChange={(id) => field.onChange(id ? [id] : [])}
                        disabled={locked}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              )}
              <Field data-invalid={!!form.formState.errors.quantity}>
                <FieldLabel htmlFor='asset-quantity'>
                  {t('assetRequests.quantity')}{' '}
                  <span aria-hidden='true' className='text-destructive'>
                    *
                  </span>
                </FieldLabel>
                <Input
                  id='asset-quantity'
                  type='number'
                  min={1}
                  max={100}
                  readOnly={operation === 'scrap'}
                  {...form.register('quantity', {
                    valueAsNumber: true,
                    validate: (v) =>
                      (Number.isInteger(v) && v >= 1 && v <= 100) ||
                      t('assetRequests.quantityInvalid'),
                  })}
                />
                <FieldError errors={[form.formState.errors.quantity]} />
              </Field>
            </div>
            <Field data-invalid={!!form.formState.errors.purpose}>
              <FieldLabel htmlFor='asset-purpose'>
                {t('assetRequests.purpose')}{' '}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Textarea
                id='asset-purpose'
                {...form.register('purpose', {
                  maxLength: {
                    value: 2000,
                    message: t('assetRequests.textLimit'),
                  },
                })}
              />
              <FieldError errors={[form.formState.errors.purpose]} />
            </Field>
            {operation === 'borrow' ? (
              <Controller
                name='borrowDueDate'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='asset-return-date'>
                      {t('assetRequests.borrowDueDate')}{' '}
                      <span aria-hidden='true' className='text-destructive'>
                        *
                      </span>
                    </FieldLabel>
                    <DatePicker
                      id='asset-return-date'
                      value={field.value ? parseISO(field.value) : undefined}
                      onChange={(v) =>
                        field.onChange(v ? format(v, 'yyyy-MM-dd') : null)
                      }
                      disabled={locked}
                      invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ) : null}
            {operation === 'scrap' ? (
              <>
                <Field data-invalid={!!form.formState.errors.scrapReason}>
                  <FieldLabel htmlFor='asset-scrap-reason'>
                    {t('assetRequests.scrapReason')}{' '}
                    <span aria-hidden='true' className='text-destructive'>
                      *
                    </span>
                  </FieldLabel>
                  <Textarea
                    id='asset-scrap-reason'
                    {...form.register('scrapReason', {
                      maxLength: {
                        value: 2000,
                        message: t('assetRequests.textLimit'),
                      },
                    })}
                  />
                  <FieldError errors={[form.formState.errors.scrapReason]} />
                </Field>
                <Field data-invalid={!!form.formState.errors.photos}>
                  <FieldLabel htmlFor='asset-photos'>
                    {t('assetRequests.photos')}{' '}
                    <span aria-hidden='true' className='text-destructive'>
                      *
                    </span>
                  </FieldLabel>
                  <Photos
                    requestId={draftId}
                    ids={photos}
                    onChange={(ids) => {
                      if (ids.length) form.clearErrors('photos');
                      form.setValue('photos', ids, {
                        shouldDirty: true,
                        shouldValidate: !!form.formState.errors.photos,
                      });
                    }}
                    disabled={locked}
                    onBusy={setUploadBusy}
                    onDenied={onDenied}
                    ensureDraft={async () => {
                      const ok = await form.trigger([
                        'quantity',
                        'purpose',
                        'scrapReason',
                      ]);
                      if (!ok) return;
                      const saved = await save(form.getValues());
                      return saved?.id;
                    }}
                  />
                  <FieldError errors={[form.formState.errors.photos]} />
                </Field>
              </>
            ) : null}
          </FieldGroup>
        </fieldset>
        <RequestFormActions>
          <Button
            variant='outline'
            disabled={busy || frozen}
            type='button'
            onClick={() => {
              if (form.formState.isDirty) {
                setDiscard(true);
                return;
              }
              void navigate({ pathname: trail.parent, search: trail.search });
              focusSource();
            }}
          >
            {t('assetRequests.cancel')}
          </Button>
          <Button
            variant='outline'
            disabled={locked}
            type='submit'
            name='requestIntent'
            value='save'
            form='asset-request-form'
          >
            {busy && !submitIntent ? (
              <Spinner data-icon='inline-start' />
            ) : null}
            {t(
              busy && !submitIntent
                ? 'assetRequests.saving'
                : record?.status === 'revision'
                  ? 'approvals.save'
                  : 'assetRequests.saveDraft',
            )}
          </Button>
          <Button
            type='submit'
            name='requestIntent'
            value='submit'
            form='asset-request-form'
            disabled={
              locked ||
              !operate.can ||
              optionsLoading ||
              !!optionsError ||
              (!!options &&
                (!options.eligible || !options.department || !options.head))
            }
          >
            {busy && submitIntent ? <Spinner data-icon='inline-start' /> : null}
            {busy && submitIntent
              ? t('assetRequests.saving')
              : t(
                  record?.status === 'revision'
                    ? 'approvals.resubmit'
                    : 'assetRequests.submit',
                )}
          </Button>
        </RequestFormActions>
      </form>
      <AlertDialog
        open={discard}
        onOpenChange={(open) => {
          if (!busy) setDiscard(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('assetRequests.discardTitle', { name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('assetRequests.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('assetRequests.cancel')}
            </AlertDialogCancel>
            <Button
              variant='destructive'
              disabled={busy}
              onClick={() => {
                savedRef.current = true;
                setDiscard(false);
                void navigate({ pathname: trail.parent, search: trail.search });
                focusSource();
              }}
            >
              {t('assetRequests.discard')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Mount actions outside the scrolling form body, in RouteFormPage's fixed footer. */
function RequestFormActions({ children }: { children: ReactNode }) {
  const drawerForm = useContext(DrawerFormContext);
  const footerTarget = useContext(DrawerFormFooterContext);
  if (drawerForm)
    return footerTarget ? createPortal(children, footerTarget) : null;
  return (
    <div className='sticky bottom-0 mt-6 flex flex-wrap justify-end gap-2 border-t bg-background py-4'>
      {children}
    </div>
  );
}
