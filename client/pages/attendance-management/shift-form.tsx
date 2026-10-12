import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm, type Path } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApiClientError,
  useApiClient,
  useNavigationGuard,
  usePageBreadcrumb,
  useToaster,
} from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import { BackButton } from '#components/back-button';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
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
  FieldSet,
  FieldLegend,
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
import { Plus, Trash2 } from 'lucide-react';
import { fieldViolationsOf } from '../platform/shared/errors.js';
import { useAttendanceResource } from './resource.js';
import { Failure, Loading } from './states.js';
import { OptionSelect } from './select.js';
import {
  resource,
  type CurrentShift,
  type Envelope,
  type Shift,
  type SourceContext,
} from './types.js';
function formSchema(t: (key: string) => string) {
  const integer = z
    .string()
    .trim()
    .refine(
      (v) => /^\d+$/.test(v) && Number.isSafeInteger(Number(v)),
      t('attendanceManagement.invalidNumber'),
    );
  const time = z
    .string()
    .regex(
      /^(?:[01]\d|2[0-3]):[0-5]\d$/,
      t('attendanceManagement.invalidShift'),
    );
  return z
    .object({
      code: z
        .string()
        .regex(/^[a-zA-Z0-9_-]{1,64}$/, t('attendanceManagement.invalidCode')),
      name: z
        .string()
        .trim()
        .min(1, t('attendanceManagement.required'))
        .max(200, t('attendanceManagement.nameTooLong')),
      enabled: z.boolean(),
      intervals: z
        .array(
          z.object({
            start: time,
            end: time,
            startDayOffset: z.union([z.literal(0), z.literal(1)]),
            endDayOffset: z.union([z.literal(0), z.literal(1)]),
          }),
        )
        .min(1, t('attendanceManagement.invalidShift'))
        .max(16, t('attendanceManagement.invalidShift')),
      lateToleranceMinutes: integer,
      earlyToleranceMinutes: integer,
      absenceThresholdMinutes: integer,
      reason: z
        .string()
        .trim()
        .min(1, t('attendanceManagement.required'))
        .max(2000, t('attendanceManagement.reasonTooLong')),
    })
    .superRefine((v, ctx) => {
      const minute = (s: string, offset: number) =>
        Number(s.slice(0, 2)) * 60 + Number(s.slice(3)) + offset * 1440;
      const ranges = v.intervals.map((i) => ({
        start: minute(i.start, i.startDayOffset),
        end: minute(i.end, i.endDayOffset),
      }));
      const duration = ranges.reduce((n, i) => n + i.end - i.start, 0);
      if (
        !ranges.length ||
        ranges[0].start >= 1440 ||
        ranges.some(
          (i, n) => i.end <= i.start || (n > 0 && i.start < ranges[n - 1].end),
        ) ||
        ranges.at(-1)!.end - ranges[0].start > 1440
      )
        ctx.addIssue({
          code: 'custom',
          path: ['intervals'],
          message: t('attendanceManagement.invalidShift'),
        });
      for (const field of [
        'lateToleranceMinutes',
        'earlyToleranceMinutes',
      ] as const)
        if (Number(v[field]) >= duration)
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: t('attendanceManagement.invalidShift'),
          });
      if (
        Number(v.absenceThresholdMinutes) < 1 ||
        Number(v.absenceThresholdMinutes) > duration
      )
        ctx.addIssue({
          code: 'custom',
          path: ['absenceThresholdMinutes'],
          message: t('attendanceManagement.invalidShift'),
        });
    });
}
type Draft = z.infer<ReturnType<typeof formSchema>>;
export default function ShiftFormPage() {
  const { t } = useTranslation(),
    { shiftId } = useParams(),
    source = useOutletContext<SourceContext>();
  const manage = useCan({ resource, action: 'manage' }),
    allowed = manage.can && !manage.isPending && !manage.error;
  const current = useAttendanceResource<Envelope<CurrentShift>>(
    allowed && shiftId
      ? `attendanceManagement/shifts/${encodeURIComponent(shiftId)}`
      : null,
  );
  const context = useAttendanceResource<Envelope<{ timeZone: string }>>(
    allowed ? 'attendanceManagement/context' : null,
  );
  usePageBreadcrumb([
    {
      label: t('attendanceManagement.title'),
      to: { pathname: source.basePath, search: source.search },
    },
    { label: t(`attendanceManagement.${shiftId ? 'edit' : 'create'}`) },
  ]);
  const reload = () => {
    current.reload();
    context.reload();
  };
  return (
    <RouteFormPage
      presentation='page'
      title={t(`attendanceManagement.${shiftId ? 'edit' : 'create'}`)}
    >
      <PageContainer>
        <BackButton to={{ pathname: source.basePath, search: source.search }} />
        <PageHeader
          title={t(`attendanceManagement.${shiftId ? 'edit' : 'create'}`)}
        />
        {manage.isPending || context.loading || current.loading ? (
          <Loading />
        ) : !allowed || manage.error ? (
          <Failure error={manage.error} denied={!manage.can} />
        ) : context.error || current.error ? (
          <Failure error={context.error ?? current.error} retry={reload} />
        ) : context.data && (!shiftId || current.data) ? (
          <ShiftForm
            key={`${shiftId ?? 'new'}:${current.data?.data.shift.version ?? ''}:${context.data.data.timeZone}`}
            initial={current.data?.data}
            timeZone={context.data.data.timeZone}
            source={source}
            reload={reload}
          />
        ) : null}
      </PageContainer>
    </RouteFormPage>
  );
}
function ShiftForm({
  initial,
  timeZone,
  source,
  reload,
}: {
  initial?: CurrentShift;
  timeZone: string;
  source: SourceContext;
  reload: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    navigate = useNavigate(),
    toaster = useToaster();
  const schema = useMemo(() => formSchema(t), [t]);
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      code: initial?.shift.code ?? '',
      name: initial?.revision.name ?? '',
      enabled: initial?.shift.enabled ?? true,
      intervals: initial?.revision.intervals ?? [],
      lateToleranceMinutes: initial
        ? String(initial.revision.lateToleranceMinutes)
        : '',
      earlyToleranceMinutes: initial
        ? String(initial.revision.earlyToleranceMinutes)
        : '',
      absenceThresholdMinutes: initial
        ? String(initial.revision.absenceThresholdMinutes)
        : '',
      reason: '',
    },
  });
  const intervals = useFieldArray({ control: form.control, name: 'intervals' });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [confirm, setConfirm] = useState<'discard' | 'disable' | null>(null);
  const busyRef = useRef(false),
    savedRef = useRef(false),
    leaveRef = useRef(false);
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const dirty = form.formState.isDirty,
    errors = form.formState.errors,
    formId = 'attendance-shift-form';
  useNavigationGuard(() => {
    if (busyRef.current) return false;
    if (!dirty || savedRef.current || leaveRef.current) return true;
    setConfirm('discard');
    return false;
  });
  useEffect(() => {
    if (!dirty && !busy) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy]);
  const returnTo = () => {
    void navigate(
      { pathname: source.basePath, search: source.search },
      { replace: true },
    );
  };
  const terminal =
    error instanceof ApiClientError &&
    [401, 403, 404, 409].includes(error.status);
  async function save(values: Draft) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    setConfirm(null);
    try {
      const saved = await api.request<Envelope<Shift>>({
        path: 'attendanceManagement/shifts',
        method: 'POST',
        json: {
          ...(initial ? { id: initial.shift.id } : {}),
          code: values.code,
          enabled: values.enabled,
          expectedVersion: initial?.shift.version ?? null,
          reason: values.reason,
          definition: {
            name: values.name,
            timeZone,
            intervals: values.intervals,
            lateToleranceMinutes: Number(values.lateToleranceMinutes),
            earlyToleranceMinutes: Number(values.earlyToleranceMinutes),
            absenceThresholdMinutes: Number(values.absenceThresholdMinutes),
          },
        },
      });
      savedRef.current = true;
      busyRef.current = false;
      form.reset(values);
      source.onShiftSaved(saved.data);
      toaster.show({ title: t('attendanceManagement.saved'), type: 'success' });
      returnTo();
    } catch (failure) {
      setError(failure);
      const fields = fieldViolationsOf(failure).map((field) =>
        field.replace(/^definition\./, ''),
      );
      fields.forEach((field, index) =>
        form.setError(
          field as Path<Draft>,
          { message: t('attendanceManagement.invalidShift') },
          { shouldFocus: index === 0 },
        ),
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  function onValid(values: Draft) {
    if (initial?.shift.enabled && !values.enabled) {
      setPendingDraft(values);
      setConfirm('disable');
    } else return save(values);
  }
  const textField = (
    name:
      | 'code'
      | 'name'
      | 'lateToleranceMinutes'
      | 'earlyToleranceMinutes'
      | 'absenceThresholdMinutes',
  ) => (
    <Controller
      key={name}
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${formId}-${name}`}>
            {t(`attendanceManagement.${name}`)}{' '}
            <span aria-hidden='true' className='text-destructive'>
              *
            </span>
          </FieldLabel>
          <Input
            {...field}
            id={`${formId}-${name}`}
            readOnly={name === 'code' && !!initial}
            aria-required='true'
            aria-invalid={fieldState.invalid || undefined}
            aria-describedby={
              fieldState.error ? `${formId}-${name}-error` : undefined
            }
            inputMode={name.endsWith('Minutes') ? 'numeric' : 'text'}
          />
          <FieldError
            id={`${formId}-${name}-error`}
            errors={[fieldState.error]}
          />
        </Field>
      )}
    />
  );
  return (
    <>
      <form
        id={formId}
        noValidate
        onSubmit={(event) => void form.handleSubmit(onValid)(event)}
        className='flex max-w-2xl flex-col gap-6'
      >
        {error ? (
          <Failure error={error} retry={terminal ? reload : undefined} />
        ) : null}
        {initial && initial.revision.timeZone !== timeZone ? (
          <Alert>
            <AlertDescription>
              {t('attendanceManagement.oldTimeZone')}
            </AlertDescription>
          </Alert>
        ) : null}
        <fieldset disabled={busy || terminal} className='flex flex-col gap-6'>
          <FieldSet>
            <FieldLegend>{t('attendanceManagement.basic')}</FieldLegend>
            <FieldGroup>
              {textField('code')}
              {textField('name')}
              <Field>
                <FieldLabel>{t('attendanceManagement.timeZone')}</FieldLabel>
                <p className='text-sm'>{timeZone}</p>
              </Field>
              <Controller
                name='enabled'
                control={form.control}
                render={({ field }) => (
                  <Field orientation='horizontal'>
                    <Checkbox
                      id={`${formId}-enabled`}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      onBlur={field.onBlur}
                      ref={field.ref}
                    />
                    <FieldLabel htmlFor={`${formId}-enabled`}>
                      {t('attendanceManagement.enabled')}
                    </FieldLabel>
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>{t('attendanceManagement.intervals')}</FieldLegend>
            <FieldDescription>
              {t('attendanceManagement.intervalHint')}
            </FieldDescription>
            <FieldGroup>
              {intervals.fields.map((interval, index) => (
                <FieldSet key={interval.id} className='rounded-lg border p-4'>
                  <FieldLegend variant='label'>
                    {new Intl.NumberFormat().format(index + 1)}
                  </FieldLegend>
                  <FieldGroup>
                    {(
                      [
                        'start',
                        'startDayOffset',
                        'end',
                        'endDayOffset',
                      ] as const
                    ).map((name) => (
                      <Controller
                        key={name}
                        name={`intervals.${index}.${name}`}
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor={`${formId}-${index}-${name}`}>
                              {t(`attendanceManagement.${name}`)}{' '}
                              <span
                                aria-hidden='true'
                                className='text-destructive'
                              >
                                *
                              </span>
                            </FieldLabel>
                            {name === 'start' || name === 'end' ? (
                              <Input
                                {...field}
                                value={String(field.value)}
                                id={`${formId}-${index}-${name}`}
                                aria-required='true'
                                aria-invalid={fieldState.invalid || undefined}
                              />
                            ) : (
                              <OptionSelect
                                ref={field.ref}
                                onBlur={field.onBlur}
                                id={`${formId}-${index}-${name}`}
                                value={String(field.value)}
                                options={[
                                  {
                                    value: '0',
                                    label: t('attendanceManagement.sameDay'),
                                  },
                                  {
                                    value: '1',
                                    label: t('attendanceManagement.nextDay'),
                                  },
                                ]}
                                onChange={(value) =>
                                  field.onChange(Number(value))
                                }
                                invalid={fieldState.invalid}
                              />
                            )}
                            <FieldError errors={[fieldState.error]} />
                          </Field>
                        )}
                      />
                    ))}
                  </FieldGroup>
                  <Button
                    type='button'
                    variant='ghost'
                    className='self-end'
                    onClick={() => intervals.remove(index)}
                  >
                    <Trash2 data-icon='inline-start' />
                    {t('attendanceManagement.removeInterval', {
                      index: index + 1,
                    })}
                  </Button>
                </FieldSet>
              ))}
              <FieldError
                errors={[errors.intervals?.root ?? errors.intervals]}
              />
              <Button
                type='button'
                variant='outline'
                disabled={intervals.fields.length >= 16}
                className='self-start'
                onClick={() =>
                  intervals.append({
                    start: '',
                    end: '',
                    startDayOffset: 0,
                    endDayOffset: 0,
                  })
                }
              >
                <Plus data-icon='inline-start' />
                {t('attendanceManagement.addInterval')}
              </Button>
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>{t('attendanceManagement.rules')}</FieldLegend>
            <FieldGroup>
              {textField('lateToleranceMinutes')}
              {textField('earlyToleranceMinutes')}
              {textField('absenceThresholdMinutes')}
            </FieldGroup>
          </FieldSet>
          <Controller
            name='reason'
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${formId}-reason`}>
                  {t('attendanceManagement.reason')}{' '}
                  <span aria-hidden='true' className='text-destructive'>
                    *
                  </span>
                </FieldLabel>
                <Textarea
                  {...field}
                  id={`${formId}-reason`}
                  aria-required='true'
                  aria-invalid={fieldState.invalid || undefined}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </fieldset>
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={returnTo}
          >
            {t('attendanceManagement.cancel')}
          </Button>
          <Button type='submit' disabled={busy || terminal}>
            {busy ? <Spinner data-icon='inline-start' /> : null}
            {t(`attendanceManagement.${busy ? 'saving' : 'save'}`)}
          </Button>
        </div>
      </form>
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                `attendanceManagement.${confirm === 'disable' ? 'disableTitle' : 'leaveTitle'}`,
                { name: form.getValues('name') },
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                `attendanceManagement.${confirm === 'disable' ? 'disableDescription' : 'leaveDescription'}`,
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('attendanceManagement.continueEditing')}
            </AlertDialogCancel>
            <Button
              variant='destructive'
              disabled={busy}
              onClick={() => {
                if (confirm === 'disable' && pendingDraft)
                  void save(pendingDraft);
                else {
                  leaveRef.current = true;
                  returnTo();
                }
              }}
            >
              {t(
                `attendanceManagement.${confirm === 'disable' ? 'disableConfirm' : 'discard'}`,
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
