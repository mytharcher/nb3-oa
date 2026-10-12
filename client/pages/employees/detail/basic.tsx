import { UserName } from '#components/user-name';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Outlet, useOutletContext } from 'react-router';

import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';

import type { EmployeePageOutletContext } from '../types.js';
import { useDateText } from '../dates.js';
import { FieldList } from './fields.js';

/** Tab `basic` of an employee's page. */
export default function EmployeeBasicTab(): ReactElement {
  const { t } = useTranslation();
  const context = useOutletContext<EmployeePageOutletContext>();
  const { employee } = context;
  const date = useDateText();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('employees.tabs.basic')}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldList
            items={[
              {
                label: t('employees.fields.user'),
                value: employee.user ? (
                  <span className='inline-flex flex-wrap items-center gap-2'>
                    <UserName name={employee.user.name} />
                    <span>{employee.user.email}</span>
                  </span>
                ) : null,
              },
              { label: t('employees.fields.code'), value: employee.code },
              {
                label: t('employees.fields.primaryDepartment'),
                value: employee.primaryDepartment?.title,
              },
              {
                label: t('employees.fields.position'),
                value: employee.position?.title,
              },
              {
                label: t('employees.fields.grade'),
                value: employee.grade?.title,
              },
              {
                label: t('employees.fields.manager'),
                value: <UserName name={employee.manager?.name} />,
              },
              {
                label: t('employees.fields.careerStartDate'),
                value: date(employee.careerStartDate),
              },
              {
                label: t('employees.fields.hireDate'),
                value: date(employee.hireDate),
              },
              {
                label: t('employees.fields.probationEndDate'),
                value: date(employee.probationEndDate),
              },
              {
                label: t('employees.fields.lastWorkingDay'),
                value: date(employee.lastWorkingDay),
              },
              {
                label: t('employees.fields.active'),
                value:
                  employee.active === undefined
                    ? null
                    : employee.active
                      ? t('employees.boolean.yes')
                      : t('employees.boolean.no'),
              },
              { label: t('employees.fields.phone'), value: employee.phone },
              { label: t('employees.fields.email'), value: employee.email },
              {
                label: t('employees.fields.workLocation'),
                value: employee.workLocation,
              },
              {
                label: t('employees.fields.emergencyContact'),
                value: employee.emergencyContact,
              },
            ]}
          />
        </CardContent>
      </Card>
      {/* The overlays the page's header opens over this tab. */}
      <Outlet context={context} />
    </>
  );
}
