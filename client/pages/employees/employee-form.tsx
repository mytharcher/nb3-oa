import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { format, parseISO } from 'date-fns';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useMemo } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { z } from 'zod';

import { DatePicker } from '@/components/date-picker';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { UserPicker } from '@/components/user-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { EmployeePicker } from './employee-picker.js';
import type { Employee } from './types.js';
import { useCatalogOptions } from './use-org-options.js';

const SELECT_CONTENT =
  'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';
const NONE = '__none__';

/** Which input field each server reason is about, and the message shown under it. */
const REASON_FIELDS: Record<
  string,
  {
    field: 'userId' | 'code' | 'managerId' | 'positionId' | 'gradeId';
    key: string;
  }
> = {
  EMPLOYEE_USER_TAKEN: { field: 'userId', key: 'employees.form.userTaken' },
  EMPLOYEE_USER_NOT_FOUND: {
    field: 'userId',
    key: 'employees.form.userInvalid',
  },
  EMPLOYEE_USER_DISABLED: {
    field: 'userId',
    key: 'employees.form.userInvalid',
  },
  EMPLOYEE_CODE_TAKEN: { field: 'code', key: 'employees.form.codeTaken' },
  EMPLOYEE_MANAGER_NOT_FOUND: {
    field: 'managerId',
    key: 'employees.form.managerInvalid',
  },
  EMPLOYEE_MANAGER_INACTIVE: {
    field: 'managerId',
    key: 'employees.form.managerInvalid',
  },
  EMPLOYEE_MANAGER_CYCLE: {
    field: 'managerId',
    key: 'employees.form.managerInvalid',
  },
  EMPLOYEE_POSITION_NOT_FOUND: {
    field: 'positionId',
    key: 'employees.form.positionInvalid',
  },
  EMPLOYEE_GRADE_NOT_FOUND: {
    field: 'gradeId',
    key: 'employees.form.gradeInvalid',
  },
};

export interface EmployeeFormProps {
  /** When editing, the latest archive, just loaded; omit it when creating. */
  readonly employee?: Employee;
  readonly formId: string;
  readonly onSubmitted: (employee: Employee) => void;
  readonly onSubmittingChange?: (submitting: boolean) => void;
  readonly onNotFound?: () => void;
  readonly onDirtyChange?: (dirty: boolean) => void;
}

const toDate = (value: string | null | undefined): Date | undefined =>
  value ? parseISO(value) : undefined;
const toDay = (value: Date | undefined): string | null =>
  value ? format(value, 'yyyy-MM-dd') : null;

/**
 * The archive form, shared by the create page and the edit drawer. The account and the initial status are chosen
 * only when creating; afterwards the status changes only through flows or the administrator's correction.
 */
