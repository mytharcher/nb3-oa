import {
  useCallback,
  useRef,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useParams, useOutletContext, useSearchParams } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import {
  DrawerCloseGuardsContext,
  DrawerFormFooterContext,
} from '#components/drawer-form-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '#components/ui/tabs';
import { Badge } from '#components/ui/badge';
import { UsersClient } from '../administration/users/user-client.js';
import { useLoad } from './hooks.js';
import { ErrorState, Loading } from './ui.js';
import UserPermissions from './user-permissions.js';
import UserDutyRoles from './user-duty-roles.js';
import UserOrganization from './user-organization.js';
import UnifiedUserPermissions from './user-permissions-unified.js';
import { userListParams } from './user-url.js';
const tabs = {
  information: 'information',
  permissions: 'userPermissions',
} as const;
export default function UserDetail() {
  const { userId = '' } = useParams();
  return <Detail key={userId} userId={userId} />;
}
function Detail({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const api = useApiClient();
  const client = useMemo(() => new UsersClient(api), [api]);
  const parent = useOutletContext<{
    users?: readonly { id: string; name: string }[];
    reload?: () => void;
  }>();
  const user = useLoad(useCallback(() => client.get(userId), [client, userId]));
  const current = user.data;
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') ?? 'information';
  const tab =
    requested === 'exceptions'
      ? 'permissions'
      : Object.hasOwn(tabs, requested)
        ? requested
        : 'information';
  const inspect = useCan({
    resource: { type: 'settings', id: 'authorization.inspector' },
    action: 'inspect',
  });
  const userRead = useCan({
    resource: { type: 'user', id: '*' },
    action: 'read',
  });
  const departmentsRead = useCan({
    resource: { type: 'settings', id: 'oa.org.departments' },
    action: 'read',
  });
  const rolesRead = useCan({
    resource: { type: 'settings', id: 'oa.org.dutyRoles' },
    action: 'read',
  });
  const rolesUpdate = useCan({
    resource: { type: 'settings', id: 'oa.org.dutyRoles' },
    action: 'update',
  });
  const exceptionsRead = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'read',
  });
  const exceptionsUpdate = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'update',
  });
  const exceptionsAssign = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'assign',
  });
  const canEditRoles = rolesRead.can && rolesUpdate.can;
  const canReadExceptions = exceptionsRead.can && userRead.can;
  const canEditExceptions =
    canReadExceptions && exceptionsUpdate.can && exceptionsAssign.can;
  const pending = [
    userRead,
    rolesRead,
    rolesUpdate,
    exceptionsRead,
    exceptionsUpdate,
    exceptionsAssign,
  ].some((value) => value.isPending);
  const edit = params.get('edit');
  const editing = tab === 'information' && edit === 'roles' && canEditRoles;
  const editDenied =
    !pending &&
    ((tab === 'information' && edit === 'roles' && !canEditRoles) ||
      (tab === 'permissions' && edit === 'exceptions' && !canEditExceptions));
  useEffect(() => {
    if (pending) return;
    const next = new URLSearchParams(params);
    if (requested !== tab) {
      if (requested === 'roles' || requested === 'organization')
        next.set('tab', 'information');
      else if (requested === 'exceptions') next.set('tab', 'permissions');
      else next.delete('tab');
    }
    if (!['permissions', 'exceptions'].includes(tab))
      next.delete('accessModule');
    next.delete('permissionResource');
    if (edit && !editing) {
      next.delete('edit');
      next.delete('permissionResource');
    }
    if (next.toString() !== params.toString())
      setParams(next, { replace: true });
  }, [params, setParams, pending, requested, tab, edit, editing]);
  const tabStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = tabStripRef.current;
    if (!strip) return;
    const reveal = () =>
      strip
        .querySelector<HTMLElement>('[data-active]')
        ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [tab, current]);
  const [footer, setFooter] = useState<HTMLDivElement | null>(null);
  const closeParams = userListParams(params);
  const closeTo = `/users${closeParams.size ? `?${closeParams}` : ''}`;
  const name =
    current?.name ??
    parent?.users?.find((entry) => entry.id === userId)?.name ??
    t('access.loading');
  const changeEdit = (value?: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set('edit', value);
        else next.delete('edit');
        next.delete('permissionResource');
        return next;
      },
      { replace: true },
    );
  const saved = () => {
    changeEdit();
    parent?.reload?.();
    user.reload();
  };
  const denied = (
    <p className='py-4 text-muted-foreground'>
      {t('access.configurationDenied')}
    </p>
  );
  return (
    <DrawerFormFooterContext.Provider value={footer}>
      <RecordDetailDrawer
        className='sm:max-w-4xl'
        title={name}
        closeTo={closeTo}
        finalFocus={() =>
          document.querySelector<HTMLElement>(
            `[data-user-detail="${CSS.escape(userId)}"]`,
          ) ??
          document.getElementById('user-directory-search') ??
          true
        }
        footer={
          <div ref={setFooter} className='flex w-full justify-end gap-2' />
        }
      >
        {user.error ? (
          <ErrorState
            error={user.error}
            retry={user.reload}
            backTo={closeTo}
            onBack={parent?.reload}
          />
        ) : !current ? (
          <Loading />
        ) : (
          <>
            <GuardedUserTabs
              value={tab}
              onChange={(value) => {
                setParams(
                  (previous) => {
                    const next = new URLSearchParams(previous);
                    next.set('tab', value);
                    next.delete('accessModule');
                    next.delete('edit');
                    next.delete('permissionResource');
                    return next;
                  },
                  { replace: true },
                );
              }}
            >
              <div
                ref={tabStripRef}
                className='max-w-full overflow-x-auto pb-2'
              >
                <TabsList
                  variant='line'
                  className='justify-start p-0'
                  aria-label={t('access.userDetails')}
                >
                  {Object.entries(tabs)
                    .filter(
                      ([key]) =>
                        key !== 'permissions' ||
                        inspect.can ||
                        canReadExceptions ||
                        tab === key,
                    )
                    .map(([key, label]) => (
                      <TabsTrigger
                        key={key}
                        value={key}
                        className='flex-none px-0 mr-5 last:mr-0'
                        onFocus={(event) =>
                          event.currentTarget.scrollIntoView?.({
                            block: 'nearest',
                            inline: 'nearest',
                          })
                        }
                      >
                        {t(`access.${label}`)}
                      </TabsTrigger>
                    ))}
                </TabsList>
              </div>
              {editDenied ? (
                <p role='status' className='text-muted-foreground'>
                  {t('access.editDenied')}
                </p>
              ) : null}
              <TabsContent value='information' className='flex flex-col gap-4'>
                <dl className='grid grid-cols-1 gap-2 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4'>
                  <dt className='text-muted-foreground'>{t('access.name')}</dt>
                  <dd className='break-words font-semibold'>
                    {current.name || '—'}
                  </dd>
                  <dt className='text-muted-foreground'>
                    {t('access.username')}
                  </dt>
                  <dd className='break-all'>{current.username || '—'}</dd>
                  <dt className='text-muted-foreground'>{t('access.email')}</dt>
                  <dd className='break-all'>{current.email || '—'}</dd>
                  <dt className='text-muted-foreground'>
                    {t('access.accountStatus')}
                  </dt>
                  <dd>
                    <Badge
                      variant={current.disabledAt ? 'secondary' : 'default'}
                    >
                      {t(
                        current.disabledAt
                          ? 'access.disabled'
                          : 'access.enabled',
                      )}
                    </Badge>
                  </dd>
                </dl>
                {current.disabledAt ? (
                  <p className='text-muted-foreground'>
                    {t('access.frozenConfiguration')}
                  </p>
                ) : null}
                {tab === 'information' ? (
                  <>
                    <section
                      className='flex flex-col gap-3 border-t pt-4'
                      aria-label={t('access.organization')}
                    >
                      {!(departmentsRead.can && userRead.can) ? (
                        <h2 className='text-base font-medium'>
                          {t('access.organization')}
                        </h2>
                      ) : null}
                      {departmentsRead.isPending || userRead.isPending ? (
                        <Loading />
                      ) : departmentsRead.can && userRead.can ? (
                        <UserOrganization compact userId={userId} />
                      ) : (
                        denied
                      )}
                    </section>
                    <section
                      className='flex flex-col gap-3 border-t pt-4'
                      aria-label={t('access.dutyRoles')}
                    >
                      {!(rolesRead.can && userRead.can) ? (
                        <h2 className='text-base font-medium'>
                          {t('access.dutyRoles')}
                        </h2>
                      ) : null}
                      {pending ? (
                        <Loading />
                      ) : rolesRead.can && userRead.can ? (
                        <UserDutyRoles
                          compact
                          key={editing ? 'edit' : 'read'}
                          userId={userId}
                          name={name}
                          editing={editing}
                          canEdit={canEditRoles}
                          cancel={() => changeEdit()}
                          saved={saved}
                          edit={() => changeEdit('roles')}
                          accountChanged={(disabledAt) =>
                            user.replace({ ...current, disabledAt })
                          }
                        />
                      ) : (
                        denied
                      )}
                    </section>
                  </>
                ) : null}
              </TabsContent>
              <TabsContent value='permissions'>
                {current.disabledAt ? (
                  <p className='mb-4 text-muted-foreground'>
                    {t('access.frozenConfiguration')}
                  </p>
                ) : null}
                {tab === 'permissions' ? (
                  pending || inspect.isPending ? (
                    <Loading />
                  ) : canReadExceptions ||
                    (inspect.can && exceptionsRead.can) ? (
                    <UnifiedUserPermissions
                      userId={userId}
                      name={name}
                      canInspect={inspect.can}
                      canReadPersonal={canReadExceptions}
                      canEdit={canEditExceptions}
                    />
                  ) : inspect.can ? (
                    <UserPermissions embedded name={name} />
                  ) : (
                    denied
                  )
                ) : null}
              </TabsContent>
            </GuardedUserTabs>
          </>
        )}
      </RecordDetailDrawer>
    </DrawerFormFooterContext.Provider>
  );
}
function GuardedUserTabs({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  const guards = useContext(DrawerCloseGuardsContext);
  return (
    <Tabs
      className='min-w-0'
      value={value}
      onValueChange={(next) => {
        void (async () => {
          for (const guard of guards ?? []) if (!(await guard())) return;
          onChange(String(next));
        })();
      }}
    >
      {children}
    </Tabs>
  );
}
