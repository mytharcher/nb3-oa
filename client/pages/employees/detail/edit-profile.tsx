import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { format } from 'date-fns';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext } from 'react-router';
import { z } from 'zod';

import { DatePicker } from '@/components/date-picker';
import { RouteDrawer } from '@/components/route-drawer';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
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
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useRouteOverlay } from '@/components/use-route-overlay';

import type {
  EmployeeProfile,
  EmployeeProfileOutletContext,
} from '../types.js';
import { parseDay } from '../dates.js';
import { CloseButton, FormSkeleton } from './edit.js';

const FORM_ID = 'employee-profile-form';

const TEXT_FIELDS = [
  ['identitySection', ['idType', 'idNumber']],
  ['educationSection', ['education', 'school', 'major']],
  ['bankSection', ['bankName', 'bankAccount', 'bankAccountName']],
] as const;
const LIMITS = {
  idType: 32,
  idNumber: 64,
  education: 32,
  school: 128,
  major: 128,
  bankName: 128,
  bankAccount: 64,
  bankAccountName: 128,
  address: 500,
} as const;

/** `…/:employeeId/profile/editProfile`: edit the controlled information in a drawer over its tab. */
export default function EditProfileDrawer(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const { employee } = useOutletContext<EmployeeProfileOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${employee.id}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly profile?: EmployeeProfile;
    readonly error?: unknown;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const key = `${employee.id}:${reloadCount}`;
    api
      .request<{ data: EmployeeProfile }>({
        path: `employees/${encodeURIComponent(employee.id)}/profile`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, profile: data });
        },
        (error: unknown) => {
          if (!controller.signal.aborted) setResult({ key, error });
        },
      );
    return () => controller.abort();
  }, [api, employee.id, reloadCount]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;
  const profile = loading ? undefined : result?.profile;

  let body: ReactElement;
  let footer: ReactElement;
  if (status === 401) {
    body = <SessionExpiredAlert />;
    footer = <CloseButton label={t('actions.close')} />;
  } else if (status === 403 || status === 404) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {status === 404
            ? t('employees.error.notFound')
            : t('employees.error.forbidden')}
        </AlertDescription>
      </Alert>
    );
    footer = <CloseButton label={t('actions.close')} />;
  } else if (error) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {t('employees.error.requestFailed')}
        </AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setReloadCount((count) => count + 1)}
          >
            {t('status.retry')}
          </Button>
        </AlertAction>
      </Alert>
    );
    footer = <CloseButton label={t('actions.cancel')} />;
  } else if (!profile) {
    body = <FormSkeleton />;
    footer = <CloseButton label={t('actions.cancel')} />;
  } else {
    body = (
      <ProfileForm
        profile={profile}
        onSubmittingChange={(value) => {
          submittingRef.current = value;
          setSubmitting(value);
        }}
      />
    );
    footer = (
      <>
        <CloseButton label={t('actions.cancel')} disabled={submitting} />
        <Button type='submit' form={FORM_ID} disabled={submitting}>
          {submitting ? <Spinner data-icon='inline-start' /> : null}
          {submitting ? t('actions.saving') : t('actions.save')}
        </Button>
      </>
    );
  }

  return (
    <RouteDrawer
      title={t('employees.profile.editTitle')}
      description={employee.name}
      beforeClose={() => !submittingRef.current}
      footer={footer}
    >
      {body}
    </RouteDrawer>
  );
}

type ProfileText = keyof typeof LIMITS;

function ProfileForm({
  profile,
  onSubmittingChange,
}: {
  readonly profile: EmployeeProfile;
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const { close } = useRouteOverlay();
  const { employee, onProfileSaved } =
    useOutletContext<EmployeeProfileOutletContext>();

  const schema = useMemo(() => {
    const text = (max: number) =>
      z.string().trim().max(max, t('employees.form.tooLong', { max }));
    return z.object({
      idType: text(LIMITS.idType),
      idNumber: text(LIMITS.idNumber),
      birthDate: z.date().optional(),
      address: text(LIMITS.address),
      education: text(LIMITS.education),
      school: text(LIMITS.school),
      major: text(LIMITS.major),
      bankName: text(LIMITS.bankName),
      bankAccount: text(LIMITS.bankAccount),
      bankAccountName: text(LIMITS.bankAccountName),
    });
  }, [t]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      idType: profile.idType ?? '',
      idNumber: profile.idNumber ?? '',
      birthDate: parseDay(profile.birthDate),
      address: profile.address ?? '',
      education: profile.education ?? '',
      school: profile.school ?? '',
      major: profile.major ?? '',
      bankName: profile.bankName ?? '',
      bankAccount: profile.bankAccount ?? '',
      bankAccountName: profile.bankAccountName ?? '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const json = {
      idType: values.idType || null,
      idNumber: values.idNumber || null,
      birthDate: values.birthDate
        ? format(values.birthDate, 'yyyy-MM-dd')
        : null,
      address: values.address || null,
      education: values.education || null,
      school: values.school || null,
      major: values.major || null,
      bankName: values.bankName || null,
      bankAccount: values.bankAccount || null,
      bankAccountName: values.bankAccountName || null,
    };
    let saved: EmployeeProfile;
    onSubmittingChange(true);
    try {
      saved = (
        await api.request<{ data: EmployeeProfile }>({
          path: `employees/${encodeURIComponent(employee.id)}/profile`,
          method: 'PATCH',
          json,
        })
      ).data;
    } catch (error: unknown) {
      const apiError = error instanceof ApiClientError ? error : undefined;
      form.setError(
        'root',
        apiError?.status === 401
          ? { type: 'sessionExpired' }
          : {
              message:
                apiError?.status === 403
                  ? t('employees.error.forbidden')
                  : apiError?.status === 404
                    ? t('employees.error.notFound')
                    : t('employees.error.requestFailed'),
            },
      );
      return;
    } finally {
      onSubmittingChange(false);
    }
    toaster.show({
      type: 'success',
      title: t('employees.profile.success', { name: employee.name }),
    });
    onProfileSaved(saved);
    void close();
  });

  const rootError = form.formState.errors.root;
  const textField = (name: ProfileText): ReactElement => (
    <Controller
      key={name}
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${FORM_ID}-${name}`}>
            {t(`employees.fields.${name}`)}
          </FieldLabel>
          <Input
            {...field}
            id={`${FORM_ID}-${name}`}
            autoComplete='off'
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );

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
        {TEXT_FIELDS.map(([section, names]) => (
          <FieldSet key={section}>
            <FieldLegend>{t(`employees.profile.${section}`)}</FieldLegend>
            <FieldGroup>
              {names.map((name) => textField(name))}
              {section === 'identitySection' ? (
                <>
                  <Controller
                    control={form.control}
                    name='birthDate'
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`${FORM_ID}-birthDate`}>
                          {t('employees.fields.birthDate')}
                        </FieldLabel>
                        <DatePicker
                          id={`${FORM_ID}-birthDate`}
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
                    name='address'
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={`${FORM_ID}-address`}>
                          {t('employees.fields.address')}
                        </FieldLabel>
                        <Textarea
                          {...field}
                          id={`${FORM_ID}-address`}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                </>
              ) : null}
            </FieldGroup>
          </FieldSet>
        ))}
      </FieldGroup>
    </form>
  );
}
