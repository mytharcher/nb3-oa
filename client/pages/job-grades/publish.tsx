import { createRequestKey } from '#lib/request-key';
import { useEffect, useRef, useState } from 'react';
import {
  ApiClientError,
  useApiClient,
  useNavigationGuard,
  usePageBreadcrumb,
  useToaster,
} from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useNavigate, useOutletContext } from 'react-router';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Spinner } from '#components/ui/spinner';
import {
  Field,
  FieldError,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldSet,
  FieldLegend,
} from '#components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Alert, AlertDescription, AlertAction } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { fieldViolationsOf } from '../platform/shared/errors.js';
import { Failure, Loading } from './states.js';
import { useResource } from './resource.js';
import {
  resource,
  cents,
  clearPending,
  draftOf,
  readPending,
  recoveredDraft,
  savePending,
  validate,
  type Current,
  type Draft,
  type Envelope,
  type Grade,
  type Revision,
  type SourceContext,
} from './types.js';
export default function PublishSalaryGrade() {
  const { t: drawerTitle } = useTranslation();
  const { session } = useAuthentication(),
    actorId = session?.user.id ?? '',
    { t } = useTranslation(),
    source = useOutletContext<SourceContext>();
  const salary = useCan({ resource, action: 'viewSalary' }),
    manage = useCan({ resource, action: 'manage' });
  const allowed =
    salary.can &&
    manage.can &&
    !salary.isPending &&
    !manage.isPending &&
    !salary.error &&
    !manage.error;
  const current = useResource<{ data: Current }>(
      allowed ? 'salaryGradeTables/current' : null,
    ),
    grades = useResource<{ data: Grade[] }>(allowed ? 'grades/options' : null);
  const [epoch, setEpoch] = useState(0);
  usePageBreadcrumb([
    {
      label: t('jobGrades.title'),
      to: { pathname: source.source, search: source.search },
    },
    { label: t('jobGrades.publish') },
  ]);
  const refusal =
    (!salary.isPending &&
      !manage.isPending &&
      !salary.error &&
      !manage.error &&
      !allowed) ||
    [current.error, grades.error].some(
      (e) => e instanceof ApiClientError && [401, 403].includes(e.status),
    );
  useEffect(() => {
    if (refusal) {
      try {
        clearPending();
      } catch {
        /* No write is offered while access is refused. */
      }
    }
  }, [refusal]);
  const reload = () => {
    setEpoch((n) => n + 1);
    current.reload();
    grades.reload();
  };
  const error = current.error ?? grades.error;
  return (
    <RouteFormPage presentation='page' title={drawerTitle('jobGrades.publish')}>
      <PageContainer>
        <PageHeader
          title={t('jobGrades.publish')}
          description={t('jobGrades.replacement')}
        />
        {salary.isPending || manage.isPending ? (
          <Loading kind='form' />
        ) : salary.error || manage.error ? (
          <Failure
            error={salary.error ?? manage.error}
            retry={() => {
              salary.retry();
              manage.retry();
            }}
          />
        ) : !allowed ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t(
                salary.can
                  ? 'jobGrades.publishDenied'
                  : 'jobGrades.privateDenied',
              )}
            </AlertDescription>
          </Alert>
        ) : error ? (
          <Failure error={error} retry={reload} />
        ) : current.loading ||
          grades.loading ||
          !current.data ||
          !grades.data ? (
          <Loading kind='form' />
        ) : (
          <PublicationForm
            key={`${actorId}:${epoch}`}
            actorId={actorId}
            current={current.data.data}
            grades={grades.data.data}
            source={source}
            reload={reload}
          />
        )}
      </PageContainer>
    </RouteFormPage>
  );
}
function PublicationForm({
  actorId,
  current,
  grades,
  source,
  reload,
}: {
  actorId: string;
  current: Current;
  grades: Grade[];
  source: SourceContext;
  reload: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    navigate = useNavigate();
  // Read once on mount, before any POST; the exact command survives navigation/reload in this private tab.
  const [recovery] = useState(() => {
    try {
      return { envelope: readPending(actorId), failed: false };
    } catch {
      return { envelope: null, failed: true };
    }
  });
  const [pending, setPending] = useState<Envelope | null>(recovery.envelope),
    [storageFailed, setStorageFailed] = useState(recovery.failed);
  const [values, setValues] = useState<Draft>(() =>
    recovery.envelope ? recoveredDraft(recovery.envelope) : draftOf(current),
  );
  const [baseline] = useState(() =>
    JSON.stringify(draftOf(current), (key, value: unknown) =>
      key === 'rowKey' ? undefined : value,
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [attempted, setAttempted] = useState(false),
    [busy, setBusy] = useState(false),
    [conflict, setConflict] = useState(false),
    [message, setMessage] = useState<string>(),
    [denied, setDenied] = useState<unknown>(),
    [confirm, setConfirm] = useState<'discard' | 'replace' | null>(null);
  const busyRef = useRef(false),
    savedRef = useRef(false),
    leaveRef = useRef(false),
    aliveRef = useRef(true),
    formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);
  const dirty =
      JSON.stringify(values, (key, value: unknown) =>
        key === 'rowKey' ? undefined : value,
      ) !== baseline,
    unknown = !!pending;
  const locked = busy || unknown || conflict || storageFailed || !!denied;
  useNavigationGuard(() => {
    if (busyRef.current || pending) return false;
    if (savedRef.current || leaveRef.current || !dirty) return true;
    setConfirm('discard');
    return false;
  });
  useEffect(() => {
    if (!dirty && !busy && !unknown) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, busy, unknown]);
  function change(next: Draft) {
    leaveRef.current = false;
    setValues(next);
    if (attempted) setErrors(validate(next, grades));
    setMessage(undefined);
  }
  function focusError(fields: Record<string, string>) {
    requestAnimationFrame(() => {
      const name = Object.keys(fields)[0];
      const element = name
        ? formRef.current?.querySelector<HTMLElement>(`[data-field="${name}"]`)
        : null;
      (
        element ??
        formRef.current?.querySelector<HTMLElement>('[data-field="bands"]')
      )?.focus();
    });
  }
  function clearCommand() {
    try {
      clearPending();
      setPending(null);
      return true;
    } catch {
      setStorageFailed(true);
      return false;
    }
  }
  async function publish(command: Envelope) {
    if (busyRef.current || !actorId || storageFailed || denied) return;
    try {
      savePending(command);
    } catch {
      setStorageFailed(true);
      return;
    }
    setPending(command);
    setMessage(undefined);
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await api.request<{ data: Revision }>({
        path: 'salaryGradeTables',
        method: 'POST',
        json: command.body,
      });
      // Receipt is authoritative. A failed list refresh must never turn this into a repeated publication.
      savedRef.current = true;
      clearCommand();
      if (!aliveRef.current) return;
      source.onPublished(result.data);
      toaster.show({
        title: t('jobGrades.success', { version: result.data.version }),
        type: 'success',
      });
      busyRef.current = false;
      await navigate(
        { pathname: source.source, search: source.search },
        { replace: true },
      );
      source.focusList();
    } catch (failure) {
      if (!aliveRef.current) return;
      const status = failure instanceof ApiClientError ? failure.status : 0;
      if (status === 401 || status === 403) {
        clearCommand();
        setValues({ reason: '', bands: [] });
        setErrors({});
        setDenied(failure);
      } else if (status === 409) {
        clearCommand();
        setConflict(true);
      } else if (status >= 400 && status < 500) {
        clearCommand();
        const fields: Record<string, string> = {};
        for (const violation of fieldViolationsOf(failure)) {
          const field = violation
            .replace(/\[(\d+)\]/g, '.$1')
            .replace(/\.minimumCents$/, '.minimum')
            .replace(/\.maximumCents$/, '.maximum');
          if (
            field === 'reason' ||
            field === 'bands' ||
            /^bands\.\d+\.(gradeId|minimum|maximum)$/.test(field)
          )
            fields[field] = 'server';
        }
        setAttempted(true);
        setErrors(fields);
        setMessage('writeFailed');
        focusError(fields);
      } else {
        // Network/5xx is an unknown outcome, not proof of failure. Freeze proposal and retain actor/key/body.
        setMessage('unknown');
      }
    } finally {
      busyRef.current = false;
      if (aliveRef.current) setBusy(false);
    }
  }
  function submit() {
    if (locked) return;
    setAttempted(true);
    const problems = validate(values, grades);
    setErrors(problems);
    if (Object.keys(problems).length) {
      focusError(problems);
      return;
    }
    const command: Envelope = {
      actorId,
      body: {
        requestKey: createRequestKey(),
        expectedVersion: current.version,
        reason: values.reason.trim(),
        bands: values.bands.map((row) => ({
          gradeId: row.gradeId,
          minimumCents: cents(row.minimum)!,
          maximumCents: cents(row.maximum)!,
        })),
      },
    };
    void publish(command);
  }
  function close() {
    if (busyRef.current || pending) return;
    if (dirty) setConfirm('discard');
    else
      void navigate(
        { pathname: source.source, search: source.search },
        { replace: true },
      );
  }
  const fieldError = (field: string) =>
    errors[field] ? (
      <FieldError id={`salary-error-${field.replaceAll('.', '-')}`}>
        {t(`jobGrades.validation.${errors[field]}`)}
      </FieldError>
    ) : null;
  if (denied) return <Failure error={denied} />;
  return (
    <div className='flex max-w-4xl flex-col gap-6'>
      <p className='text-sm font-medium'>
        {t('jobGrades.currentVersion', {
          version: pending?.body.expectedVersion ?? current.version,
        })}
      </p>
      {storageFailed ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('jobGrades.storageFailure')}</AlertDescription>
        </Alert>
      ) : null}
      {conflict ? (
        <Alert variant='destructive'>
          <AlertDescription>{t('jobGrades.conflict')}</AlertDescription>
          <AlertAction>
            <Button variant='outline' onClick={() => setConfirm('replace')}>
              {t('jobGrades.loadLatest')}
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {message || (pending && !busy) ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t(`jobGrades.${message ?? 'unknown'}`)}
          </AlertDescription>
          {pending && !busy ? (
            <AlertAction>
              <Button
                variant='outline'
                disabled={storageFailed}
                onClick={() => void publish(pending)}
              >
                {t('jobGrades.retryPublication')}
              </Button>
            </AlertAction>
          ) : null}
        </Alert>
      ) : null}
      {!grades.length ? (
        <Alert>
          <AlertDescription>{t('jobGrades.noGrades')}</AlertDescription>
        </Alert>
      ) : null}
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
        className='flex flex-col gap-6'
      >
        <FieldSet disabled={locked}>
          <FieldLegend>{t('jobGrades.grade')}</FieldLegend>
          <FieldDescription>
            {t('jobGrades.removeDescription')}
          </FieldDescription>
          <div tabIndex={-1} data-field='bands'>
            {fieldError('bands')}
          </div>
          <FieldGroup>
            {values.bands.map((row, index) => {
              const active = grades.some(
                  (grade) => grade.id === row.gradeId && grade.active,
                ),
                frozen = current.revision?.bands.find(
                  (band) => band.gradeId === row.gradeId,
                );
              const options = grades
                .filter((grade) => grade.active)
                .map((grade) => ({
                  value: grade.id,
                  label: `${grade.title} (${grade.code})`,
                }));
              if (row.gradeId && !active)
                options.push({
                  value: row.gradeId,
                  label: frozen
                    ? `${frozen.gradeTitle} (${frozen.gradeCode})`
                    : row.gradeId,
                });
              const patch = (
                field: 'gradeId' | 'minimum' | 'maximum',
                value: string,
              ) =>
                change({
                  ...values,
                  bands: values.bands.map((band, i) =>
                    i === index ? { ...band, [field]: value } : band,
                  ),
                });
              return (
                <div key={row.rowKey} className='rounded-lg border p-4'>
                  <div className='grid gap-4 sm:grid-cols-3'>
                    <Field data-invalid={!!errors[`bands.${index}.gradeId`]}>
                      <FieldLabel htmlFor={`salary-grade-${index}`}>
                        {t('jobGrades.grade')} *
                      </FieldLabel>
                      <Select
                        items={options}
                        value={row.gradeId || null}
                        disabled={locked}
                        onValueChange={(value) => patch('gradeId', value ?? '')}
                      >
                        <SelectTrigger
                          id={`salary-grade-${index}`}
                          data-field={`bands.${index}.gradeId`}
                          aria-invalid={!!errors[`bands.${index}.gradeId`]}
                          aria-describedby={
                            errors[`bands.${index}.gradeId`]
                              ? `salary-error-bands-${index}-gradeId`
                              : undefined
                          }
                          className='w-full'
                        >
                          <SelectValue
                            placeholder={t('jobGrades.selectGrade')}
                          />
                        </SelectTrigger>
                        <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                          <SelectGroup>
                            {options.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {fieldError(`bands.${index}.gradeId`)}
                      {row.gradeId && !active ? (
                        <FieldDescription>
                          {t('jobGrades.inactive')}
                        </FieldDescription>
                      ) : null}
                    </Field>
                    {(['minimum', 'maximum'] as const).map((field) => (
                      <Field
                        key={field}
                        data-invalid={!!errors[`bands.${index}.${field}`]}
                      >
                        <FieldLabel htmlFor={`salary-${field}-${index}`}>
                          {t(`jobGrades.${field}`)} *
                        </FieldLabel>
                        <Input
                          id={`salary-${field}-${index}`}
                          data-field={`bands.${index}.${field}`}
                          value={row[field]}
                          inputMode='decimal'
                          aria-invalid={!!errors[`bands.${index}.${field}`]}
                          aria-describedby={
                            errors[`bands.${index}.${field}`]
                              ? `salary-error-bands-${index}-${field}`
                              : undefined
                          }
                          disabled={locked}
                          onChange={(event) => patch(field, event.target.value)}
                        />
                        {fieldError(`bands.${index}.${field}`)}
                      </Field>
                    ))}
                  </div>
                  <div className='mt-4 flex justify-end'>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={locked}
                      onClick={() =>
                        change({
                          ...values,
                          bands: values.bands.filter((_, i) => i !== index),
                        })
                      }
                    >
                      {t('jobGrades.remove', { index: index + 1 })}
                    </Button>
                  </div>
                </div>
              );
            })}
          </FieldGroup>
          <Button
            type='button'
            variant='outline'
            disabled={locked || !grades.length}
            onClick={() =>
              change({
                ...values,
                bands: [
                  ...values.bands,
                  {
                    rowKey: createRequestKey(),
                    gradeId: '',
                    minimum: '',
                    maximum: '',
                  },
                ],
              })
            }
          >
            {t('jobGrades.addGrade')}
          </Button>
        </FieldSet>
        <Field data-invalid={!!errors.reason}>
          <FieldLabel htmlFor='salary-reason'>
            {t('jobGrades.reason')} *
          </FieldLabel>
          <Textarea
            id='salary-reason'
            data-field='reason'
            value={values.reason}
            disabled={locked}
            aria-invalid={!!errors.reason}
            aria-describedby={errors.reason ? 'salary-error-reason' : undefined}
            onChange={(e) => change({ ...values, reason: e.target.value })}
          />
          <FieldDescription>{t('jobGrades.reasonHint')}</FieldDescription>
          {fieldError('reason')}
        </Field>
        <div className='flex flex-wrap justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            disabled={busy || unknown}
            onClick={close}
          >
            {t('jobGrades.cancel')}
          </Button>
          <Button type='submit' disabled={locked || !grades.length}>
            {busy ? <Spinner data-icon='inline-start' /> : null}
            {t(busy ? 'jobGrades.publishing' : 'jobGrades.publish')}
          </Button>
        </div>
      </form>
      <AlertDialog
        open={!!confirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                confirm === 'replace'
                  ? 'jobGrades.replaceTitle'
                  : 'jobGrades.unsavedTitle',
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                confirm === 'replace'
                  ? 'jobGrades.replaceDescription'
                  : 'jobGrades.unsavedDescription',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('jobGrades.stay')}</AlertDialogCancel>
            <Button
              onClick={() => {
                if (confirm === 'replace') {
                  setConfirm(null);
                  savedRef.current = true;
                  reload();
                } else {
                  leaveRef.current = true;
                  setConfirm(null);
                  void navigate(
                    { pathname: source.source, search: source.search },
                    { replace: true },
                  );
                  source.focusList();
                }
              }}
            >
              {t(
                confirm === 'replace'
                  ? 'jobGrades.confirmReplace'
                  : 'jobGrades.discard',
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
