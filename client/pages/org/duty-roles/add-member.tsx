import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext } from 'react-router';
import { z } from 'zod';

import { RouteDialog } from '#components/route-dialog';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { useRouteOverlay } from '#components/use-route-overlay';
import { UserPicker } from '#components/user-picker';

import { FormDialogFooter } from '../dialog-parts.js';
import { RequiredMark } from '../org-ui.js';
import { useErrorText, violatedField } from '../shared.js';
import type { DutyRoleMember, DutyRoleOutletContext } from './types.js';

const FORM_ID = 'org-duty-role-member-form';

/** `:code/members/new`: adds a member to the role, stacked on its drawer. */
export default function AddDutyRoleMemberPage(): ReactElement {
  const { t } = useTranslation();
  const { roleTitle } = useOutletContext<DutyRoleOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  return (
    <RouteDialog
      title={t('org.dutyRoles.members.addTitle', { role: roleTitle })}
      className='sm:max-w-md'
      beforeClose={() => !submittingRef.current}
      footer={
        <FormDialogFooter
          formId={FORM_ID}
          submitting={submitting}
          submitLabel={t('org.dutyRoles.members.add')}
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
  const { role, roleTitle, memberIds, onMembersChanged } =
    useOutletContext<DutyRoleOutletContext>();

  const schema = useMemo(
    () =>
      z.object({
        userId: z.string().min(1, t('org.common.form.userRequired')),
      }),
    [t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { userId: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    let member: DutyRoleMember;
    onSubmittingChange(true);
    try {
      const result = await api.request<{ data: DutyRoleMember }>({
        path: `dutyRoles/${encodeURIComponent(role.code)}/members`,
        method: 'POST',
        json: { userId: values.userId },
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
      title: t('org.dutyRoles.members.added', {
        name: member.user.name,
        role: roleTitle,
      }),
    });
    onMembersChanged();
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
      </FieldGroup>
    </form>
  );
}
