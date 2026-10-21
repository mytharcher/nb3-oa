import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router';

import { useFormDiscardGuard } from '#hooks/use-form-discard-guard';
import { FormActions } from '#components/form-actions';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteFormPage } from '#components/route-form-page';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';

import { EmployeeForm } from './employee-form.js';
import type { EmployeesOutletContext } from './types.js';

const FORM_ID = 'employee-create-form';

/** Create an employee over the existing list using the shared form drawer. */
export default function NewEmployeePage(): ReactElement {
  const { t: drawerTitle } = useTranslation();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { reload } = useOutletContext<EmployeesOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const guard = useFormDiscardGuard(dirty, submitting);

  // Browser reload still needs its native unsaved-change warning.
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <RouteFormPage
      title={drawerTitle('employees.create.title')}
      beforeClose={guard.beforeClose}
    >
      <PageContainer>
        <PageHeader
          title={t('employees.create.title')}
          description={t('employees.create.description')}
        />
        <div className='flex max-w-2xl flex-col gap-6'>
          <EmployeeForm
            formId={FORM_ID}
            onSubmittingChange={setSubmitting}
            onDirtyChange={setDirty}
            onSubmitted={(employee) => {
              reload();
              // Open the new archive over the list; replace, so Back does not reopen an empty form.
              void navigate(
                {
                  pathname: `../${encodeURIComponent(employee.id)}`,
                  search: location.search,
                  hash: location.hash,
                },
                { replace: true },
              );
            }}
          />
          <FormActions>
            <Button
              variant='outline'
              disabled={submitting}
              onClick={() => {
                void guard.requestClose(() => {
                  void navigate(
                    { pathname: '..', search: location.search },
                    { replace: true },
                  );
                });
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button type='submit' form={FORM_ID} disabled={submitting}>
              {submitting ? <Spinner data-icon='inline-start' /> : null}
              {submitting ? t('actions.saving') : t('employees.create.submit')}
            </Button>
          </FormActions>
        </div>
        {guard.confirmation}
      </PageContainer>
    </RouteFormPage>
  );
}
