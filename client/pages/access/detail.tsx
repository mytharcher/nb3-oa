import { DrawerFormFooterContext } from '#components/drawer-form-context';
import { UserName } from '#components/user-name';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '#components/ui/dropdown-menu';
import { useCallback, useMemo, useState, useRef } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';
import {
  useApiClient,
  usePageBreadcrumb,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import type { ColumnDef } from '@tanstack/react-table';

import { RouteChildPage } from '#components/route-child-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { titleText } from '../administration/authorization/i18n.js';
import { ConfirmDialog } from '../administration/authorization/components/confirm-dialog.js';
import type { DutyRoleMember } from '../org/duty-roles/types.js';
import type { SubjectRow } from './types.js';
import { RoleMatrix } from './role-matrix.js';
import { useCatalog, useLoad, useRoleSnapshot } from './hooks.js';
import { Blank, ErrorState, Loading } from './ui.js';

export default function SubjectDetail() {
  const { type = '', id = '' } = useParams();
  const { t } = useTranslation();
  const api = useApiClient();
  const location = useLocation();
  const focusTargetRef = useRef<HTMLElement>(null);
  const parent = useOutletContext<{
    reload: () => void;
    subjects?: SubjectRow[];
    directoryError?: unknown;
  }>();
  const snapshot = useRoleSnapshot(type, id);

  const catalog = useCatalog(
    'permissionSets',
    type !== 'system' && !location.pathname.includes('/members'),
  );
  const isDuty = type === 'org.dutyRole';
  const canMembers = useCan({
    resource: { type: 'settings', id: 'oa.org.dutyRoles' },
    action: 'read',
  }).can;
  const canUpdateMembers = useCan({
    resource: { type: 'settings', id: 'oa.org.dutyRoles' },
    action: 'update',
  }).can;
  const canReadUsers = useCan({
    resource: { type: 'user', id: '*' },
    action: 'read',
  }).can;
  const canUpdate = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'update',
  }).can;
  const canAssign = useCan({
    resource: { type: 'settings', id: 'authorization.permission-sets' },
    action: 'assign',
  }).can;
  const tab = location.pathname.includes('/members')
    ? 'members'
    : 'permissions';
  const members = useLoad(
    useCallback(
      async () =>
        tab === 'members' && (isDuty ? canMembers : canReadUsers)
          ? (
              await api.request<{ data: DutyRoleMember[] }>({
                path: isDuty
                  ? `dutyRoles/${encodeURIComponent(id)}/members`
                  : `access/subjects/${encodeURIComponent(type)}/${encodeURIComponent(id)}/members`,
              })
            ).data
          : [],
      [api, id, type, isDuty, canMembers, canReadUsers, tab],
    ),
  );
  const base = `/access/roles/${encodeURIComponent(type)}/${encodeURIComponent(id)}`;
  const name = snapshot.data?.role
    ? titleText(snapshot.data.role.title, t)
    : (parent?.subjects?.find((row) => row.type === type && row.id === id)
        ?.title ?? t('access.title'));
  usePageBreadcrumb([
    { label: t('access.title'), to: `/access/roles${location.search}` },
    { label: name },
  ]);
  const reload = () => {
    snapshot.reload();
    members.reload();
    catalog.reload();
    parent?.reload();
  };
  const toaster = useToaster();
  const [removing, setRemoving] = useState<DutyRoleMember>();
  const [busy, setBusy] = useState(false);
  const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
  const [error, setError] = useState<unknown>();
  const columns = useMemo<ColumnDef<DutyRoleMember>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (row) => row.user.name,
        sortingFn: (a, b) =>
          a.original.user.name.localeCompare(b.original.user.name),
        header: t('access.name'),
        cell: ({ row }) => <UserName name={row.original.user.name} />,
      },
      {
        id: 'actions',
        header: t('access.actions'),
        cell: ({ row }) =>
          isDuty && canUpdateMembers ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    aria-label={t('access.actionsFor', {
                      name: row.original.user.name,
                    })}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent className='w-auto min-w-40' align='end'>
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setRemoving(row.original)}
                >
                  {t('access.remove')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null,
      },
    ],
    [t, isDuty, canUpdateMembers, setRemoving],
  );
  const add =
    isDuty && canUpdateMembers && canReadUsers ? (
      <Button
        nativeButton={false}
        render={<Link to={`${base}/members/add${location.search}`} />}
      >
        {t('access.addMember')}
      </Button>
    ) : null;
  return (
    <DrawerFormFooterContext.Provider value={footerTarget}>
      <RouteChildPage>
        <PageContainer>
          <PageHeader title={name} description={t('access.roleHelp')} />
          <div className='flex flex-col gap-6'>
            <nav ref={focusTargetRef} tabIndex={-1} className='flex gap-2'>
              <Button
                variant={tab === 'permissions' ? 'secondary' : 'ghost'}
                nativeButton={false}
                render={<Link to={`${base}/permissions${location.search}`} />}
              >
                {t('access.permissions')}
              </Button>
              {type !== 'authenticated' ? (
                <Button
                  variant={tab === 'members' ? 'secondary' : 'ghost'}
                  nativeButton={false}
                  render={<Link to={`${base}/members${location.search}`} />}
                >
                  {t('access.members')}
                </Button>
              ) : null}
            </nav>
            {error ? <ErrorState error={error} /> : null}
            {snapshot.error || catalog.error ? (
              <ErrorState
                error={snapshot.error ?? catalog.error}
                retry={reload}
                backTo={`/access/roles${location.search}`}
                onBack={parent?.reload}
              />
            ) : !snapshot.data || !catalog.options ? (
              <Loading />
            ) : tab === 'members' && !isDuty ? (
              <>
                <p>
                  {t(
                    type === 'system'
                      ? 'access.adminMembersHelp'
                      : 'access.organizationMembersHelp',
                  )}
                </p>
                <Button
                  variant='link'
                  nativeButton={false}
                  render={
                    <Link to={type === 'system' ? '/users' : '/departments'} />
                  }
                >
                  {t(
                    type === 'system'
                      ? 'access.openUsers'
                      : 'access.openOrganization',
                  )}
                </Button>
                {!canReadUsers ? (
                  <p>{t('access.memberDenied')}</p>
                ) : members.error ? (
                  <ErrorState error={members.error} retry={members.reload} />
                ) : members.busy ? (
                  <Loading />
                ) : (
                  <DataTable
                    columns={columns}
                    data={members.data ?? []}
                    showSelectedCount={false}
                    getRowId={(row) => row.userId}
                  />
                )}
              </>
            ) : tab === 'members' ? (
              !(isDuty ? canMembers : canReadUsers) ? (
                <p>{t('access.memberDenied')}</p>
              ) : members.error ? (
                <ErrorState error={members.error} retry={members.reload} />
              ) : members.busy && !members.data ? (
                <Loading />
              ) : members.data?.length ? (
                <>
                  <div className='flex justify-end'>{add}</div>
                  <p className='text-sm text-muted-foreground'>
                    {t('access.memberImpact')}
                  </p>
                  <DataTable
                    pageSizeOptions={[20, 50, 100]}
                    initialSorting={[{ id: 'name', desc: false }]}
                    columns={columns}
                    data={members.data}
                    showSelectedCount={false}
                    getRowId={(row) => row.userId}
                  />
                </>
              ) : (
                <Blank
                  title={t('access.missingMembers')}
                  description={t('access.memberImpact')}
                  action={add}
                />
              )
            ) : type === 'system' ? (
              <Badge>{t('access.unrestricted')}</Badge>
            ) : (
              <RoleMatrix
                key={`${type}:${id}:${snapshot.data.revision}`}
                snapshot={snapshot.data}
                options={catalog.options}
                name={name}
                memberCount={snapshot.data.role?.memberCount}
                canEdit={canUpdate && canAssign}
                reload={snapshot.reload}
                saved={(data) => {
                  snapshot.replace({ ...snapshot.data, ...data });
                  parent?.reload();
                }}
              />
            )}
            <ConfirmDialog
              open={Boolean(removing)}
              title={t('access.removeTitle', {
                name: removing?.user.name ?? '',
              })}
              confirmLabel={t('access.remove')}
              cancelLabel={t('access.cancel')}
              busy={busy}
              error={error ? <ErrorState error={error} /> : undefined}
              onCancel={() => setRemoving(undefined)}
              onConfirm={() => {
                if (!removing) return;
                setBusy(true);
                setError(undefined);
                void api
                  .request({
                    path: `dutyRoles/${encodeURIComponent(id)}/members/${encodeURIComponent(removing.userId)}`,
                    method: 'DELETE',
                  })
                  .then(async () => {
                    const result = await api.request<{
                      data: DutyRoleMember[];
                    }>({
                      path: `dutyRoles/${encodeURIComponent(id)}/members`,
                    });
                    members.replace(result.data);
                    snapshot.reload();
                    parent?.reload();
                    setRemoving(undefined);
                    requestAnimationFrame(() =>
                      focusTargetRef.current?.focus(),
                    );
                    toaster.show({
                      title: t('access.removed', { name: removing.user.name }),
                      type: 'success',
                    });
                  })
                  .catch((cause: unknown) => setError(cause))
                  .finally(() => setBusy(false));
              }}
            >
              {t('access.memberImpact')}
            </ConfirmDialog>
            <Outlet
              context={{
                reload,
                membersSaved: (data: DutyRoleMember[]) => {
                  members.replace(data);
                  snapshot.reload();
                  parent?.reload();
                },
                assignmentsSaved: () => {
                  snapshot.reload();
                  parent?.reload();
                },
                definitionSaved: () => {
                  snapshot.reload();
                  parent?.reload();
                },
                memberIds: members.data?.map((entry) => entry.userId) ?? [],
                name,
              }}
            />
          </div>
          <div
            className='sticky bottom-0 flex flex-wrap justify-end gap-2 border-t bg-background py-3'
            ref={setFooterTarget}
          />
        </PageContainer>
      </RouteChildPage>
    </DrawerFormFooterContext.Provider>
  );
}
