import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';

import { RouteDialog } from '@/components/route-dialog';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouteOverlay } from '@/components/use-route-overlay';

import { FormSkeleton } from '../org-ui.js';
import { DepartmentForm } from './department-form.js';
import { CloseButton, FormDialogFooter } from '../dialog-parts.js';
import type { Department, DepartmentOutletContext } from './types.js';

const FORM_ID = 'org-department-edit-form';

/** `:departmentId/edit`: edits or moves the selected department, stacked on its details. */
export default function EditDepartmentPage(): ReactElement {
  const { departmentId = '' } = useParams();
  return <EditDepartment key={departmentId} departmentId={departmentId} />;
}

function EditDepartment({
  departmentId,
}: {
  readonly departmentId: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const { reload } = useOutletContext<DepartmentOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };

  // Load the latest department before prefilling, not the tree's copy (guidelines T3.8 and R1).
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${departmentId}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly department?: Department;
    readonly error?: unknown;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const key = `${departmentId}:${reloadCount}`;
    api
      .request<{ data: Department }>({
        path: `departments/${encodeURIComponent(departmentId)}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, department: data });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({ key, error });
          if (error instanceof ApiClientError && error.status === 404) reload();
        },
      );
    return () => controller.abort();
  }, [api, departmentId, reloadCount, reload]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;
  const [goneOnSave, setGoneOnSave] = useState(false);
  const notFound = goneOnSave || status === 404;
  const department = loading ? undefined : result?.department;

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
          {notFound ? t('org.departments.notFound') : t('org.errors.forbidden')}
        </AlertDescription>
      </Alert>
    );
    footer = <CloseButton label={t('actions.close')} />;
  } else if (error) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('org.errors.requestFailed')}</AlertDescription>
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
  } else if (!department) {
    body = <FormSkeleton fields={6} />;
    footer = <CloseButton label={t('actions.cancel')} />;
  } else {
    body = (
      <EditDepartmentBody
        department={department}
        onSubmittingChange={handleSubmittingChange}
        onNotFound={() => {
          setGoneOnSave(true);
          reload();
        }}
      />
    );
    footer = (
      <FormDialogFooter
        formId={FORM_ID}
        submitting={submitting}
        submitLabel={t('actions.save')}
      />
    );
  }

  return (
    <RouteDialog
      title={t('org.departments.editTitle')}
      description={t('org.departments.formDescription')}
      beforeClose={() => !submittingRef.current}
      footer={footer}
    >
      {body}
    </RouteDialog>
  );
}

function EditDepartmentBody({
  department,
  onSubmittingChange,
  onNotFound,
}: {
  readonly department: Department;
  readonly onSubmittingChange: (submitting: boolean) => void;
  readonly onNotFound: () => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<DepartmentOutletContext>();
  return (
    <DepartmentForm
      formId={FORM_ID}
      department={department}
      onSubmittingChange={onSubmittingChange}
      onNotFound={onNotFound}
      onSubmitted={() => {
        reload();
        void close();
      }}
    />
  );
}
