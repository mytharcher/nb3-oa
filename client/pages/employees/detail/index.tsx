import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertCircleIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldAlertIcon,
} from 'lucide-react';
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Link,
  matchPath,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
  useResolvedPath,
} from 'react-router';

import { BackButton } from '@/components/back-button';
import { PageContainer } from '@/components/page-container';
import { PageHeader } from '@/components/page-header';
import { RouteChildPage } from '@/components/route-child-page';
import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { withoutParams } from '@/hooks/use-url-search';
import { cn } from 'cn';

import { EmployeeStatusBadge } from '../status-badge.js';
import {
  ARCHIVE,
  COMPENSATION,
  EMPLOYEE_PAGE_PARAMS,
  PROFILE,
  type Employee,
  type EmployeePageOutletContext,
  type EmployeesOutletContext,
} from '../types.js';

/** Route `:employeeId` under the archive list: the employee's page, covering the list. */
export default function EmployeePage(): ReactElement {
  const { employeeId = '' } = useParams();
  return <EmployeePageContent key={employeeId} employeeId={employeeId} />;
}

function EmployeePageContent({
  employeeId,
}: {
  readonly employeeId: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const location = useLocation();
  const pagePath = useResolvedPath('.');
  const { reload: reloadOwner } = useOutletContext<EmployeesOutletContext>();

  const canViewProfile = useCan({ resource: PROFILE, action: 'view' }).can;
  const canViewBank = useCan({ resource: PROFILE, action: 'viewBank' }).can;
  const canViewCompensation = useCan({
    resource: COMPENSATION,
    action: 'view',
  }).can;

  // Tabs the user may not read are left out; their URLs still answer with an explanation (guideline S6).
  const tabs = [
    { path: 'basic', label: t('employees.tabs.basic'), shown: true },
    {
      path: 'profile',
      label: t('employees.tabs.profile'),
      shown: canViewProfile || canViewBank,
    },
    {
      path: 'compensation',
      label: t('employees.tabs.compensation'),
      shown: canViewCompensation,
    },
    { path: 'history', label: t('employees.tabs.history'), shown: true },
  ];
  const isParentEntry =
    matchPath({ path: pagePath.pathname, end: true }, location.pathname) !==
    null;
  const currentTab = tabs.find(
    (tab) =>
      matchPath(
        { path: `${pagePath.pathname}/${tab.path}`, end: false },
        location.pathname,
      ) !== null,
  );
  const onTab =
    currentTab !== undefined &&
    matchPath(
      { path: `${pagePath.pathname}/${currentTab.path}`, end: true },
      location.pathname,
    ) !== null;

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
            reloadOwner();
        },
      );
    return () => controller.abort();
  }, [api, employeeId, reloadCount, reloadOwner]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;

  const [saved, setSaved] = useState<Employee>();
  const [gone, setGone] = useState(false);
  const notFound = gone || status === 404;
  const employee = saved ?? result?.employee;

  const onSaved = useCallback(
    (updated: Employee) => {
      setSaved(updated);
      reloadOwner();
    },
    [reloadOwner],
  );
  const onNotFound = useCallback(() => {
    setGone(true);
    reloadOwner();
  }, [reloadOwner]);
  const outletContext = useMemo<EmployeePageOutletContext | undefined>(
    () =>
      employee === undefined ? undefined : { employee, onSaved, onNotFound },
    [employee, onSaved, onNotFound],
  );

  const notFoundRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (gone && onTab) notFoundRef.current?.focus();
  }, [gone, onTab]);

  if (isParentEntry) {
    return (
      <Navigate
        replace
        to={{ pathname: tabs[0].path, search: location.search }}
      />
    );
  }

  let body: ReactElement;
  if (status === 401) {
    body = <SessionExpiredAlert />;
  } else if (notFound || status === 403) {
    body = (
      <Alert ref={notFoundRef} tabIndex={-1} variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {notFound
            ? t('employees.error.notFound')
            : t('employees.error.forbidden')}
        </AlertDescription>
      </Alert>
    );
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
  } else if (employee === undefined) {
    body = (
      <div
        role='status'
        aria-label={t('status.loading')}
        className='flex flex-col gap-3'
      >
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-48 w-full' />
      </div>
    );
  } else {
    body = (
      <nav
        aria-label={t('employees.page.tabsLabel')}
        className='flex flex-wrap gap-1 border-b pb-2'
      >
        {tabs
          .filter((tab) => tab.shown || tab.path === currentTab?.path)
          .map((tab) => (
            <NavLink
              className={cn(
                buttonVariants({ variant: 'ghost', size: 'sm' }),
                'text-muted-foreground aria-[current=page]:bg-muted aria-[current=page]:text-foreground',
              )}
              key={tab.path}
              to={{ pathname: tab.path, search: location.search }}
            >
              {tab.label}
            </NavLink>
          ))}
      </nav>
    );
  }

  const shown = notFound ? undefined : employee;
  return (
    <RouteChildPage>
      <PageContainer>
        <BackButton
          to={{
            pathname: '..',
            search: withoutParams(location.search, EMPLOYEE_PAGE_PARAMS),
          }}
        />
        <PageHeader
          title={
            shown ? (
              <span className='flex flex-wrap items-center gap-2'>
                {shown.name}
                <EmployeeStatusBadge status={shown.status} />
              </span>
            ) : (
              t('employees.page.title')
            )
          }
          description={shown?.code}
          actions={
            shown && currentTab ? (
              <EmployeeHeaderActions tab={currentTab.path} />
            ) : undefined
          }
        />
        {body}
        {outletContext ? (
          <div className={notFound ? 'hidden' : 'contents'}>
            <Outlet context={outletContext} />
          </div>
        ) : null}
      </PageContainer>
    </RouteChildPage>
  );
}

/**
 * The employee's actions at the top of the page (guideline T2.2). They open over the tab on screen (`tab`), where
 * every tab declares them, so closing returns to it.
 */
function EmployeeHeaderActions({
  tab,
}: {
  readonly tab: string;
}): ReactElement | null {
  const { t } = useTranslation();
  const location = useLocation();
  const canManage = useCan({ resource: ARCHIVE, action: 'manage' }).can;
  const canCorrect = useCan({ resource: ARCHIVE, action: 'correctStatus' }).can;
  if (!canManage && !canCorrect) return null;
  return (
    <div className='flex items-center gap-2'>
      {canManage ? (
        <Button
          nativeButton={false}
          render={
            <Link to={{ pathname: `${tab}/edit`, search: location.search }} />
          }
        >
          <PencilIcon data-icon='inline-start' />
          {t('employees.actions.edit')}
        </Button>
      ) : null}
      {canCorrect ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant='outline'
                size='icon'
                aria-label={t('employees.actions.moreActions')}
              />
            }
          >
            <MoreHorizontalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-auto min-w-40'>
            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <Link
                    to={{
                      pathname: `${tab}/correctStatus`,
                      search: location.search,
                    }}
                  />
                }
              >
                <ShieldAlertIcon />
                {t('employees.actions.correctStatus')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
