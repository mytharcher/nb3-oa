import { UserName } from '#components/user-name';
import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { Missing } from './missing.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { Link, useLocation, useOutletContext, useParams } from 'react-router';
import { format, parseISO } from 'date-fns';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
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
import { DatePicker } from '#components/date-picker';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { fieldViolationsOf } from '../platform/shared/errors.js';
import { createRequestId } from '../approvals/request-id.js';
import { useDepartureResource } from './use-resource.js';
import { DepartureEmployeePicker, HandoverPicker } from './pickers.js';
import { ErrorState } from './states.js';
import {
  typeLabel,
  type DepartureDetail,
  type DepartureOptions,
  type DepartureRecord,
  type SourceContext,
} from './types.js';
import {
  readUnknownCreate,
  saveUnknownCreate,
  clearUnknownCreate,
  type UnknownCreate,
} from './unknown-create.js';

export default function DepartureFormDialog() {
  const { requestId } = useParams(),
    { t } = useTranslation(),
    parent = useOutletContext<SourceContext>();
  const latest = useDepartureResource<DepartureDetail>(
      requestId ? `departureRequests/${encodeURIComponent(requestId)}` : null,
    ),
    options = useDepartureResource<DepartureOptions>(
      'departureRequests/options',
    );
  const [busy, setBusy] = useState(false),
    [disabled, setDisabled] = useState(true),
    [discard, setDiscard] = useState(false);
  const busyRef = useRef(false),
    dirtyRef = useRef(false),
    resolveRef = useRef<(allowed: boolean) => void>(undefined);
  const onBusy = useCallback((value: boolean) => {
      busyRef.current = value;
      setBusy(value);
    }, []),
    onDirty = useCallback((value: boolean) => {
      dirtyRef.current = value;
    }, []);
  return (
    <RouteDrawer
      printable
      className='text-sm sm:max-w-2xl'
      title={t(`departureRequests.form.${requestId ? 'edit' : 'create'}`)}
      beforeClose={() => {
        if (busyRef.current) return false;
        if (!dirtyRef.current) return true;
        setDiscard(true);
        return new Promise<boolean>((resolve) => {
          resolveRef.current = resolve;
        });
      }}
      footer={
        <Footer
          revision={latest.data?.record.status === 'revision'}
          busy={busy}
          disabled={disabled}
        />
      }
    >
      {latest.error instanceof ApiClientError && latest.error.status === 404 ? (
        <Missing onMissing={parent?.reload} focusList={parent?.focusList} />
      ) : latest.error || options.error ? (
        <ErrorState
          error={latest.error ?? options.error}
          retry={() => {
            latest.reload();
            options.reload();
          }}
        />
      ) : !options.data || (requestId && !latest.data) ? (
        <FieldsSkeleton fields={5} />
      ) : (
        <DepartureForm
          key={`${options.data.actor?.id ?? ''}:${requestId ?? 'new'}`}
          detail={latest.data}
          options={options.data}
          refreshing={latest.loading || options.loading}
          allowed={
            !latest.loading &&
            !options.loading &&
            (requestId
              ? !!latest.data?.view.available.some(
                  (action) => action.name === 'edit' && action.allowed,
                )
              : options.data.canCreateSelfDraft ||
                options.data.canCreateManualDraft)
          }
          reload={() => parent?.reload()}
          onBusy={onBusy}
          onDirty={onDirty}
          onDisabled={setDisabled}
        />
      )}
      <AlertDialog
        open={discard}
        onOpenChange={(open) => {
          setDiscard(open);
          if (!open) {
            resolveRef.current?.(false);
            resolveRef.current = undefined;
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
                resolveRef.current?.(true);
                resolveRef.current = undefined;
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
function Footer({
  busy,
  disabled,
  revision,
}: {
  busy: boolean;
  disabled: boolean;
  revision?: boolean;
}) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('approvals.cancel')}
      </Button>
      <RequestFormButtons
        revision={revision}
        resource='oa.departure'
        form='departure-draft-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
export function DepartureForm({
  detail,
  options,
  allowed,
  reload,
  onBusy,
  onDirty,
  onDisabled,
  refreshing = false,
}: {
  refreshing?: boolean;
  detail?: DepartureDetail;
  options: DepartureOptions;
  allowed: boolean;
  reload: () => void;
  onBusy: (value: boolean) => void;
  onDirty: (value: boolean) => void;
  onDisabled: (value: boolean) => void;
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay(),
    location = useLocation(),
    source = useOutletContext<SourceContext>();
  const actorId = options.actor?.id ?? '';
  const employeePermission = useCan({
    resource: { type: 'composite', id: 'oa.employees.archive' },
    action: 'view',
  });
  const [marker, setMarker] = useState<UnknownCreate | null>(() => {
    if (detail || !actorId) return null;
    try {
      return readUnknownCreate(actorId);
    } catch {
      return { actorId, employeeId: null, departureType: '', startedAt: 0 };
    }
  });
  const [mode, setMode] = useState<'self' | 'manual'>(
    marker?.employeeId
      ? 'manual'
      : options.canCreateSelfDraft
        ? 'self'
        : 'manual',
  );
  const [record, setRecord] = useState(detail?.record),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [conflict, setConflict] = useState(false),
    [unknownEdit, setUnknownEdit] = useState(false),
    [offer, setOffer] = useState(true),
    [candidates, setCandidates] = useState<DepartureRecord[]>(),
    [storageBlocked, setStorageBlocked] = useState(false);
  const lockRef = useRef(false);
  const f = useCallback(
    (key: string) => t(`departureRequests.form.${key}`),
    [t],
  );
  const schema = useMemo(
    () =>
      z.object({
        employeeId: z.string(),
        departureType: z.string().min(1, f('required')),
        reason: z
          .string()
          .trim()
          .min(1, f('required'))
          .max(10000, t('approvals.limit')),
        expectedLastWorkingDay: z
          .string()
          .refine(
            (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
            f('dateInvalid'),
          ),
        handoverUserId: z.string(),
      }),
    [f, t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: detail?.record.employeeId ?? marker?.employeeId ?? '',
      departureType:
        detail?.record.departureType ?? marker?.departureType ?? '',
      reason: detail?.record.reason ?? '',
      expectedLastWorkingDay: detail?.record.expectedLastWorkingDay ?? '',
      handoverUserId: detail?.record.handoverUserId ?? '',
    },
  });
  const employeeId = useWatch({ control: form.control, name: 'employeeId' });
  const modeAllowed = record
    ? record.departureType === 'resignation'
      ? options.canCreateSelfDraft
      : options.canCreateManualDraft &&
        employeePermission.can &&
        !employeePermission.isPending &&
        !employeePermission.error
    : mode === 'self'
      ? options.canCreateSelfDraft
      : options.canCreateManualDraft &&
        employeePermission.can &&
        !employeePermission.isPending &&
        !employeePermission.error;
  const revoked =
    !refreshing &&
    (!allowed || (!employeePermission.isPending && !modeAllowed) || !offer);
  // Authority loss must erase local sensitive selections, not merely disable their controls.
  /* eslint-disable react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect */
  useEffect(() => {
    if (!revoked) return;
    form.reset({
      employeeId: '',
      departureType: '',
      reason: '',
      expectedLastWorkingDay: '',
      handoverUserId: '',
    });
    setCandidates(undefined);
    setRecord(undefined);
    setOffer(false);
    onDirty(false);
    // The unknown-create safety marker stays stored, but its candidates are hidden.
  }, [revoked, form, onDirty]);
  /* eslint-enable react-hooks/set-state-in-effect, @eslint-react/set-state-in-effect */
  const disabled =
    busy ||
    !allowed ||
    !modeAllowed ||
    !offer ||
    conflict ||
    unknownEdit ||
    !!marker ||
    storageBlocked;
  useEffect(() => onDisabled(disabled), [disabled, onDisabled]);
  useEffect(
    () => onDirty(form.formState.isDirty),
    [onDirty, form.formState.isDirty],
  );
  const types = record?.sourceProbationId
    ? [{ code: record.departureType, label: record.departureTypeLabel ?? {} }]
    : record
      ? record.createdById === record.applicantId
        ? options.selfDepartureTypes
        : options.manualDepartureTypes
      : mode === 'manual'
        ? options.manualDepartureTypes
        : options.selfDepartureTypes;
  function working(value: boolean) {
    lockRef.current = value;
    setBusy(value);
    onBusy(value);
  }
  const submission = useRequestFormSubmission<DepartureRecord>({
    resource: 'departureRequests',
    suffix: 'transitions',
  });
  async function save(values: z.infer<typeof schema>) {
    if (disabled || lockRef.current) return;
    if (!record && mode === 'manual' && !values.employeeId) {
      form.setError(
        'employeeId',
        { message: f('required') },
        { shouldFocus: true },
      );
      return;
    }
    if (!types.some((type) => type.code === values.departureType)) {
      form.setError(
        'departureType',
        { message: f('invalid') },
        { shouldFocus: true },
      );
      return;
    }
    const input = {
      departureType: values.departureType,
      reason: values.reason,
      expectedLastWorkingDay: values.expectedLastWorkingDay || null,
      handoverUserId: values.handoverUserId || null,
    };
    const body = record
      ? {
          transition: 'edit',
          version: record.lifecycleVersion,
          requestId: createRequestId(),
          input,
        }
      : {
          ...input,
          ...(mode === 'manual' ? { employeeId: values.employeeId } : {}),
        };
    const attempted: UnknownCreate = {
      actorId,
      employeeId: mode === 'manual' ? values.employeeId : null,
      departureType: values.departureType,
      // The timestamp is created by the submit handler, never during render.
      // eslint-disable-next-line react-hooks/purity
      startedAt: Date.now(),
    };
    if (!record) {
      try {
        saveUnknownCreate(attempted);
      } catch {
        setStorageBlocked(true);
        return;
      }
    }
    working(true);
    setError(undefined);
    try {
      const savedRecord = await submission.save(values, record, async () => {
        const { data } = await api.request<{
          data: { record: DepartureRecord };
        }>({
          method: 'POST',
          path: record
            ? `departureRequests/${encodeURIComponent(record.id)}/transitions`
            : 'departureRequests',
          json: body,
        });
        setRecord(data.record);
        return data.record;
      });
      if (!record) clearUnknownCreate(actorId);
      const data = { record: await submission.finish(savedRecord) };
      if (!record) clearUnknownCreate(actorId);
      setRecord(data.record);
      form.reset(values);
      onDirty(false);
      reload();
      toaster.show({
        type: 'success',
        title: t(
          submission.intent.current === 'submit'
            ? 'approvals.submitted'
            : 'departureRequests.form.saved',
          {
            name:
              data.record.number ??
              data.record.applicant?.name ??
              t('approvals.draft'),
          },
        ),
      });
      working(false);
      await close();
    } catch (cause) {
      setError(cause);
      const uncertain =
        !(cause instanceof ApiClientError) || cause.status >= 500;
      if (!record && !submission.current.current) {
        if (uncertain) setMarker(attempted);
        else clearUnknownCreate(actorId);
      } else if (uncertain && !submission.current.current) setUnknownEdit(true);
      if (cause instanceof ApiClientError && cause.status === 409)
        setConflict(true);
      if (
        cause instanceof ApiClientError &&
        [401, 403].includes(cause.status)
      ) {
        form.reset({
          employeeId: '',
          departureType: '',
          reason: '',
          expectedLastWorkingDay: '',
          handoverUserId: '',
        });
        setOffer(false);
        setRecord(undefined);
      }
      let first: keyof z.infer<typeof schema> | undefined;
      for (const path of fieldViolationsOf(cause)) {
        const key = path.replace(/^input\./, '');
        if (
          [
            'employeeId',
            'departureType',
            'reason',
            'expectedLastWorkingDay',
            'handoverUserId',
          ].includes(key)
        ) {
          const name = key as keyof z.infer<typeof schema>;
          form.setError(name, { message: f('invalid') });
          first ??= name;
        }
      }
      if (first) form.setFocus(first);
    } finally {
      working(false);
    }
  }
  async function readLatest() {
    if (lockRef.current || !record) return;
    working(true);
    try {
      const { data } = await api.request<{ data: DepartureDetail }>({
        path: `departureRequests/${encodeURIComponent(record.id)}`,
      });
      submission.adopt(data.record);
      setRecord(data.record);
      setOffer(
        data.view.available.some(
          (action) => action.name === 'edit' && action.allowed,
        ),
      );
      setConflict(false);
      setUnknownEdit(false);
      setError(undefined);
    } catch (cause) {
      setError(cause);
      if (
        cause instanceof ApiClientError &&
        [401, 403, 404].includes(cause.status)
      ) {
        setOffer(false);
        form.reset({
          employeeId: '',
          departureType: '',
          reason: '',
          expectedLastWorkingDay: '',
          handoverUserId: '',
        });
      }
    } finally {
      working(false);
    }
  }
  async function checkDrafts() {
    if (lockRef.current || !marker) return;
    working(true);
    try {
      const { data } = await api.request<{ data: DepartureRecord[] }>({
        path: 'departureRequests',
        query: { view: 'mine' },
      });
      setCandidates(
        data.filter(
          (row) =>
            ['draft', 'revision'].includes(row.status) &&
            row.createdById === marker.actorId &&
            row.departureType === marker.departureType &&
            (marker.employeeId
              ? row.employeeId === marker.employeeId
              : row.applicantId === marker.actorId) &&
            Date.parse(row.createdAt) >= marker.startedAt - 120000,
        ),
      );
      setError(undefined);
    } catch (cause) {
      setError(cause);
      setCandidates(undefined);
    } finally {
      working(false);
    }
  }
  async function confirmDraft(candidate: DepartureRecord) {
    if (lockRef.current || !marker) return;
    working(true);
    try {
      const { data } = await api.request<{ data: DepartureDetail }>({
        path: `departureRequests/${encodeURIComponent(candidate.id)}`,
      });
      if (
        !['draft', 'revision'].includes(data.record.status) ||
        Date.parse(data.record.createdAt) < marker.startedAt - 120000 ||
        data.record.createdById !== marker.actorId ||
        data.record.departureType !== marker.departureType ||
        (marker.employeeId
          ? data.record.employeeId !== marker.employeeId
          : data.record.applicantId !== marker.actorId)
      )
        throw new Error('Unconfirmed create');
      clearUnknownCreate(actorId);
      setMarker(null);
      onDirty(false);
      reload();
      working(false);
      await close();
    } catch (cause) {
      setError(cause);
    } finally {
      working(false);
    }
  }
  if (error instanceof ApiClientError && error.status === 404)
    return (
      <Missing
        onMissing={reload}
        focusList={source?.focusList}
        name={record?.applicant?.name}
      />
    );
  const modeItems = [
    ...(options.canCreateSelfDraft
      ? [{ value: 'self', label: f('self') }]
      : []),
    ...(options.canCreateManualDraft
      ? [{ value: 'manual', label: f('manual') }]
      : []),
  ];
  return (
    <form
      id='departure-draft-form'
      onSubmitCapture={submission.captureIntent}
      onKeyDown={preventComposingSubmit}
      noValidate
      onSubmit={(event) => void form.handleSubmit(save)(event)}
      className='flex flex-col gap-4'
    >
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      {error ? (
        <ErrorState
          error={error}
          retry={record ? () => void readLatest() : () => void checkDrafts()}
        />
      ) : null}
      {storageBlocked ? (
        <Alert variant='destructive'>
          <AlertDescription>{f('storageUnavailable')}</AlertDescription>
        </Alert>
      ) : null}
      {!allowed || !modeAllowed || !offer ? (
        <p className='text-sm text-muted-foreground'>{f('unavailable')}</p>
      ) : null}
      {conflict || unknownEdit ? (
        <>
          <Alert>
            <AlertDescription>
              {conflict
                ? t('departureRequests.errors.conflict')
                : t('departureRequests.actionForm.unknown')}
            </AlertDescription>
          </Alert>
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={() => void readLatest()}
          >
            {t('approvals.loadLatest')}
          </Button>
        </>
      ) : null}
      {marker ? (
        <div className='flex flex-col gap-2'>
          <Alert>
            <AlertDescription>{f('unknownPersisted')}</AlertDescription>
          </Alert>
          <Button
            type='button'
            variant='outline'
            disabled={busy || revoked}
            onClick={() => void checkDrafts()}
          >
            {busy ? <Spinner /> : null}
            {f('checkDrafts')}
          </Button>
          {candidates?.length === 0 ? (
            <p className='text-sm text-muted-foreground'>{f('noProof')}</p>
          ) : null}
          {!revoked &&
            candidates?.map((candidate) => (
              <div
                key={candidate.id}
                className='flex flex-wrap items-center gap-2 rounded-lg border p-4'
              >
                <span>
                  <UserName name={candidate.applicant?.name} /> —{' '}
                  {typeLabel(
                    candidate.departureTypeLabel,
                    i18n.language,
                    candidate.departureType,
                  )}
                </span>
                <Button
                  variant='outline'
                  type='button'
                  nativeButton={false}
                  render={
                    <Link
                      to={{
                        pathname: location.pathname.startsWith(
                          '/departureRequests/',
                        )
                          ? `../${candidate.id}`
                          : `../departure/${candidate.id}`,
                        search: location.search,
                      }}
                    />
                  }
                >
                  {f('openDraft')}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  disabled={busy}
                  onClick={() => void confirmDraft(candidate)}
                >
                  {f('confirmDraft')}
                </Button>
              </div>
            ))}
        </div>
      ) : null}
      <FieldGroup inert={submission.submitUnknown || undefined}>
        {!record && modeItems.length > 1 ? (
          <Field>
            <FieldLabel htmlFor='departure-mode'>{f('mode')}</FieldLabel>
            <Select
              value={mode}
              items={modeItems}
              disabled={disabled}
              onValueChange={(value) => {
                if (value !== 'self' && value !== 'manual') return;
                setMode(value);
                form.reset({
                  ...form.getValues(),
                  employeeId: '',
                  departureType: '',
                  handoverUserId: '',
                });
              }}
            >
              <SelectTrigger id='departure-mode' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                <SelectGroup>
                  {modeItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        {!record && mode === 'manual' ? (
          <Controller
            control={form.control}
            name='employeeId'
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='departure-employee'>
                  {f('employee')}{' '}
                  <span aria-hidden='true' className='text-destructive'>
                    *
                  </span>
                </FieldLabel>
                <DepartureEmployeePicker
                  id='departure-employee'
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    form.setValue('handoverUserId', '');
                  }}
                  onBlur={field.onBlur}
                  focusRef={field.ref}
                  invalid={fieldState.invalid}
                  disabled={disabled}
                />
                <FieldDescription>{f('manualHelp')}</FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ) : null}
        <Controller
          control={form.control}
          name='departureType'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='departure-type'>
                {t('departureRequests.departureType')}{' '}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Select
                value={field.value || null}
                items={types.map((type) => ({
                  value: type.code,
                  label: typeLabel(type.label, i18n.language, type.code),
                }))}
                disabled={disabled || !!record?.sourceProbationId}
                onValueChange={(value) => field.onChange(value ?? '')}
              >
                <SelectTrigger
                  id='departure-type'
                  ref={field.ref}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid || undefined}
                  className='w-full'
                >
                  <SelectValue placeholder={f('chooseType')} />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  <SelectGroup>
                    {types.map((type) => (
                      <SelectItem key={type.code} value={type.code}>
                        {typeLabel(type.label, i18n.language, type.code)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='reason'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='departure-reason'>
                {t('departureRequests.reason')}{' '}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Textarea
                id='departure-reason'
                {...field}
                disabled={disabled}
                aria-required='true'
                aria-invalid={fieldState.invalid || undefined}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='expectedLastWorkingDay'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='departure-date'>
                {t('departureRequests.expectedLastWorkingDay')}
              </FieldLabel>
              <div ref={(node) => field.ref(node?.querySelector('button'))}>
                <DatePicker
                  id='departure-date'
                  value={field.value ? parseISO(field.value) : undefined}
                  onChange={(date) =>
                    field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                  }
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
                  disabled={disabled}
                />
              </div>
              <FieldDescription>{f('dateHelp')}</FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='handoverUserId'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor='departure-recipient'>
                {t('departureRequests.handoverUser')}
              </FieldLabel>
              {mode === 'manual' && !employeeId && !record ? (
                <p className='text-sm text-muted-foreground'>
                  {f('chooseEmployee')}
                </p>
              ) : (
                <HandoverPicker
                  key={`${mode}:${mode === 'manual' ? employeeId : ''}`}
                  id='departure-recipient'
                  employeeId={
                    record && record.applicantId !== actorId
                      ? record.employeeId
                      : mode === 'manual' && !record
                        ? employeeId
                        : undefined
                  }
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  focusRef={field.ref}
                  invalid={fieldState.invalid}
                  disabled={disabled}
                  knownUser={detail?.record.handoverUser}
                />
              )}
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
