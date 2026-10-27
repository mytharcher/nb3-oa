import { useMemo } from 'react';
import { Link, Outlet } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTable } from '#components/data-table';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { useResource } from '../approvals/use-resource.js';
import { ApprovalAiError } from '#components/approval-ai/error';
import type { DefinitionView } from '../../../shared/approval-ai.js';
export default function ApprovalAiSettings() {
  const { t, i18n } = useTranslation();
  const resource = useResource<DefinitionView[]>('approvalAi/definitions', {
    locale: i18n.language,
  });
  const columns = useMemo<ColumnDef<DefinitionView>[]>(
    () => [
      {
        id: 'title',
        header: t('approvalAi.definition'),
        cell: ({ row }) => (
          <Link
            className='font-medium underline-offset-4 hover:underline'
            to={encodeURIComponent(row.original.id) + '/edit'}
          >
            {row.original.title}
          </Link>
        ),
      },
      {
        id: 'enabled',
        header: t('approvalAi.enabled'),
        cell: ({ row }) => (
          <Badge variant='outline'>
            {t('approvalAi.' + (row.original.settings.enabled ? 'on' : 'off'))}
          </Badge>
        ),
      },
      {
        id: 'model',
        header: t('approvalAi.model'),
        cell: ({ row }) => (
          <span className='wrap-anywhere'>
            {row.original.settings.model
              ? row.original.settings.modelService +
                ' / ' +
                row.original.settings.model
              : t('approvalAi.noModel')}
          </span>
        ),
      },
    ],
    [t],
  );
  return (
    <PageContainer>
      <PageHeader
        title={t('approvalAi.configure')}
        description={t('approvalAi.settingsDescription')}
        actions={
          <Button
            variant='outline'
            disabled={resource.loading}
            onClick={resource.reload}
          >
            {t('approvalAi.refresh')}
          </Button>
        }
      />
      {!!resource.error && (
        <ApprovalAiError error={resource.error} retry={resource.reload} />
      )}
      {resource.loading && !resource.data ? (
        <Skeleton
          role='status'
          aria-label={t('approvalAi.loading')}
          className='h-40'
        />
      ) : (
        resource.data && (
          <DataTable
            columns={columns}
            data={resource.data}
            getRowId={(row) => row.id}
            pagination={false}
            emptyMessage={t('approvalAi.noDefinitions')}
          />
        )
      )}
      <Outlet context={{ reload: resource.reload }} />
    </PageContainer>
  );
}
