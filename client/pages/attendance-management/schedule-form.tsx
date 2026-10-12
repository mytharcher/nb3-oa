import { fieldViolationsOf } from '../platform/shared/errors.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch, type Path } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApiClientError,
  useApiClient,
  useToaster,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Checkbox } from '#components/ui/checkbox';
import { Spinner } from '#components/ui/spinner';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from '#components/ui/field';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { useAttendanceResource } from './resource.js';
import { Failure, Loading } from './states.js';
import { OptionSelect } from './select.js';
import {
  resource,
  type CurrentShift,
  type Envelope,
  type Revision,
  type Schedule,
  type ShiftPage,
  type SourceContext,
} from './types.js';
export default function ScheduleFormPage() {
  const { t } = useTranslation(),
    source = useOutletContext<SourceContext>(),
    [params] = useSearchParams();
  const departmentId = params.get('departmentId') ?? '',
    date = params.get('date') ?? '';
  const manage = useCan({ resource, action: 'manage' }),
    allowed = manage.can && !manage.isPending && !manage.error;
  const current = useAttendanceResource<Envelope<Schedule | null>>(
    allowed && departmentId && date ? 'attendanceManagement/schedule' : null,
    { departmentId, date },
  );
  const reference = useAttendanceResource<Envelope<Revision | null>>(
    allowed && current.data?.data?.revision.shiftRevisionId
      ? 'attendanceManagement/shiftRevision'
      : null,
    { id: current.data?.data?.revision.shiftRevisionId ?? '' },
  );
  const context = useAttendanceResource<Envelope<{ timeZone: string }>>(
    allowed ? 'attendanceManagement/context' : null,
  );
  const busyRef = useRef(false),
    dirtyRef = useRef(false),
    savedRef = useRef(false);
  const [discard, setDiscard] = useState(false),
    [ui, setUi] = useState({ busy: false, ready: false });
  const navigate = useNavigate();
  const closeTo = { pathname: source.basePath, search: source.search };
  const reload = () => {
    current.reload();
    reference.reload();
    context.reload();
  };
  const beforeClose = () => {
    if (busyRef.current) return false;
    if (dirtyRef.current && !savedRef.current) {
      setDiscard(true);
      return false;
    }
    return true;
  };
  useNavigationGuard(beforeClose);
  return (
    <RouteDialog
      title={t('attendanceManagement.configure')}
      closeTo={closeTo}
      beforeClose={beforeClose}
      footer={
        <ScheduleFooter
          busy={ui.busy}
          ready={
            ui.ready &&
            !!current.data &&
            !current.loading &&
            !reference.loading &&
            !context.loading &&
            !current.error &&
            !reference.error &&
            !context.error &&
            allowed
          }
        />
      }
    >
      {manage.isPending ||
      current.loading ||
      reference.loading ||
      context.loading ? (
        <Loading />
      ) : !allowed || manage.error ? (
        <Failure error={manage.error} denied={!manage.can} />
      ) : !departmentId || !date ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('attendanceManagement.chooseDepartmentDate')}
          </AlertDescription>
        </Alert>
      ) : current.error || reference.error || context.error ? (
        <Failure
          error={current.error ?? reference.error ?? context.error}
          retry={reload}
        />
      ) : current.data && context.data ? (
        <ScheduleForm
          key={`${departmentId}:${date}:${current.data.data?.version ?? 'new'}:${context.data.data.timeZone}`}
          current={current.data.data}
          reference={reference.data?.data ?? undefined}
          timeZone={context.data.data.timeZone}
          departmentId={departmentId}
          date={date}
          source={source}
          busyRef={busyRef}
          dirtyRef={dirtyRef}
          savedRef={savedRef}
          reload={reload}
          onStateChange={setUi}
        />
      ) : null}
      <AlertDialog open={discard} onOpenChange={setDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('attendanceManagement.leaveTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('attendanceManagement.leaveDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('attendanceManagement.continueEditing')}
            </AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={() => {
                savedRef.current = true;
                void navigate(closeTo, { replace: true });
              }}
            >
              {t('attendanceManagement.discard')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteDialog>
  );
}
function ScheduleFooter({ busy, ready }: { busy: boolean; ready: boolean }) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={busy}
        onClick={() => void close()}
      >
        {t('attendanceManagement.cancel')}
      </Button>
      <Button
        type='submit'
        form='attendance-schedule-form'
        disabled={busy || !ready}
      >
        {busy ? <Spinner data-icon='inline-start' /> : null}
        {t(`attendanceManagement.${busy ? 'saving' : 'save'}`)}
      </Button>
    </>
  );
}
function ScheduleForm({
  current,
  reference,
  timeZone,
  departmentId,
  date,
  source,
  busyRef,
  dirtyRef,
  savedRef,
  reload,
  onStateChange,
}: {
  current: Schedule | null;
  reference?: Revision;
  timeZone: string;
  departmentId: string;
  date: string;
  source: SourceContext;
  busyRef: React.RefObject<boolean>;
  dirtyRef: React.RefObject<boolean>;
  savedRef: React.RefObject<boolean>;
  reload: () => void;
  onStateChange: (value: { busy: boolean; ready: boolean }) => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay();
  const schema = useMemo(
    () =>
      z
        .object({
          restDay: z.boolean(),
          shiftId: z.string(),
          revision: z.string(),
          reason: z
            .string()
            .trim()
            .min(1, t('attendanceManagement.required'))
            .max(2000, t('attendanceManagement.reasonTooLong')),
        })
        .superRefine((v, ctx) => {
          if (
            !v.restDay &&
            (!v.shiftId || !/^\d+$/.test(v.revision) || Number(v.revision) < 1)
          )
            ctx.addIssue({
              code: 'custom',
              path: ['shiftId'],
              message: t('attendanceManagement.selectShift'),
            });
        }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      restDay: current?.revision.restDay ?? false,
      shiftId: reference?.shiftId ?? '',
      revision: reference ? String(reference.revision) : '',
      reason: '',
    },
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const [searchText, setSearchText] = useState(''),
    [search, setSearch] = useState(''),
    [composing, setComposing] = useState(false);
  useEffect(() => {
    if (composing) return;
    const timer = window.setTimeout(() => setSearch(searchText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchText, composing]);
  const shifts = useAttendanceResource<ShiftPage>(
    'attendanceManagement/shifts',
    {
      page: '1',
      pageSize: '100',
      search,
      enabled: 'true',
      sort: 'code',
      direction: 'asc',
    },
  );
  const selected = useWatch({ control: form.control, name: 'shiftId' }),
    revision = useWatch({ control: form.control, name: 'revision' }),
    restDay = useWatch({ control: form.control, name: 'restDay' });
  const chosen = useAttendanceResource<Envelope<CurrentShift>>(
    selected && !restDay
      ? `attendanceManagement/shifts/${encodeURIComponent(selected)}`
      : null,
  );
  const exact = useAttendanceResource<Envelope<Revision | null>>(
    selected && /^\d+$/.test(revision) && Number(revision) > 0 && !restDay
      ? 'attendanceManagement/shiftRevision'
      : null,
    { shiftId: selected, revision },
  );
  const dirty = form.formState.isDirty;
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirtyRef, dirty]);
  const terminal =
    error instanceof ApiClientError &&
    [401, 403, 404, 409].includes(error.status);
  const eligible =
    restDay ||
    (!!chosen.data?.data.shift.enabled &&
      !!exact.data?.data &&
      exact.data.data.timeZone === timeZone &&
      !chosen.loading &&
      !exact.loading &&
      !chosen.error &&
      !exact.error);
  useEffect(
    () => onStateChange({ busy, ready: eligible && !terminal }),
    [onStateChange, busy, eligible, terminal],
  );
  const options = (shifts.data?.data ?? []).map((s) => ({
    value: s.id,
    label: `${s.code} · ${s.name}`,
  }));
  if (reference && !options.some((o) => o.value === reference.shiftId))
    options.push({ value: reference.shiftId, label: reference.name });
  async function save(values: z.infer<typeof schema>) {
    if (busyRef.current || !eligible || terminal) return;
    busyRef.current = true;
    setBusy(true);
    onStateChange({ busy: true, ready: false });
    setError(undefined);
    try {
      const saved = await api.request<Envelope<Schedule>>({
        path: 'attendanceManagement/schedule',
        method: 'POST',
        json: {
          departmentId,
          date,
          restDay: values.restDay,
          shiftRevisionId: values.restDay ? null : exact.data!.data!.id,
          expectedVersion: current?.version ?? null,
          reason: values.reason,
        },
      });
      savedRef.current = true;
      dirtyRef.current = false;
      busyRef.current = false;
      form.reset(values);
      source.onScheduleSaved(saved.data);
      toaster.show({ title: t('attendanceManagement.saved'), type: 'success' });
      await close();
    } catch (failure) {
      setError(failure);
      fieldViolationsOf(failure).forEach((field, index) =>
        form.setError(
          field as Path<z.infer<typeof schema>>,
          {
            message: t(
              'attendanceManagement.errors.ATTENDANCE_SCHEDULE_INVALID',
            ),
          },
          { shouldFocus: index === 0 },
        ),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <form
      id='attendance-schedule-form'
      noValidate
      onSubmit={(event) => void form.handleSubmit(save)(event)}
      className='flex flex-col gap-4'
    >
      {error ? (
        <Failure error={error} retry={terminal ? reload : undefined} />
      ) : null}
      <p className='text-sm text-muted-foreground'>
        {date} · {timeZone}
      </p>
      <fieldset disabled={busy || terminal} className='flex flex-col gap-4'>
        <FieldGroup>
          <Controller
            name='restDay'
            control={form.control}
            render={({ field }) => (
              <Field orientation='horizontal'>
                <Checkbox
                  id='attendance-rest-day'
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
                <FieldLabel htmlFor='attendance-rest-day'>
                  {t('attendanceManagement.restDay')}
                </FieldLabel>
              </Field>
            )}
          />
          <FieldDescription>
            {t('attendanceManagement.restHint')}
          </FieldDescription>
          {!restDay ? (
            <>
              <Field>
                <FieldLabel htmlFor='attendance-shift-search'>
                  {t('attendanceManagement.search')}
                </FieldLabel>
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  onCompositionStart={() => setComposing(true)}
                  onCompositionEnd={(event) => {
                    setSearchText(event.currentTarget.value);
                    setComposing(false);
                  }}
                  id='attendance-shift-search'
                  placeholder={t('attendanceManagement.search')}
                />
              </Field>
              {shifts.loading ? (
                <Loading />
              ) : shifts.error ? (
                <Failure error={shifts.error} retry={shifts.reload} />
              ) : null}
              {(shifts.data?.meta.total ?? 0) > 100 ? (
                <p className='text-sm text-muted-foreground'>
                  {t('attendanceManagement.shiftOptionsCap')}
                </p>
              ) : null}
              <Controller
                name='shiftId'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='attendance-shift-choice'>
                      {t('attendanceManagement.shifts')}{' '}
                      <span aria-hidden='true' className='text-destructive'>
                        *
                      </span>
                    </FieldLabel>
                    <OptionSelect
                      ref={field.ref}
                      onBlur={field.onBlur}
                      id='attendance-shift-choice'
                      value={field.value}
                      options={options}
                      onChange={(value) => {
                        field.onChange(value);
                        const s = shifts.data?.data.find(
                          (item) => item.id === value,
                        );
                        form.setValue(
                          'revision',
                          s ? String(s.currentRevision) : '',
                          { shouldDirty: true },
                        );
                      }}
                      invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              <Controller
                name='revision'
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor='attendance-shift-revision'>
                      {t('attendanceManagement.shiftRevision')}{' '}
                      <span aria-hidden='true' className='text-destructive'>
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id='attendance-shift-revision'
                      inputMode='numeric'
                      aria-required='true'
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
              {chosen.error || exact.error ? (
                <Failure
                  error={chosen.error ?? exact.error}
                  retry={() => {
                    chosen.reload();
                    exact.reload();
                  }}
                />
              ) : chosen.loading || exact.loading ? (
                <Loading />
              ) : !eligible ? (
                <Alert>
                  <AlertDescription>
                    {t('attendanceManagement.noEnabledShifts')}
                  </AlertDescription>
                </Alert>
              ) : exact.data?.data ? (
                <p className='text-sm'>
                  {exact.data.data.name} ·{' '}
                  {t('attendanceManagement.revisionLabel', {
                    revision: exact.data.data.revision,
                  })}
                </p>
              ) : null}
            </>
          ) : null}
          <Controller
            name='reason'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor='attendance-schedule-reason'>
                  {t('attendanceManagement.reason')}{' '}
                  <span aria-hidden='true' className='text-destructive'>
                    *
                  </span>
                </FieldLabel>
                <Textarea
                  {...field}
                  id='attendance-schedule-reason'
                  aria-required='true'
                  aria-invalid={fieldState.invalid || undefined}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </FieldGroup>
      </fieldset>
      {busy ? (
        <p role='status' className='flex items-center gap-2 text-sm'>
          <Spinner />
          {t('attendanceManagement.saving')}
        </p>
      ) : null}
    </form>
  );
}