export function EmployeeForm({
  employee,
  formId,
  onSubmitted,
  onSubmittingChange,
  onNotFound,
  onDirtyChange,
}: EmployeeFormProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const creating = employee === undefined;

  const schema = useMemo(() => {
    const optional = (max: number) =>
      z.string().trim().max(max, t('employees.form.tooLong', { max }));
    return z
      .object({
        userId: z.string(),
        code: z
          .string()
          .trim()
          .min(1, t('employees.form.codeRequired'))
          .max(64, t('employees.form.tooLong', { max: 64 })),
        name: z
          .string()
          .trim()
          .min(1, t('employees.form.nameRequired'))
          .max(128, t('employees.form.tooLong', { max: 128 })),
        status: z.enum(['probation', 'regular']),
        hireDate: z.date().optional(),
        probationEndDate: z.date().optional(),
        managerId: z.string(),
        positionId: z.string(),
        gradeId: z.string(),
        phone: optional(32),
        email: z
          .string()
          .trim()
          .max(255, t('employees.form.tooLong', { max: 255 }))
          .refine(
            (value) => value === '' || z.email().safeParse(value).success,
            t('employees.form.emailInvalid'),
          ),
        workLocation: optional(128),
        emergencyContact: optional(255),
      })
      .superRefine((values, context) => {
        if (creating && !values.userId)
          context.addIssue({
            code: 'custom',
            path: ['userId'],
            message: t('employees.form.userRequired'),
          });
        if (!values.hireDate)
          context.addIssue({
            code: 'custom',
            path: ['hireDate'],
            message: t('employees.form.hireDateRequired'),
          });
      });
  }, [t, creating]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      userId: employee?.userId ?? '',
      code: employee?.code ?? '',
      name: employee?.name ?? '',
      status: 'probation' as 'probation' | 'regular',
      hireDate: toDate(employee?.hireDate),
      probationEndDate: toDate(employee?.probationEndDate),
      managerId: employee?.managerId ?? '',
      positionId: employee?.positionId ?? '',
      gradeId: employee?.gradeId ?? '',
      phone: employee?.phone ?? '',
      email: employee?.email ?? '',
      workLocation: employee?.workLocation ?? '',
      emergencyContact: employee?.emergencyContact ?? '',
    },
  });

  const { isDirty } = form.formState;
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const onSubmit = form.handleSubmit(async (values) => {
    const json = {
      code: values.code,
      name: values.name,
      hireDate: toDay(values.hireDate),
      probationEndDate: toDay(values.probationEndDate),
      managerId: values.managerId || null,
      positionId: values.positionId || null,
      gradeId: values.gradeId || null,
      phone: values.phone || null,
      email: values.email || null,
      workLocation: values.workLocation || null,
      emergencyContact: values.emergencyContact || null,
      ...(creating ? { userId: values.userId, status: values.status } : {}),
    };
    let saved: Employee;
    onSubmittingChange?.(true);
    try {
      const result = employee
        ? await api.request<{ data: Employee }>({
            path: `employees/${encodeURIComponent(employee.id)}`,
            method: 'PATCH',
            json,
          })
        : await api.request<{ data: Employee }>({
            path: 'employees',
            method: 'POST',
            json,
          });
      saved = result.data;
    } catch (error: unknown) {
      const apiError = error instanceof ApiClientError ? error : undefined;
      const known = apiError?.reason
        ? REASON_FIELDS[apiError.reason]
        : undefined;
      if (known) {
        form.setError(
          known.field,
          { message: t(known.key) },
          { shouldFocus: true },
        );
      } else if (apiError?.status === 401) {
        form.setError('root', { type: 'sessionExpired' });
      } else if (employee && apiError?.status === 404) {
        onNotFound?.();
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
      onSubmittingChange?.(false);
    }
    toaster.show({
      type: 'success',
      title: creating
        ? t('employees.create.success', { name: saved.name })
        : t('employees.edit.success', { name: saved.name }),
    });
    onSubmitted(saved);
  });

  const rootError = form.formState.errors.root;
  const id = (field: string): string => `${formId}-${field}`;

  return (
    <form id={formId} noValidate onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup>
        {rootError?.type === 'sessionExpired' ? (
          <SessionExpiredAlert />
        ) : rootError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        ) : null}
        <FieldSet>
          <FieldLegend>{t('employees.form.basicSection')}</FieldLegend>
          <FieldGroup>
            {creating ? (
              <Controller
                control={form.control}
                name='userId'
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={id('userId')}>
                      {t('employees.fields.user')}
                      <Required />
                    </FieldLabel>
                    <UserPicker
                      id={id('userId')}
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      invalid={fieldState.invalid}
                      placeholder={t('employees.form.userPlaceholder')}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ) : null}
            <TextField
              control={form.control}
              name='name'
              id={id('name')}
              label={t('employees.fields.name')}
              required
            />
            <TextField
              control={form.control}
              name='code'
              id={id('code')}
              label={t('employees.fields.code')}
              required
            />
            {creating ? (
              <Controller
                control={form.control}
                name='status'
                render={({ field }) => {
                  const items = (['probation', 'regular'] as const).map(
                    (value) => ({
                      value,
                      label: t(`employees.status.${value}`),
                    }),
                  );
                  return (
                    <Field>
                      <FieldLabel htmlFor={id('status')}>
                        {t('employees.form.initialStatus')}
                      </FieldLabel>
                      <Select
                        items={items}
                        value={field.value}
                        onValueChange={(value) => {
                          if (value) field.onChange(value);
                        }}
                      >
                        <SelectTrigger
                          ref={field.ref}
                          id={id('status')}
                          className='w-full'
                          onBlur={field.onBlur}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={SELECT_CONTENT}>
                          <SelectGroup>
                            {items.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  );
                }}
              />
            ) : null}
            <DateField
              control={form.control}
              name='hireDate'
              id={id('hireDate')}
              label={t('employees.fields.hireDate')}
              required
            />
            <DateField
              control={form.control}
              name='probationEndDate'
              id={id('probationEndDate')}
              label={t('employees.fields.probationEndDate')}
            />
            <Controller
              control={form.control}
              name='managerId'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={id('managerId')}>
                    {t('employees.fields.manager')}
                  </FieldLabel>
                  <EmployeePicker
                    id={id('managerId')}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={fieldState.invalid}
                    excludeId={employee?.id}
                    known={
                      employee?.manager
                        ? {
                            id: employee.manager.id,
                            name: employee.manager.name,
                            code: '',
                          }
                        : null
                    }
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <CatalogField
              control={form.control}
              name='positionId'
              kind='positions'
              id={id('positionId')}
              label={t('employees.fields.position')}
              placeholder={t('employees.form.positionPlaceholder')}
              current={employee?.position ?? null}
            />
            <CatalogField
              control={form.control}
              name='gradeId'
              kind='grades'
              id={id('gradeId')}
              label={t('employees.fields.grade')}
              placeholder={t('employees.form.gradePlaceholder')}
              current={employee?.grade ?? null}
            />
          </FieldGroup>
        </FieldSet>
        <FieldSet>
          <FieldLegend>{t('employees.form.contactSection')}</FieldLegend>
          <FieldGroup>
            <TextField
              control={form.control}
              name='phone'
              id={id('phone')}
              label={t('employees.fields.phone')}
              type='tel'
            />
            <TextField
              control={form.control}
              name='email'
              id={id('email')}
              label={t('employees.fields.email')}
              type='email'
            />
            <TextField
              control={form.control}
              name='workLocation'
              id={id('workLocation')}
              label={t('employees.fields.workLocation')}
            />
            <TextField
              control={form.control}
              name='emergencyContact'
              id={id('emergencyContact')}
              label={t('employees.fields.emergencyContact')}
            />
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}

function Required(): ReactElement {
  return (
    <span aria-hidden='true' className='text-destructive'>
      *
    </span>
  );
}

type TextName =
  'code' | 'name' | 'phone' | 'email' | 'workLocation' | 'emergencyContact';

interface FormShape {
  userId: string;
  code: string;
  name: string;
  status: 'probation' | 'regular';
  hireDate?: Date;
  probationEndDate?: Date;
  managerId: string;
  positionId: string;
  gradeId: string;
  phone: string;
  email: string;
  workLocation: string;
  emergencyContact: string;
}

function TextField({
  control,
  name,
  id,
  label,
  required = false,
  type,
}: {
  readonly control: Control<FormShape>;
  readonly name: TextName;
  readonly id: string;
  readonly label: string;
  readonly required?: boolean;
  readonly type?: string;
}): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>
            {label}
            {required ? <Required /> : null}
          </FieldLabel>
          <Input
            {...field}
            id={id}
            type={type}
            autoComplete='off'
            aria-required={required || undefined}
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function DateField({
  control,
  name,
  id,
  label,
  required = false,
}: {
  readonly control: Control<FormShape>;
  readonly name: 'hireDate' | 'probationEndDate';
  readonly id: string;
  readonly label: string;
  readonly required?: boolean;
}): ReactElement {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>
            {label}
            {required ? <Required /> : null}
          </FieldLabel>
          <DatePicker
            id={id}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            invalid={fieldState.invalid}
            className='w-full'
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function CatalogField({
  control,
  name,
  kind,
  id,
  label,
  placeholder,
  current,
}: {
  readonly control: Control<FormShape>;
  readonly name: 'positionId' | 'gradeId';
  readonly kind: 'positions' | 'grades';
  readonly id: string;
  readonly label: string;
  readonly placeholder: string;
  /** The archive's current value, kept selectable even when it has since been disabled. */
  readonly current: { readonly id: string; readonly title: string } | null;
}): ReactElement {
  const { t } = useTranslation();
  const { options, error, retry } = useCatalogOptions(kind);
  const items = [
    { value: NONE, label: t('employees.form.none') },
    ...(options ?? [])
      .filter((option) => option.active)
      .map((option) => ({ value: option.id, label: option.title })),
  ];
  if (current && !items.some((item) => item.value === current.id))
    items.push({ value: current.id, label: current.title });

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {error ? (
            <div
              role='alert'
              className='flex items-center gap-2 text-sm text-destructive'
            >
              <span>{t('employees.form.optionsFailed')}</span>
              <Button type='button' variant='outline' size='sm' onClick={retry}>
                {t('status.retry')}
              </Button>
            </div>
          ) : (
            <Select
              items={items}
              value={field.value || NONE}
              onValueChange={(value) =>
                field.onChange(value === NONE || !value ? '' : value)
              }
            >
              <SelectTrigger
                ref={field.ref}
                id={id}
                className='w-full'
                aria-invalid={fieldState.invalid}
                onBlur={field.onBlur}
                disabled={options === undefined}
              >
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent className={SELECT_CONTENT}>
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
