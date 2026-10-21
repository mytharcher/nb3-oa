import { UserName } from '#components/user-name';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';
import { Pencil, RefreshCw } from 'lucide-react';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import { Button } from '#components/ui/button';
import { StatusBadge } from '#components/status-badge';
import { useFinanceResource } from './resource.js';
import { FinanceError, FinanceSkeleton } from './states.js';
import { SETTINGS, type Assignment, type Context } from './types.js';
export default function Detail() {
  const { assignmentId = '' } = useParams(),
    { t, i18n } = useTranslation(),
    parent = useOutletContext<Context>(),
    location = useLocation();
  const r = useFinanceResource<{ data: Assignment }>(
      `financeAssignments/${encodeURIComponent(assignmentId)}`,
    ),
    p = useCan({
      resource: { type: 'settings', id: SETTINGS },
      action: 'update',
    }),
    row = r.data?.data;
  return (
    <RecordDetailDrawer
      title={row?.department.title ?? t('financeAssignments.view')}
      description={t('financeAssignments.description')}
      footer={
        <>
          {p.can && !p.isPending && !p.error ? (
            <Button
              nativeButton={false}
              disabled={r.loading || !row}
              render={
                <Link to={{ pathname: 'edit', search: location.search }} />
              }
            >
              <Pencil data-icon='inline-start' />
              {t('financeAssignments.edit')}
            </Button>
          ) : null}
          <Button variant='outline' disabled={r.loading} onClick={r.reload}>
            <RefreshCw data-icon='inline-start' />
            {t('financeAssignments.refresh')}
          </Button>
        </>
      }
    >
      {r.error ? <FinanceError error={r.error} retry={r.reload} /> : null}
      {!row ? (
        r.loading ? (
          <FinanceSkeleton />
        ) : null
      ) : (
        <dl className='grid grid-cols-1 gap-4 sm:grid-cols-[8rem_1fr] [&>div]:contents'>
          <div>
            <dt className='text-sm text-muted-foreground'>
              {t('financeAssignments.department')}
            </dt>
            <dd className='break-words'>{row.department.title}</dd>
          </div>
          <div>
            <dt className='text-sm text-muted-foreground'>
              {t('financeAssignments.accountant')}
            </dt>
            <dd className='break-words'>
              <UserName name={row.accountant.name} />
            </dd>
          </div>
          <div>
            <dt className='text-sm text-muted-foreground'>
              {t('financeAssignments.status')}
            </dt>
            <dd>
              <StatusBadge tone={row.active ? 'success' : 'neutral'}>
                {t(`financeAssignments.${row.active ? 'active' : 'inactive'}`)}
              </StatusBadge>
            </dd>
          </div>
          <div>
            <dt className='text-sm text-muted-foreground'>
              {t('financeAssignments.updatedAt')}
            </dt>
            <dd>{new Date(row.updatedAt).toLocaleString(i18n.language)}</dd>
          </div>
        </dl>
      )}
      <Outlet
        context={{
          onSaved: () => {
            r.reload();
            parent?.onSaved();
          },
        }}
      />
    </RecordDetailDrawer>
  );
}
