import { useState } from 'react';
import { Link, useParams, Outlet, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteChildPage } from '#components/route-child-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { usePageBreadcrumb } from '@nocobase/app-client';
import { ChoicePicker } from './choice-picker.js';
import { Button } from '#components/ui/button';
import {
  useCatalog,
  useSnapshot,
  useDirectory,
  AccessDataProvider,
} from './hooks.js';
import { resources, subjectSets, roleRows, rowValue } from './model.js';
import { AccessTabs, ErrorState, Loading, Blank } from './ui.js';
import type { SubjectRow } from './types.js';
import { AccessModulePermissions } from './module-permissions.js';
import { resourceKey } from '../administration/authorization/pages/permission-sets/drafts.js';

export default function ModulesPage() {
  return (
    <AccessDataProvider>
      <ModulesContent />
    </AccessDataProvider>
  );
}
function ModulesContent() {
  const { t } = useTranslation();
  const snapshot = useSnapshot();
  const catalog = useCatalog();
  return (
    <PageContainer>
      <PageHeader title={t('access.modules')} />
      <AccessTabs />
      {snapshot.error || catalog.error ? (
        <ErrorState
          error={snapshot.error ?? catalog.error}
          retry={() => {
            snapshot.reload();
            catalog.reload();
          }}
        />
      ) : !snapshot.data || !catalog.options ? (
        <Loading />
      ) : (
        <AccessModulePermissions
          options={catalog.options}
          enabled={
            new Set(
              snapshot.data.sets.flatMap((set) =>
                set.grants.map((grant) =>
                  resourceKey(grant.resource.type, grant.resource.id),
                ),
              ),
            )
          }
        >
          {(keys) => (
            <DataTable
              pagination={false}
              showSelectedCount={false}
              columns={[
                {
                  id: 'name',
                  header: t('access.businessModules'),
                  cell: ({ row }) => (
                    <Link
                      to={encodeURIComponent(
                        `${row.original.type}:${row.original.value}`,
                      )}
                    >
                      {row.original.label}
                    </Link>
                  ),
                },
              ]}
              data={resources(catalog.options!).filter((resource) =>
                keys.has(resourceKey(resource.type, resource.value)),
              )}
              getRowId={(row) => `${row.type}:${row.value}`}
            />
          )}
        </AccessModulePermissions>
      )}
      <Outlet />
    </PageContainer>
  );
}

export function ModuleDetail() {
  const { resource = '' } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const snapshot = useSnapshot();
  const catalog = useCatalog();
  const directory = useDirectory(catalog.options);
  const [extra, setExtra] = useState<string[]>([]);
  const item =
    catalog.options &&
    resources(catalog.options).find(
      (entry) => `${entry.type}:${entry.value}` === resource,
    );
  usePageBreadcrumb([
    { label: t('access.modules'), to: `/access/modules${location.search}` },
    { label: item?.label ?? t('access.loading') },
  ]);
  if (directory.error || snapshot.error || catalog.error)
    return (
      <RouteChildPage>
        <ErrorState
          error={directory.error ?? snapshot.error ?? catalog.error}
          retry={() => {
            directory.reload();
            snapshot.reload();
            catalog.reload();
          }}
          backTo='/access/modules'
        />
      </RouteChildPage>
    );
  if (!snapshot.data || !catalog.options || !directory.data)
    return (
      <RouteChildPage>
        <Loading />
      </RouteChildPage>
    );
  if (!item)
    return (
      <RouteChildPage>
        <Blank
          title={t('access.missing')}
          description={t('access.emptyHelp')}
          action={
            <Button
              variant='outline'
              nativeButton={false}
              render={<Link to='/access/modules' />}
            >
              {t('access.back')}
            </Button>
          }
        />
      </RouteChildPage>
    );
  const roles: SubjectRow[] = [
    ...directory.data,
    ...snapshot.data.sets
      .filter((set) => set.unrestricted)
      .map((set) => ({
        type: 'system',
        id: set.key,
        title: t('access.systemAdmin'),
      })),
  ];
  const matrix = roles.map((role) => ({
    role,
    rows: roleRows(catalog.options!, subjectSets(snapshot.data!, role)).filter(
      (row) =>
        row.resource.type === item.type && row.resource.value === item.value,
    ),
  }));
  const key = (role: SubjectRow) => `${role.type}:${role.id}`;
  const visible = matrix.filter(
    ({ role, rows }) =>
      role.type === 'system' ||
      rows.some((row) => row.enabled) ||
      extra.includes(key(role)),
  );
  return (
    <RouteChildPage>
      <PageContainer>
        <PageHeader title={item.label} />
        <ChoicePicker
          label={t('access.addRoles')}
          choices={matrix
            .filter(
              ({ role, rows }) =>
                role.type !== 'system' && !rows.some((row) => row.enabled),
            )
            .map(({ role }) => ({ value: key(role), label: role.title }))}
          value={extra}
          onChange={setExtra}
        />
        <DataTable
          pagination={false}
          showSelectedCount={false}
          columns={[
            {
              id: 'action',
              header: t('access.permissions'),
              accessorFn: (row) => row.label,
            },
            ...visible.map(({ role, rows }) => ({
              id: key(role),
              header: role.title,
              cell: ({ row }: { row: { original: (typeof rows)[number] } }) => (
                <Link
                  to={`/access/roles/${encodeURIComponent(role.type)}/${encodeURIComponent(role.id)}/permissions?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(location.search)), fromModule: resource, focus: row.original.id })}`}
                >
                  {role.type === 'system'
                    ? t('access.unrestricted')
                    : rowValue(
                        rows.find((entry) => entry.id === row.original.id)!,
                        t('access.deniedAction'),
                        t('access.configuredGrant'),
                        t('access.special'),
                      )}
                </Link>
              ),
            })),
          ]}
          data={roleRows(catalog.options, []).filter(
            (row) =>
              row.resource.type === item.type &&
              row.resource.value === item.value,
          )}
          getRowId={(row) => row.id}
        />
      </PageContainer>
    </RouteChildPage>
  );
}
