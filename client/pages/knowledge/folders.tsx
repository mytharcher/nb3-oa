import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { Link, Outlet, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { RouteChildPage } from '#components/route-child-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { BackButton } from '#components/back-button';
import { ApplicationToolbar } from '#components/application-toolbar';
import { Button } from '#components/ui/button';
import { DataTable } from '#components/data-table';
import { useKnowledgeResource } from './resource.js';
import { KnowledgeError, KnowledgeSkeleton } from './states.js';
import { policy, type Folder } from './types.js';
export default function KnowledgeFolders() {
  const { t } = useTranslation(),
    location = useLocation(),
    r = useKnowledgeResource<{ data: Folder[] }>('knowledge/folders'),
    manage = useCan(policy('manage', true));
  return (
    <>
      <RouteChildPage>
        <PageContainer>
          <BackButton />
          <PageHeader title={t('knowledge.folders')} />
          <ApplicationToolbar
            actions={
              <>
                <ApplicationRefreshButton
                  label={t('knowledge.refresh')}
                  loading={r.loading}
                  onClick={r.reload}
                />
                {manage.can && !manage.isPending && !manage.error ? (
                  <Button
                    nativeButton={false}
                    render={
                      <Link to={{ pathname: 'new', search: location.search }} />
                    }
                  >
                    {t('knowledge.newFolder')}
                  </Button>
                ) : null}
              </>
            }
          />
          {r.error ? (
            <KnowledgeError error={r.error} retry={r.reload} />
          ) : r.loading && !r.data ? (
            <KnowledgeSkeleton />
          ) : r.data ? (
            <DataTable
              data={r.data.data}
              columns={[
                {
                  accessorKey: 'title',
                  header: t('knowledge.titleField'),
                  cell: ({ row }) =>
                    manage.can && !manage.isPending && !manage.error ? (
                      <Link
                        className='font-medium hover:underline'
                        to={{
                          pathname: `${row.original.id}/edit`,
                          search: location.search,
                          hash: location.hash,
                        }}
                      >
                        {row.original.title}
                      </Link>
                    ) : (
                      row.original.title
                    ),
                },
                {
                  id: 'parent',
                  header: t('knowledge.parent'),
                  cell: ({ row }: { row: { original: Folder } }) =>
                    row.original.parentId
                      ? (r.data?.data.find(
                          (x) => x.id === row.original.parentId,
                        )?.title ?? t('knowledge.restrictedOption'))
                      : t('knowledge.root'),
                },
              ]}
              emptyMessage={
                <ApplicationTableEmpty title={t('knowledge.noFolders')} />
              }
            />
          ) : null}
        </PageContainer>
      </RouteChildPage>
      <Outlet context={{ reload: r.invalidate }} />
    </>
  );
}
