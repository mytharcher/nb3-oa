import { UserName } from '#components/user-name';
import { useRequestFormSubmission } from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
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
import { FieldsSkeleton } from '../platform/shared/states.js';
import { fieldViolationsOf } from '../platform/shared/errors.js';
import { useResource } from '../approvals/use-resource.js';
import { createRequestId } from '../approvals/request-id.js';
import { ErrorState } from './states.js';
import { ProbationEmployeePicker } from './employee-picker.js';
import type {
  ProbationDetail,
  ProbationOptions,
  ProbationRecord,
  SourceContext,
} from './types.js';
export default function ProbationFormDialog() {
  const { requestId } = useParams(),
    { t } = useTranslation(),
    parent = useOutletContext<SourceContext>();
  const latest = useResource<ProbationDetail>(
    requestId ? `probationRequests/${encodeURIComponent(requestId)}` : null,
  );
  const options = useResource<ProbationOptions>('probationRequests/options');
  const delegate = useCan({
    resource: { type: 'composite', id: 'oa.probation' },
    action: 'delegate',
  });
  const [busy, setBusy] = useState(false),
    [disabled, setDisabled] = useState(true),
    [discard, setDiscard] = useState(false);
  const busyRef = useRef(false),
    dirtyRef = useRef(false),
    resolveRef = useRef<((v: boolean) => void) | undefined>(undefined);
  const onBusy = useCallback((v: boolean) => {
      busyRef.current = v;
      setBusy(v);
    }, []),
    onDirty = useCallback((v: boolean) => {
      dirtyRef.current = v;
    }, []);
  const allowed = requestId
    ? !!latest.data?.view.available.some(
        (a) => a.name === 'edit' && a.allowed,
      ) &&
      !latest.loading &&
      !latest.error
    : delegate.can &&
      !!options.data?.canCreateManualDraft &&
      !options.loading &&
      !options.error;
  return (
    <RouteDrawer
      printable
      className='text-sm sm:max-w-2xl'
      title={t(`probationRequests.form.${requestId ? 'edit' : 'create'}`)}
      beforeClose={() => {
        if (busyRef.current) return false;
        if (!dirtyRef.current) return true;
        setDiscard(true);
        return new Promise<boolean>((resolve) => {
          resolveRef.current = resolve;
        });
      }}
      footer={
        <FormFooter
          revision={latest.data?.record.status === 'revision'}
          busy={busy}
          disabled={disabled || !allowed}
        />
      }
    >
      {latest.error instanceof ApiClientError && latest.error.status === 404 ? (
        <MissingForm
          onMissing={() => {
            dirtyRef.current = false;
            busyRef.current = false;
            parent?.reload();
          }}
          focusList={parent?.focusList}
        />
      ) : latest.error || options.error ? (
        <ErrorState
          error={latest.error ?? options.error}
          retry={() => {
            latest.reload();
            options.reload();
          }}
        />
      ) : requestId && !latest.data ? (
        <FieldsSkeleton fields={2} />
      ) : (
        <ProbationForm
          key={requestId ?? 'new'}
          detail={latest.data}
          actorId={options.data?.actorId}
          focusList={parent?.focusList}
          allowed={allowed}
          reload={() => parent?.reload()}
          reloadDetail={latest.reload}
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
function FormFooter({
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
        resource='oa.probation'
        form='probation-draft-form'
        busy={busy}
        disabled={disabled}
      />
    </>
  );
}
/** The overlay hook must run inside RouteDrawer, including first-load failures. */
export function MissingForm({
  onMissing,
  focusList,
}: {
  onMissing: () => void;
  focusList?: () => void;
}) {
  const { close } = useRouteOverlay();
  const handledRef = useRef(false);
  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    onMissing();
    void close().then(() => focusList?.());
  }, [close, onMissing, focusList]);
  return null;
}
export function ProbationForm({
  detail,
  actorId,
  focusList,
  allowed,
  reload,
  reloadDetail,
  onBusy,
  onDirty,
  onDisabled,
}: {
  detail?: ProbationDetail;
  actorId?: string;
  focusList?: () => void;
  allowed: boolean;
  reload: () => void;
  reloadDetail: () => void;
  onBusy: (v: boolean) => void;
  onDirty: (v: boolean) => void;
  onDisabled: (v: boolean) => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay(),
    navigate = useNavigate(),
    location = useLocation();
  const f = useCallback(
    (key: string) => t(`probationRequests.form.${key}`),
    [t],
  );
  const schema = useMemo(
    () =>
      z.object({
        employeeId: z.string().min(1, f('employeeRequired')),
        selfEvaluation: z.string().max(10000, t('approvals.limit')),
      }),
    [f, t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: detail?.record.employeeId ?? '',
      selfEvaluation: detail?.record.selfEvaluation ?? '',
    },
  });
  const [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [conflict, setConflict] = useState(false),
    [unknown, setUnknown] = useState(false),
    [candidates, setCandidates] = useState<ProbationRecord[]>(),
    [record, setRecord] = useState(detail?.record),
    [offer, setOffer] = useState(true);
  const lockRef = useRef(false),
    attemptRef = useRef<
      { path: string; body: Record<string, unknown> } | undefined
    >(undefined);
  const createAttemptRef = useRef<
    | {
        actorId: string;
        employeeId: string;
        startedAt: number;
      }
    | undefined
  >(undefined);
  const disabled =
    busy || conflict || unknown || !allowed || !offer || (!record && !actorId);
  useEffect(() => onDisabled(disabled), [disabled, onDisabled]);
  useEffect(
    () => onDirty(form.formState.isDirty || unknown),
    [onDirty, form.formState.isDirty, unknown],
  );
  function working(value: boolean) {
    lockRef.current = value;
    setBusy(value);
    onBusy(value);
  }
  const submission = useRequestFormSubmission<ProbationRecord>({
    resource: 'probationRequests',
    suffix: 'transition',
  });
  async function perform(body: Record<string, unknown>, path: string) {
    if (lockRef.current) return;
    working(true);
    setError(undefined);
    try {
      const savedRecord = await submission.save(
        'input' in body ? body.input : body,
        record,
        async () => {
          const { data } = await api.request<{
            data: { record: ProbationRecord };
          }>({ method: 'POST', path, json: body });
          setRecord(data.record);
          return data.record;
        },
      );
      const data = { record: await submission.finish(savedRecord) };
      setRecord(data.record);
      form.reset({
        employeeId: data.record.employeeId,
        selfEvaluation: data.record.selfEvaluation,
      });
      onDirty(false);
      setUnknown(false);
      reload();
      toaster.show({
        type: 'success',
        title: t(
          submission.intent.current === 'submit'
            ? 'approvals.submitted'
            : 'probationRequests.form.saved',
          {
            name:
              data.record.number ??
              t('probationRequests.form.draftName', {
                name:
                  data.record.applicant?.name ?? t('approvals.unknownPerson'),
              }),
          },
        ),
      });
      working(false);
      await close();
    } catch (cause) {
      setError(cause);
      if (cause instanceof ApiClientError && cause.status === 409)
        setConflict(true);
      if (
        !submission.current.current &&
        (!(cause instanceof ApiClientError) || cause.status >= 500)
      )
        setUnknown(true);
      let first: 'employeeId' | 'selfEvaluation' | undefined;
      for (const name of fieldViolationsOf(cause)) {
        const key = name.replace(/^input\./, '');
        if (key === 'employeeId' || key === 'selfEvaluation') {
          form.setError(key, { message: f('invalid') });
          first ??= key;
        }
      }
      if (first) form.setFocus(first);
    } finally {
      working(false);
    }
  }
  async function save(values: { employeeId: string; selfEvaluation: string }) {
    if (lockRef.current || disabled) return;
    const path = record
      ? `probationRequests/${encodeURIComponent(record.id)}/transition`
      : 'probationRequests';
    const body = record
      ? {
          transition: 'edit',
          version: record.lifecycleVersion,
          requestId: createRequestId(),
          input: { selfEvaluation: values.selfEvaluation },
        }
      : values;
    if (!record && actorId)
      createAttemptRef.current = {
        actorId,
        employeeId: values.employeeId,
        startedAt: Date.now(),
      };
    attemptRef.current = { body, path };
    await perform(body, path);
  }
  async function readLatest() {
    if (lockRef.current || !record) return;
    working(true);
    try {
      const { data } = await api.request<{ data: ProbationDetail }>({
        path: `probationRequests/${encodeURIComponent(record.id)}`,
      });
      submission.adopt(data.record);
      setRecord(data.record);
      setOffer(data.view.available.some((a) => a.name === 'edit' && a.allowed));
      setConflict(false);
      setError(undefined);
      reloadDetail();
    } catch (cause) {
      setError(cause);
      if (cause instanceof ApiClientError && cause.status === 404) {
        setOffer(false);
        onDirty(false);
        working(false);
        reload();
        await close();
        focusList?.();
      }
    } finally {
      working(false);
    }
  }
  async function checkDrafts() {
    if (lockRef.current || !createAttemptRef.current) return;
    const attempt = createAttemptRef.current;
    working(true);
    try {
      const { data } = await api.request<{ data: ProbationRecord[] }>({
        path: 'probationRequests',
        query: { view: 'mine' },
      });
      setCandidates(
        data.filter((r) => {
          const createdAt = Date.parse(r.createdAt);
          return (
            r.employeeId === attempt.employeeId &&
            r.createdById === attempt.actorId &&
            r.status === 'draft' &&
            Number.isFinite(createdAt) &&
            createdAt >= attempt.startedAt &&
            createdAt <= Date.now()
          );
        }),
      );
      setError(undefined);
    } catch (cause) {
      setError(cause);
    } finally {
      working(false);
    }
  }
  return (
    <form
      id='probation-draft-form'
      onSubmitCapture={submission.captureIntent}
      className='flex flex-col gap-4'
      onSubmit={(event) => void form.handleSubmit(save)(event)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && event.nativeEvent.isComposing)
          event.preventDefault();
      }}
    >
      <RequestSubmissionFeedback
        failed={submission.submitFailed}
        unknown={submission.submitUnknown}
      />
      {!allowed || !offer ? (
        <Alert>
          <AlertDescription>{f('notEditable')}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <ErrorState
          error={error}
          retry={record ? () => void readLatest() : () => void checkDrafts()}
        />
      ) : null}
      {conflict ? (
        <Alert>
          <AlertDescription>{f('conflict')}</AlertDescription>
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={() => void readLatest()}
          >
            {t('approvals.loadLatest')}
          </Button>
        </Alert>
      ) : null}
      {unknown ? (
        <Alert>
          <AlertDescription>
            {f(record ? 'unknownEdit' : 'unknownCreate')}
          </AlertDescription>
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={() => {
              if (record && attemptRef.current)
                void perform(attemptRef.current.body, attemptRef.current.path);
              else void checkDrafts();
            }}
          >
            {f(record ? 'replay' : 'checkDrafts')}
          </Button>
        </Alert>
      ) : null}
      {candidates ? (
        <div className='flex flex-col gap-2'>
          <p className='text-sm text-muted-foreground'>{f('candidateHint')}</p>
          {candidates.length ? (
            candidates.map((r) => (
              <Button
                type='button'
                variant='outline'
                key={r.id}
                disabled={busy}
                onClick={() => {
                  onDirty(false);
                  void navigate(
                    {
                      pathname: `../${location.pathname.includes('/probationRequests/') ? '' : 'probation/'}${encodeURIComponent(r.id)}`,
                      search: location.search,
                    },
                    { relative: 'route' },
                  );
                }}
              >
                {f('openDraft')}: {r.number ?? t('approvals.draft')} ·{' '}
                <UserName name={r.applicant?.name ?? ''} /> · {r.createdAt}
              </Button>
            ))
          ) : (
            <p>{f('noDraftConfirmed')}</p>
          )}
        </div>
      ) : null}
      <FieldGroup inert={submission.submitUnknown || undefined}>
        {!record ? (
          <Controller
            name='employeeId'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='probation-employee'>
                  {f('employee')} *
                </FieldLabel>
                <ProbationEmployeePicker
                  id='probation-employee'
                  value={field.value}
                  onChange={field.onChange}
                  focusRef={field.ref}
                  invalid={fieldState.invalid}
                  disabled={disabled}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ) : (
          <p>
            {f('employee')}:{' '}
            <UserName name={detail?.record.applicant?.name ?? '—'} />
          </p>
        )}
        <Field data-invalid={!!form.formState.errors.selfEvaluation}>
          <FieldLabel htmlFor='probation-self-evaluation'>
            {f('selfEvaluation')}
          </FieldLabel>
          <Textarea
            id='probation-self-evaluation'
            disabled={disabled}
            aria-invalid={!!form.formState.errors.selfEvaluation}
            {...form.register('selfEvaluation')}
          />
          <FieldError errors={[form.formState.errors.selfEvaluation]} />
        </Field>
      </FieldGroup>
    </form>
  );
}
