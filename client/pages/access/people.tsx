import { ApplicationSearch } from '#components/application-search';
import { ApplicationToolbar } from '#components/application-toolbar';
import { UserName } from '#components/user-name';
import { useCallback, useMemo } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTableServer } from '#components/data-table';
import { TruncatedText } from '#components/truncated-text';
import { Button } from '#components/ui/button';
import { useUrlSearch } from '#hooks/use-url-search';
import { useLoad } from './hooks.js';
import { AccessTabs, Blank, ErrorState, Loading, Refresh } from './ui.js';
type Person = { id: string; name: string; email: string };
export default function PeoplePage() {
  const { t } = useTranslation();
  const api = useApiClient();
  const location = useLocation();
  const search = useUrlSearch({ resetParams: ['page'] });
  const canRead = useCan({
    resource: { type: 'user', id: '*' },
    action: 'read',
  }).can;
  const page = Math.max(1, Number(search.searchParams.get('page')) || 1);
  const pageSize = [20, 50, 100].includes(
    Number(search.searchParams.get('pageSize')),
  )
    ? Number(search.searchParams.get('pageSize'))
    : 20;
  const state = useLoad(
    useCallback(
      async () =>
        canRead
          ? api.request<{ data: Person[]; meta: { total: number } }>({
              path: 'users',
              query: { q: search.search, page, pageSize },
            })
          : { data: [], meta: { total: 0 } },
      [api, search.search, page, pageSize, canRead],
    ),
    true,
  );
  const columns = useMemo<ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('access.name'),
        cell: ({ row }) => (
          <Link
            className='font-medium underline-offset-4 hover:underline'
            to={`${encodeURIComponent(row.original.id)}/sources${location.search}`}
          >
            <UserName name={row.original.name} />
          </Link>
        ),
      },
      {
        accessorKey: 'email',
        header: t('access.email'),
        cell: ({ row }) => <TruncatedText text={row.original.email} />,
      },
    ],
    [t, location.search],
  );
  return (
    <PageContainer>
      <PageHeader
        title={t('access.title')}
        description={t('access.peopleHelp')}
        actions={
          !canRead ? (
            <Refresh reload={state.reload} busy={state.busy} />
          ) : undefined
        }
      />
      <AccessTabs />
      {!canRead ? (
        <p>{t('access.userDenied')}</p>
      ) : (
        <>
          <ApplicationToolbar
            actions={<Refresh reload={state.reload} busy={state.busy} />}
          >
            <ApplicationSearch
              className='sm:max-w-xs'
              placeholder={t('access.searchPeople')}
              {...search.inputProps}
            />
            {search.text ? (
              <Button variant='ghost' onClick={() => search.clear()}>
                {t('access.clear')}
              </Button>
            ) : null}
          </ApplicationToolbar>
          {state.error ? (
            <ErrorState error={state.error} retry={state.reload} />
          ) : !state.data ? (
            <Loading />
          ) : (
            <DataTableServer
              columns={columns}
              rows={state.data.data}
              total={state.data.meta.total}
              getRowId={(row) => row.id}
              pagination={{ pageIndex: page - 1, pageSize }}
              onPaginationChange={(value) =>
                search.updateParams((params) => {
                  params.set('page', String(value.pageIndex + 1));
                  params.set('pageSize', String(value.pageSize));
                })
              }
              pageSizeOptions={[20, 50, 100]}
              emptyMessage={
                <Blank
                  title={t(
                    search.text ? 'access.noResults' : 'access.emptyPeople',
                  )}
                  description={t(
                    search.text ? 'access.clearHelp' : 'access.emptyHelp',
                  )}
                  action={
                    search.text ? (
                      <Button onClick={() => search.clear()}>
                        {t('access.clear')}
                      </Button>
                    ) : undefined
                  }
                />
              }
            />
          )}
        </>
      )}
      <Outlet context={{ reload: state.reload }} />
    </PageContainer>
  );
}
