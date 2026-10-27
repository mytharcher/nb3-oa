import { Navigate, useLocation, useParams } from 'react-router';
import { useResource } from '../approvals/use-resource.js';
import { approvalBusiness } from '../approvals/business-metadata.js';
import { ErrorState } from '../approvals/states.js';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import { useTranslation } from '@nocobase/i18n/client';

export default function TaskTarget() {
  const { taskId } = useParams();
  const location = useLocation();
  const { t } = useTranslation();
  const resource = useResource<{ subject: string; recordId: string }>(
    `taskCenter/${encodeURIComponent(taskId ?? '')}/target`,
  );
  const business = resource.data
    ? approvalBusiness(resource.data.subject)
    : undefined;
  const destination =
    resource.data && business
      ? `/taskCenter/${business.detail}/${encodeURIComponent(resource.data.recordId)}`
      : undefined;
  return (
    <RecordDetailDrawer title={t('taskCenter.title')}>
      <>
        {destination ? (
          <Navigate
            replace
            to={{ pathname: destination, search: location.search }}
            state={{ routeOverlayHandoff: destination }}
          />
        ) : null}
        {resource.loading || destination ? (
          <FieldsSkeleton />
        ) : (
          <ErrorState
            error={resource.error}
            retry={resource.reload}
            context='query'
          />
        )}
      </>
    </RecordDetailDrawer>
  );
}
