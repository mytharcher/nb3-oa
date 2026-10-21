import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { format } from 'date-fns';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext } from 'react-router';
import { z } from 'zod';

import { DatePicker } from '#components/date-picker';
import { RouteDrawer } from '#components/route-drawer';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Spinner } from '#components/ui/spinner';
import { Switch } from '#components/ui/switch';
import { Textarea } from '#components/ui/textarea';
import { useRouteOverlay } from '#components/use-route-overlay';

import {
  EMPLOYEE_STATUSES,
  type Employee,
  type EmployeePageOutletContext,
} from '../types.js';
import { parseDay } from '../dates.js';
import { CloseButton } from './edit.js';
import { TabLoadError, TabSkeleton } from './load-state.js';

const FORM_ID = 'employee-correct-status-form';

/**
 * `…/:employeeId/<tab>/correctStatus`: the administrator's data correction. Status otherwise changes only through
 * the flows' exits; this writes the audit log with the mandatory reason and a `correction` history row.
 */
export default function CorrectStatusDialog(): ReactElement {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  return (
    <RouteDrawer
      title={t('employees.correction.title')}
      description={t('employees.correction.description')}
      className='sm:max-w-2xl'
      beforeClose={() => !submittingRef.current}
      footer={
        <>
          <CloseButton label={t('actions.cancel')} disabled={submitting} />
          <Button type='submit' form={FORM_ID} disabled={submitting}>
            {submitting ? <Spinner data-icon='inline-start' /> : null}
            {submitting
              ? t('actions.saving')
              : t('employees.correction.submit')}
          </Button>
        </>
      }
    >
      <CorrectStatusForm
        onSubmittingChange={(value) => {
          submittingRef.current = value;
          setSubmitting(value);
        }}
      />
    </RouteDrawer>
  );
}

function CorrectStatusForm({
  onSubmittingChange,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const api = useApiClient();
  const { employee: shown } = useOutletContext<EmployeePageOutletContext>();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    id: string;
    employee?: Employee;
    error?: unknown;
  }>();
  const key = `${shown.id}:${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    void api
      .request<{ data: Employee }>({
        path: `employees/${encodeURIComponent(shown.id)}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted)
            setResult({ id: key, employee: data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setResult({ id: key, error });
        },
      );
    return () => controller.abort();
  }, [api, shown.id, key]);
  if (result?.id !== key) return <TabSkeleton />;
  if (result.error || !result.employee)
    return (
      <TabLoadError
        error={result.error}
        onRetry={() => setAttempt((v) => v + 1)}
      />
    );
  return (
    <LoadedCorrectStatusForm
      employee={result.employee}
      onSubmittingChange={onSubmittingChange}
    />
  );
}
function LoadedCorrectStatusForm({
  employee,
  onSubmittingChange,
}: {
  readonly employee: Employee;
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { onSaved, onNotFound } = useOutletContext<EmployeePageOutletContext>();

  const schema = useMemo(
    () =>
      z.object({
        status: z.enum(EMPLOYEE_STATUSES),
        lastWorkingDay: z.date().optional(),
        active: z.boolean(),
        reason: z
          .string()
          .trim()
          .min(1, t('employees.correction.reasonRequired'))
          .max(500, t('employees.form.tooLong', { max: 500 })),
      }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      status: employee.status ?? 'regular',
      lastWorkingDay: parseDay(employee.lastWorkingDay),
      active: employee.active ?? true,
      reason: '',
    },
  });

  const statusItems = EMPLOYEE_STATUSES.map((value) => ({
    value,
    label: t(`employees.status.${value}`),
  }));

  const onSubmit = form.handleSubmit(async (values) => {
    let saved: Employee;
    onSubmittingChange(true);
    try {
      saved = (
        await api.request<{ data: Employee }>({
          path: `employees/${encodeURIComponent(employee.id)}/correctStatus`,
          method: 'POST',
          json: {
            status: values.status,
            lastWorkingDay: values.lastWorkingDay
              ? format(values.lastWorkingDay, 'yyyy-MM-dd')
              : null,
            active: values.active,
            reason: values.reason,
          },
        })
      ).data;
    } catch (error: unknown) {
      const apiError = error instanceof ApiClientError ? error : undefined;
      if (apiError?.reason === 'EMPLOYEE_STATUS_UNCHANGED') {
        form.setError('root', { message: t('employees.correction.unchanged') });
      } else if (apiError?.status === 401) {
        form.setError('root', { type: 'sessionExpired' });
      } else if (apiError?.status === 404) {
        onNotFound();
        form.setError('root', { message: t('employees.error.notFound') });
      } else {
        form.setError('root', {
          message:
            apiError?.status === 403
              ? t('employees.error.forbidden')
              : t('employees.error.requestFailed'),
        });
      }
      return;
    } finally {
      onSubmittingChange(false);
    }
    toaster.show({
      type: 'success',
      title: t('employees.correction.success', { name: saved.name }),
    });
    onSaved(saved);
    void close();
  });

  const rootError = form.formState.errors.root;
  return (
    <form id={FORM_ID} noValidate onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup>
        {rootError?.type === 'sessionExpired' ? (
          <SessionExpiredAlert />
        ) : rootError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        ) : null}
        <Controller
          control={form.control}
          name='status'
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${FORM_ID}-status`}>
                {t('employees.fields.status')}
              </FieldLabel>
              <Select
                items={statusItems}
                value={field.value}
                onValueChange={(value) => {
                  if (value) field.onChange(value);
                }}
              >
                <SelectTrigger
                  ref={field.ref}
                  id={`${FORM_ID}-status`}
                  className='w-full'
                  onBlur={field.onBlur}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  <SelectGroup>
                    {statusItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='lastWorkingDay'
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${FORM_ID}-lastWorkingDay`}>
                {t('employees.fields.lastWorkingDay')}
              </FieldLabel>
              <DatePicker
                id={`${FORM_ID}-lastWorkingDay`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                className='w-full'
              />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='active'
          render={({ field }) => (
            <Field orientation='horizontal'>
              <FieldContent>
                <FieldLabel htmlFor={`${FORM_ID}-active`}>
                  {t('employees.fields.active')}
                </FieldLabel>
              </FieldContent>
              <Switch
                id={`${FORM_ID}-active`}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='reason'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${FORM_ID}-reason`}>
                {t('employees.correction.reason')}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Textarea
                {...field}
                id={`${FORM_ID}-reason`}
                placeholder={t('employees.correction.reasonPlaceholder')}
                aria-required='true'
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
