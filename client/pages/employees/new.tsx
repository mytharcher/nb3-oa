import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router';

import { BackButton } from '@/components/back-button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RouteChildPage } from '@/components/route-child-page';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

import { EmployeeForm } from './employee-form.js';
import type { EmployeesOutletContext } from './types.js';

const FORM_ID = 'employee-create-form';

/** Route `/settings/employees/new`: twelve fields and two pickers, so a covering page rather than a dialog (T3.1). */
export default function NewEmployeePage(): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { reload } = useOutletContext<EmployeesOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);

  // A page has no beforeClose: ask before a reload or closing the tab while there are unsaved changes (T3.9).
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton />
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
                },
                { replace: true },
              );
            }}
          />
          <div className='flex flex-wrap justify-end gap-2'>
            <Button
              variant='outline'
              disabled={submitting}
              onClick={() => {
                void navigate(
                  { pathname: '..', search: location.search },
                  { replace: true },
                );
              }}
            >
              {t('actions.cancel')}
            </Button>
            <Button type='submit' form={FORM_ID} disabled={submitting}>
              {submitting ? <Spinner data-icon='inline-start' /> : null}
              {submitting ? t('actions.saving') : t('employees.create.submit')}
            </Button>
          </div>
        </div>
      </PageContainer>
    </RouteChildPage>
  );
}
