import { useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { PencilIcon } from 'lucide-react';
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, Outlet, useLocation, useOutletContext } from 'react-router';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  PROFILE,
  type EmployeePageOutletContext,
  type EmployeeProfile,
  type EmployeeProfileOutletContext,
} from '../types.js';
import { useDateText } from '../dates.js';
import { FieldList } from './fields.js';
import { TabLoadError, TabSkeleton } from './load-state.js';

/**
 * Tab `profile`: the controlled information. The endpoint answers every field with `profile.view`, the bank account
 * only with `viewBank` (`access: 'bank'`), and 403 without either.
 */
export default function EmployeeProfileTab(): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const location = useLocation();
  const context = useOutletContext<EmployeePageOutletContext>();
  const { employee } = context;
  const date = useDateText();
  const canUpdate = useCan({ resource: PROFILE, action: 'update' }).can;

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

  const [saved, setSaved] = useState<EmployeeProfile>();
  const onProfileSaved = useCallback((profile: EmployeeProfile) => {
    setSaved(profile);
  }, []);
  const overlayContext = useMemo<EmployeeProfileOutletContext>(
    () => ({ ...context, onProfileSaved }),
    [context, onProfileSaved],
  );

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const profile = saved ?? result?.profile;

  let content: ReactElement;
  if (error) {
    content = (
      <TabLoadError
        error={error}
        onRetry={() => setReloadCount((count) => count + 1)}
      />
    );
  } else if (!profile) {
    content = <TabSkeleton />;
  } else {
    const full = profile.access === 'full';
    const bank = [
      { label: t('employees.fields.bankName'), value: profile.bankName },
      { label: t('employees.fields.bankAccount'), value: profile.bankAccount },
      {
        label: t('employees.fields.bankAccountName'),
        value: profile.bankAccountName,
      },
    ];
    content = (
      <Card>
        <CardHeader>
          <CardTitle>{t('employees.profile.title')}</CardTitle>
          <CardDescription>
            {full
              ? t('employees.profile.description')
              : t('employees.profile.bankOnly')}
          </CardDescription>
          {full && canUpdate ? (
            <CardAction>
              <Button
                variant='outline'
                size='sm'
                nativeButton={false}
                render={
                  <Link
                    to={{ pathname: 'editProfile', search: location.search }}
                  />
                }
              >
                <PencilIcon data-icon='inline-start' />
                {t('employees.actions.editProfile')}
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <FieldList
            items={
              full
                ? [
                    {
                      label: t('employees.fields.idType'),
                      value: profile.idType,
                    },
                    {
                      label: t('employees.fields.idNumber'),
                      value: profile.idNumber,
                    },
                    {
                      label: t('employees.fields.birthDate'),
                      value: date(profile.birthDate),
                    },
                    {
                      label: t('employees.fields.address'),
                      value: profile.address,
                    },
                    {
                      label: t('employees.fields.education'),
                      value: profile.education,
                    },
                    {
                      label: t('employees.fields.school'),
                      value: profile.school,
                    },
                    {
                      label: t('employees.fields.major'),
                      value: profile.major,
                    },
                    ...bank,
                  ]
                : bank
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {content}
      <Outlet context={overlayContext} />
    </>
  );
}
