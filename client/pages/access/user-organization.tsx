import { useCallback } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { Badge } from '#components/ui/badge';
import { useLoad } from './hooks.js';
import { Loading, ErrorState, Refresh, Blank } from './ui.js';
interface Organization {
  state: 'unassigned' | 'active' | 'inactive-chain' | 'invalid-chain';
  primaryDepartment: null | {
    id: string;
    title: string | null;
    path: { id: string; title: string; active: boolean }[];
  };
}
export default function UserOrganization({
  userId,
  compact = false,
}: {
  userId: string;
  compact?: boolean;
}) {
  const api = useApiClient();
  const { t } = useTranslation();
  const data = useLoad(
    useCallback(
      async () =>
        (
          await api.request<{ data: Organization }>({
            path: `org/users/${encodeURIComponent(userId)}/organization`,
          })
        ).data,
      [api, userId],
    ),
  );
  const heading = compact ? (
    <h2 className='text-base font-medium'>{t('access.organization')}</h2>
  ) : null;
  if (data.error)
    return (
      <>
        {heading}
        <ErrorState error={data.error} retry={data.reload} />
      </>
    );
  if (!data.data)
    return (
      <>
        {heading}
        <Loading />
      </>
    );
  const { state, primaryDepartment } = data.data;
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center justify-end gap-2'>
        <div className='mr-auto'>{heading}</div>
        <Refresh busy={data.busy} reload={data.reload} />
      </div>
      {state === 'unassigned' && compact ? (
        <p className='text-muted-foreground'>
          {t('access.noPrimaryDepartment')}
        </p>
      ) : state === 'unassigned' ? (
        <Blank
          title={t('access.noPrimaryDepartment')}
          description={t('access.organizationHelp')}
        />
      ) : (
        <>
          {state !== 'active' ? (
            <p role='status' className='text-destructive'>
              {t(`access.organizationState.${state}`)}
            </p>
          ) : null}
          <dl className='grid grid-cols-1 gap-2 sm:grid-cols-[8rem_1fr] sm:gap-4'>
            <dt className='text-muted-foreground'>
              {t('access.primaryDepartment')}
            </dt>
            <dd className='font-medium'>{primaryDepartment?.title || '—'}</dd>
            <dt className='text-muted-foreground'>
              {t('access.departmentPath')}
            </dt>
            <dd className='flex flex-wrap items-center gap-1'>
              {primaryDepartment?.path.length
                ? primaryDepartment.path.map((node, index) => (
                    <span key={node.id}>
                      {index ? ' / ' : ''}
                      {node.title}
                      {!node.active ? (
                        <Badge variant='outline'>
                          {t('access.roleInactive')}
                        </Badge>
                      ) : null}
                    </span>
                  ))
                : '—'}
            </dd>
          </dl>
        </>
      )}
    </div>
  );
}
