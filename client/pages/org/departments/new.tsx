import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useRef, useState } from 'react';
import { useOutletContext, useParams } from 'react-router';

import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';

import { DepartmentForm } from './department-form.js';
import { FormDialogFooter } from '../dialog-parts.js';
import type { DepartmentsOutletContext } from './types.js';

const FORM_ID = 'org-department-new-form';

/**
 * Creates a department. Two routes load it: `new` under the page (top level, any parent may be picked) and `new`
 * under a selected department, which starts the parent at that department.
 */
export default function NewDepartmentPage(): ReactElement {
  const { t } = useTranslation();
  const { departmentId } = useParams();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  return (
    <RouteDialog
      title={
        departmentId
          ? t('org.departments.createChild')
          : t('org.departments.create')
      }
      description={t('org.departments.formDescription')}
      beforeClose={() => !submittingRef.current}
      footer={
        <FormDialogFooter
          formId={FORM_ID}
          submitting={submitting}
          submitLabel={t('actions.create')}
        />
      }
    >
      <NewDepartmentBody
        {...(departmentId ? { parentId: departmentId } : {})}
        onSubmittingChange={handleSubmittingChange}
      />
    </RouteDialog>
  );
}

function NewDepartmentBody({
  parentId,
  onSubmittingChange,
}: {
  readonly parentId?: string;
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<DepartmentsOutletContext>();
  return (
    <DepartmentForm
      formId={FORM_ID}
      {...(parentId ? { parentId } : {})}
      onSubmittingChange={onSubmittingChange}
      onSubmitted={() => {
        reload();
        void close();
      }}
    />
  );
}
