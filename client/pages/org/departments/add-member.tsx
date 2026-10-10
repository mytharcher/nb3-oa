import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext } from 'react-router';
import { z } from 'zod';

import { RouteDialog } from '@/components/route-dialog';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { useRouteOverlay } from '@/components/use-route-overlay';
import { UserPicker } from '@/components/user-picker';

import { RequiredMark } from '../org-ui.js';
import { useErrorText, violatedField } from '../shared.js';
import { FormDialogFooter } from '../dialog-parts.js';
import type { DepartmentMember, DepartmentOutletContext } from './types.js';

const FORM_ID = 'org-department-member-form';

/** `:departmentId/members/new`: adds a member to the selected department, stacked on its details. */
export default function AddDepartmentMemberPage(): ReactElement {
  const { t } = useTranslation();
  const { department } = useOutletContext<DepartmentOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  return (
    <RouteDialog
      title={t('org.departments.members.addTitle', { name: department.title })}
      className='sm:max-w-md'
      beforeClose={() => !submittingRef.current}
      footer={
        <FormDialogFooter
          formId={FORM_ID}
          submitting={submitting}
          submitLabel={t('org.departments.members.add')}
        />
      }
    >
      <AddMemberBody onSubmittingChange={handleSubmittingChange} />
    </RouteDialog>
  );
}

function AddMemberBody({
  onSubmittingChange,
}: {
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const errorText = useErrorText();
  const { close } = useRouteOverlay();
  const { department, reload, reloadMembers, memberIds } =
    useOutletContext<DepartmentOutletContext>();

  const schema = useMemo(
    () =>
      z.object({
        userId: z.string().min(1, t('org.common.form.userRequired')),
        primary: z.boolean(),
      }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { userId: '', primary: false },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    let member: DepartmentMember;
    onSubmittingChange(true);
    try {
      const result = await api.request<{ data: DepartmentMember }>({
        path: `departments/${encodeURIComponent(department.id)}/members`,
        method: 'POST',
        // Without `primary`, the server makes the department primary only for someone who has none.
        json: values.primary
          ? { userId: values.userId, primary: true }
          : { userId: values.userId },
      });
      member = result.data;
    } catch (error: unknown) {
      if (violatedField(error) === 'userId') {
        form.setError(
          'userId',
          { message: errorText(error) },
          { shouldFocus: true },
        );
      } else if (error instanceof ApiClientError && error.status === 401) {
        form.setError('root', { type: 'sessionExpired' });
      } else {
        form.setError('root', { message: errorText(error) });
      }
      return;
    } finally {
      onSubmittingChange(false);
    }
    toaster.show({
      type: 'success',
      title: t('org.departments.members.added', {
        name: member.user.name,
        department: department.title,
      }),
    });
    reloadMembers();
    reload();
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
          name='userId'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${FORM_ID}-user`}>
                {t('org.common.fields.user')}
                <RequiredMark />
              </FieldLabel>
              <UserPicker
                id={`${FORM_ID}-user`}
                value={field.value}
                onChange={(value) => field.onChange(value)}
                onBlur={field.onBlur}
                invalid={fieldState.invalid}
                excludeIds={memberIds}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='primary'
          render={({ field }) => (
            <Field orientation='horizontal'>
              <Checkbox
                id={`${FORM_ID}-primary`}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <div className='flex flex-col gap-1'>
                <FieldLabel htmlFor={`${FORM_ID}-primary`}>
                  {t('org.departments.members.makePrimaryField')}
                </FieldLabel>
                <FieldDescription>
                  {t('org.departments.members.makePrimaryHint')}
                </FieldDescription>
              </div>
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
