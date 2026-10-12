import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useResource } from '../approvals/use-resource.js';
import type { BankResult, QualificationRecord } from './types.js';
export function usePrivateAccount(record?: QualificationRecord) {
  const { session } = useAuthentication();
  const viewer = session?.user.id ?? '';
  const read = useCan({
      resource: { type: 'composite', id: 'oa.vendorQualification' },
      action: 'paymentAccount',
    }),
    view = useCan({
      resource: { type: 'composite', id: 'oa.vendorQualification' },
      action: 'view',
    }),
    write = useCan({
      resource: { type: 'composite', id: 'oa.vendorQualification' },
      action: 'updatePaymentAccount',
    });
  const allowed =
    !!viewer &&
    read.can &&
    view.can &&
    !read.isPending &&
    !view.isPending &&
    !read.error &&
    !view.error;
  const resource = useResource<BankResult>(
    allowed && record
      ? `vendorQualifications/${record.id}/paymentAccount`
      : null,
    { viewer },
  );
  return {
    ...resource,
    allowed,
    canWrite:
      allowed &&
      write.can &&
      !write.isPending &&
      !write.error &&
      !!record &&
      record.applicantId === viewer &&
      ['draft', 'revision'].includes(record.status),
  };
}
