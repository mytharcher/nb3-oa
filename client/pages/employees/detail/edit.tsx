import { UserName } from '#components/user-name';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router';

import { RouteDrawer } from '#components/route-drawer';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { useRouteOverlay } from '#components/use-route-overlay';

import { EmployeeForm } from '../employee-form.js';
import type { Employee, EmployeePageOutletContext } from '../types.js';

const FORM_ID = 'employee-edit-form';

/**
 * `…/:employeeId/<tab>/edit`: edit the basic archive in a drawer over the tab being shown. Eleven fields with two
 * pickers would make a dialog too tall; guideline I1 lists editing a record beside the view it belongs to as a drawer.
 */
export default function EditEmployeeDrawer(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const { employee: shown, onNotFound } =
    useOutletContext<EmployeePageOutletContext>();
  const employeeId = shown.id;
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Load the latest archive before prefilling the form (guidelines T3.8 and R1).
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${employeeId}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly employee?: Employee;
    readonly error?: unknown;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const key = `${employeeId}:${reloadCount}`;
    api
      .request<{ data: Employee }>({
        path: `employees/${encodeURIComponent(employeeId)}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, employee: data });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({ key, error });
          if (error instanceof ApiClientError && error.status === 404)
            onNotFound();
        },
      );
    return () => controller.abort();
  }, [api, employeeId, reloadCount, onNotFound]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;
  const [goneOnSave, setGoneOnSave] = useState(false);
  const notFound = goneOnSave || status === 404;
  const employee = loading ? undefined : result?.employee;

  let body: ReactElement;
  let footer: ReactElement;
  if (status === 401) {
    body = <SessionExpiredAlert />;
    footer = <CloseButton label={t('actions.close')} />;
  } else if (notFound || status === 403) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {notFound
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
  } else if (!employee) {
    body = <FormSkeleton />;
    footer = <CloseButton label={t('actions.cancel')} />;
  } else {
    body = (
      <EditBody
        employee={employee}
        onSubmittingChange={(value) => {
          submittingRef.current = value;
          setSubmitting(value);
        }}
        onNotFound={() => {
          setGoneOnSave(true);
          onNotFound();
        }}
      />
    );
    footer = <SaveFooter submitting={submitting} />;
  }

  return (
    <RouteDrawer
      title={t('employees.edit.title')}
      description={<UserName name={shown.name} />}
      // No closing while saving (T3.5).
      beforeClose={() => !submittingRef.current}
      footer={footer}
    >
      {body}
    </RouteDrawer>
  );
}

function EditBody({
  employee,
  onSubmittingChange,
  onNotFound,
}: {
  readonly employee: Employee;
  readonly onSubmittingChange: (submitting: boolean) => void;
  readonly onNotFound: () => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { onSaved } = useOutletContext<EmployeePageOutletContext>();
  return (
    <EmployeeForm
      formId={FORM_ID}
      employee={employee}
      onSubmittingChange={onSubmittingChange}
      onNotFound={onNotFound}
      onSubmitted={(saved) => {
        onSaved(saved);
        void close();
      }}
    />
  );
}

function SaveFooter({
  submitting,
}: {
  readonly submitting: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <CloseButton label={t('actions.cancel')} disabled={submitting} />
      <Button type='submit' form={FORM_ID} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('actions.saving') : t('actions.save')}
      </Button>
    </>
  );
}

export function CloseButton({
  label,
  disabled = false,
}: {
  readonly label: string;
  readonly disabled?: boolean;
}): ReactElement {
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button
      type='button'
      variant='outline'
      disabled={disabled || isClosing}
      onClick={() => void close()}
    >
      {label}
    </Button>
  );
}

export function FormSkeleton(): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      role='status'
      aria-label={t('status.loading')}
      className='flex flex-col gap-5'
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className='flex flex-col gap-2'>
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-8 w-full' />
        </div>
      ))}
    </div>
  );
}
