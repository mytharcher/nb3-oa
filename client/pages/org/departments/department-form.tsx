import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useMemo } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { DepartmentPicker } from '#components/department-picker';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { UserPicker } from '#components/user-picker';

import { RequiredMark } from '../org-ui.js';
import { type OrgUser, useErrorText, violatedField } from '../shared.js';
import type { Department } from './types.js';

const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u;

export interface DepartmentFormProps {
  readonly formId: string;
  /** The latest department when editing; omitted when creating. */
  readonly department?: Department;
  /** The parent a new department starts under. */
  readonly parentId?: string;
  readonly onSubmittingChange: (submitting: boolean) => void;
  readonly onSubmitted: (department: Department) => void;
  readonly onNotFound?: () => void;
}

type FieldName =
  'title' | 'code' | 'parentId' | 'managerId' | 'executiveId' | 'sortOrder';

/**
 * Name, code, parent (which moves the department), head, executive in charge and sort order. Only changed fields
 * are sent on edit, so a concurrent change to another field is not overwritten (guideline R1).
 */
export function DepartmentForm({
  formId,
  department,
  parentId,
  onSubmittingChange,
  onSubmitted,
  onNotFound,
}: DepartmentFormProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const errorText = useErrorText();

  const schema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .trim()
          .min(1, t('org.common.form.titleRequired'))
          .max(255, t('org.common.form.titleTooLong', { max: 255 })),
        code: z
          .string()
          .trim()
          .refine((value) => value === '' || CODE.test(value), {
            message: t('org.common.form.codeFormat'),
          }),
        parentId: z.string(),
        managerId: z.string(),
        executiveId: z.string(),
        sortOrder: z
          .string()
          .trim()
          .refine((value) => value === '' || /^-?\d+$/u.test(value), {
            message: t('org.common.form.integer'),
          }),
      }),
    [t],
  );

  const defaults = {
    title: department?.title ?? '',
    code: department?.code ?? '',
    parentId: department ? (department.parentId ?? '') : (parentId ?? ''),
    managerId: department?.managerId ?? '',
    executiveId: department?.executiveId ?? '',
    sortOrder: department ? String(department.sortOrder) : '',
  };
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  const selectedParent = useWatch({ control: form.control, name: 'parentId' });

  // The pickers show names for the ids the record already names.
  const knownUsers = useMemo(
    () =>
      [department?.manager, department?.executive].filter(
        (user): user is OrgUser => !!user,
      ),
    [department],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    const next = {
      title: values.title,
      code: values.code || null,
      parentId: values.parentId || null,
      managerId: values.managerId || null,
      executiveId: values.parentId ? null : values.executiveId || null,
      sortOrder: values.sortOrder === '' ? 0 : Number(values.sortOrder),
    };
    const previous = department
      ? {
          title: department.title,
          code: department.code,
          parentId: department.parentId,
          managerId: department.managerId,
          executiveId: department.executiveId,
          sortOrder: department.sortOrder,
        }
      : undefined;
    const json = previous
      ? Object.fromEntries(
          Object.entries(next).filter(
            ([key, value]) => previous[key as keyof typeof previous] !== value,
          ),
        )
      : next;
    let saved: Department;
    onSubmittingChange(true);
    try {
      const result = department
        ? await api.request<{ data: Department }>({
            path: `departments/${encodeURIComponent(department.id)}`,
            method: 'PATCH',
            json,
          })
        : await api.request<{ data: Department }>({
            path: 'departments',
            method: 'POST',
            json,
          });
      saved = result.data;
    } catch (error: unknown) {
      const apiError = error instanceof ApiClientError ? error : undefined;
      const field = violatedField(error);
      if (field && field in defaults) {
        form.setError(
          field as FieldName,
          { message: errorText(error) },
          { shouldFocus: true },
        );
      } else if (apiError?.status === 401) {
        form.setError('root', { type: 'sessionExpired' });
      } else if (department && apiError?.status === 404) {
        onNotFound?.();
      } else {
        form.setError('root', { message: errorText(error) });
      }
      return;
    } finally {
      onSubmittingChange(false);
    }
    toaster.show({
      type: 'success',
      title: department
        ? t('org.departments.saved', { name: saved.title })
        : t('org.departments.created', { name: saved.title }),
    });
    onSubmitted(saved);
  });

  const rootError = form.formState.errors.root;

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
        <Controller
          control={form.control}
          name='title'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-title`}>
                {t('org.common.fields.title')}
                <RequiredMark />
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-title`}
                autoComplete='off'
                aria-required='true'
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='code'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-code`}>
                {t('org.common.fields.code')}
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-code`}
                autoComplete='off'
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                {t('org.departments.form.codeHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='parentId'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-parent`}>
                {t('org.departments.fields.parent')}
              </FieldLabel>
              <DepartmentPicker
                id={`${formId}-parent`}
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  if (value)
                    form.setValue('executiveId', '', { shouldDirty: true });
                }}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                placeholder={t('org.departments.form.parentPlaceholder')}
                {...(department ? { excludeSubtreeOf: department.id } : {})}
              />
              <FieldDescription>
                {t('org.departments.form.parentHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='managerId'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-manager`}>
                {t('org.departments.fields.manager')}
              </FieldLabel>
              <UserPicker
                id={`${formId}-manager`}
                value={field.value}
                onChange={(value) => field.onChange(value)}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                knownUsers={knownUsers}
              />
              <FieldDescription>
                {t('org.departments.form.managerHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='executiveId'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-executive`}>
                {t('org.departments.fields.executive')}
              </FieldLabel>
              <UserPicker
                id={`${formId}-executive`}
                disabled={Boolean(selectedParent)}
                value={selectedParent ? '' : field.value}
                onChange={(value) => field.onChange(value)}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                knownUsers={knownUsers}
              />
              <FieldDescription>
                {t('org.departments.form.executiveHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='sortOrder'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-sort`}>
                {t('org.departments.fields.sortOrder')}
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-sort`}
                inputMode='numeric'
                autoComplete='off'
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                {t('org.departments.form.sortOrderHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
