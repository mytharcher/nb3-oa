import { useEffect, useMemo, useState } from 'react';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useAuthorizationClient,
  useAuthorizationRevision,
} from '@nocobase/app-plugin-authorization/client';
import { useResource } from '../approvals/use-resource.js';
import type { CenterRecord } from '../approvals/use-center-resource.js';
export const workspaceNames = [
  'manager',
  'hr',
  'finance',
  'administration',
  'procurement',
] as const;
export type Workspace = (typeof workspaceNames)[number];
export type RoleContext = Record<Workspace, boolean> & {
  teamUserIds: string[];
};
export function useRoleContext() {
  return useResource<RoleContext>('workbench/roleContext');
}
export type ContextResource = ReturnType<typeof useRoleContext>;
const kinds: Record<Exclude<Workspace, 'manager'>, CenterRecord['kind'][]> = {
  hr: [
    'oa.recruitment',
    'oa.transfer',
    'oa.certificateRequest',
    'oa.departure',
    'oa.probation',
    'oa.leave',
    'oa.leaveCancellation',
    'oa.attendanceChange',
    'oa.overtime',
    'oa.training',
  ],
  finance: [
    'oa.reimbursement',
    'oa.loan',
    'oa.payment',
    'oa.budgetAdjustment',
    'oa.expensePlan',
    'oa.travel',
    'oa.departure',
  ],
  administration: [
    'oa.sealRequest',
    'oa.vehicleRequest',
    'oa.supplies',
    'oa.assetRequest',
    'oa.departure',
  ],
  procurement: ['oa.purchase', 'oa.vendorQualification', 'oa.contract'],
};
export type Destination = {
  to: string;
  label: string;
  resource: string;
  action: string;
  type?: 'settings' | 'page';
};
const destinations: Record<Workspace, Destination[]> = {
  manager: [
    {
      to: '/headcounts',
      label: 'headcounts.title',
      resource: 'oa.headcounts',
      action: 'view',
    },
  ],
  hr: [
    {
      to: '/employees',
      label: 'employees.title',
      resource: 'oa.employees',
      action: 'read',
      type: 'settings',
    },
    {
      to: '/requisitions',
      label: 'recruitment.requisitions',
      resource: 'oa.requisitions',
      action: 'view',
    },
  ],
  finance: [
    {
      to: '/loanRequests',
      label: 'loanRequests.title',
      resource: 'oa-loan-requests',
      action: 'access',
      type: 'page',
    },
    {
      to: '/paymentRequests',
      label: 'paymentRequests.title',
      resource: 'oa-payment-requests',
      action: 'access',
      type: 'page',
    },
  ],
  administration: [
    {
      to: '/supplyLedger',
      label: 'workbench.workspaceLinks.supplies',
      resource: 'oa.supplies',
      action: 'ledger',
    },
    {
      to: '/seal-ledger',
      label: 'workbench.workspaceLinks.seals',
      resource: 'oa.sealLedger',
      action: 'view',
    },
    {
      to: '/vehicle-garage',
      label: 'workbench.workspaceLinks.vehicles',
      resource: 'oa.vehicleGarage',
      action: 'view',
    },
  ],
  procurement: [
    {
      to: '/purchaseOrders',
      label: 'workbench.workspaceLinks.orders',
      resource: 'oa.purchase',
      action: 'orders',
    },
    {
      to: '/vendors',
      label: 'vendors.title',
      resource: 'oa.vendors',
      action: 'view',
    },
    {
      to: '/contracts',
      label: 'workbench.workspaceLinks.contracts',
      resource: 'oa-contract-ledger',
      action: 'access',
      type: 'page',
    },
  ],
};

export function rolesOf(context: ContextResource): Workspace[] {
  return context.error
    ? []
    : workspaceNames.filter((role) => context.data?.[role]);
}

/** This is a filter of the authorized, bounded personal preview, never a new data scope. */
export function workspaceRows(
  workspace: Workspace,
  pending: CenterRecord[],
  teamUserIds: string[],
): CenterRecord[] {
  return pending.filter((row) =>
    workspace === 'manager'
      ? teamUserIds.includes(row.applicantId)
      : kinds[workspace].includes(row.kind),
  );
}

/** Resolve the whole small destination set so denial cannot leave an empty shortcuts card. */
export function useCommonLinks(context: ContextResource) {
  const client = useAuthorizationClient();
  const revision = useAuthorizationRevision();
  const { session } = useAuthentication();
  const roleKey = rolesOf(context).join(',');
  const candidates = useMemo(() => {
    const roles = roleKey.split(',').filter(Boolean) as Workspace[];
    return roles
      .flatMap((role) => destinations[role])
      .filter(
        (item, index, all) =>
          all.findIndex((other) => other.to === item.to) === index,
      );
  }, [roleKey]);
  const [result, setResult] = useState<{
    client: typeof client;
    revision: number;
    userId: string | undefined;
    candidates: typeof candidates;
    links: Destination[];
  }>();
  useEffect(() => {
    let active = true;
    void Promise.all(
      candidates.map(async (item) => {
        try {
          return (await client.can({
            resource: { type: item.type ?? 'composite', id: item.resource },
            action: item.action,
          }))
            ? item
            : undefined;
        } catch {
          return undefined;
        }
      }),
    ).then((links) => {
      if (active)
        setResult({
          client,
          revision,
          userId: session?.user.id,
          candidates,
          links: links.filter(
            (item): item is Destination => item !== undefined,
          ),
        });
    });
    return () => {
      active = false;
    };
  }, [client, revision, session?.user.id, candidates]);
  return result?.client === client &&
    result.revision === revision &&
    result.userId === session?.user.id &&
    result.candidates === candidates
    ? result.links
    : [];
}
