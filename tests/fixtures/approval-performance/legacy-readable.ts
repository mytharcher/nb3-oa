import type { DatabaseManager } from '@nocobase/db';
import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
import type { OaApprovalDirectory } from '../../../server/providers/approval-directory/contract.js';
import type { OrgService } from '../../../server/providers/org/contract.js';
import type { EmployeeService } from '../../../server/providers/employees/contract.js';

// Frozen pre-optimization predicates from the 2026-10-22 plan. Keep this oracle
// independent of readable-scope options so changes to a module's rules are caught.
export interface LegacyRow extends Record<string, unknown> {
  id: string;
  applicantId: string;
  createdById: string;
  creatorId: string;
  departmentId: string | null;
  executiveId: string | null;
  executiveApproverId: string | null;
  headApproverId: string | null;
  handoverUserId: string | null;
  managerApproverId: string | null;
  gmApproverId: string | null;
  status: string;
  snapshot: { executiveId?: string; userId?: string } | null;
}
export interface LegacyContext {
  db: DatabaseManager;
  approvals: ApprovalService;
  directory: OaApprovalDirectory;
  org: OrgService;
  employees: EmployeeService;
  lifecycle: string;
}
export async function legacyReadable(
  kind: string,
  row: LegacyRow,
  actor: string,
  d: LegacyContext,
): Promise<boolean> {
  const role = (...names: string[]) =>
    names.some((name) => d.directory.hasRole(actor, name));
  const involved = async () =>
    Boolean(
      (await d.approvals.involvementOf(d.lifecycle, row.id, actor)).length,
    );
  const head = async (departmentId: string | null) =>
    Boolean(
      departmentId &&
      (await d.org.activeChain(departmentId))?.some(
        (department) => department.managerId === actor,
      ),
    );
  const owner = row.applicantId === actor || row.createdById === actor;
  if (kind === 'oa.recruitment')
    return (
      row.applicantId === actor ||
      role('approval.admin', 'hrbp', 'hrDirector', 'gm') ||
      row.snapshot?.executiveId === actor ||
      (await head(row.departmentId)) ||
      (await involved())
    );
  if (kind === 'oa.transfer')
    return (
      row.applicantId === actor ||
      row.snapshot?.userId === actor ||
      (await d.org.hasDutyRole(actor, 'hr')) ||
      (await involved())
    );
  if (kind === 'oa.contract')
    return (
      row.applicantId === actor ||
      row.creatorId === actor ||
      role(
        'legal',
        'finance',
        'financeManager',
        'cfo',
        'gm',
        'approval.admin',
      ) ||
      (await involved())
    );
  if (kind === 'oa.vendorQualification') {
    if (
      owner ||
      role('finance', 'financeManager', 'cfo', 'gm', 'approval.admin') ||
      (await involved())
    )
      return true;
    const department = await d.org.primaryDepartmentOf(actor);
    return Boolean(
      department &&
      (await d.org.headOf(department.id)) === actor &&
      row.departmentId &&
      (await d.org.subtreeIds(department.id)).includes(row.departmentId),
    );
  }
  if (kind === 'oa.departure') {
    if (
      owner ||
      [
        row.handoverUserId,
        row.managerApproverId,
        row.headApproverId,
        row.gmApproverId,
      ].includes(actor)
    )
      return true;
    if (
      (await d.db
        .repository('departureWorkItems')
        .exists({ filter: { departureId: row.id, claimedById: actor } })) ||
      (await d.db
        .repository('departureWorkItems')
        .exists({ filter: { departureId: row.id, forcedById: actor } }))
    )
      return true;
    return (
      (await d.org.hasDutyRole(actor, 'hr')) ||
      role('approval.admin') ||
      (await involved()) ||
      (row.status === 'handover' &&
        (
          await Promise.all(
            ['it', 'admin', 'finance'].map((name) =>
              d.org.hasDutyRole(actor, name),
            ),
          )
        ).some(Boolean))
    );
  }
  if (kind === 'oa.assetRequest')
    return (
      owner ||
      row.headApproverId === actor ||
      role('admin', 'finance', 'gm', 'approval.admin') ||
      (await involved()) ||
      (await d.approvals.tasksFor(d.lifecycle, row.id)).some(
        (task) => task.actorId === actor,
      )
    );
  const financeKinds = [
    'oa.budgetAdjustment',
    'oa.expensePlan',
    'oa.training',
    'oa.travel',
    'oa.travelCancellation',
    'oa.loan',
    'oa.reimbursement',
    'oa.payment',
    'oa.purchase',
  ];
  let roles = ['hr', 'gm', 'approval.admin'];
  if (financeKinds.includes(kind)) roles = ['finance', 'gm', 'approval.admin'];
  if (
    [
      'oa.budgetAdjustment',
      'oa.travel',
      'oa.reimbursement',
      'oa.travelCancellation',
    ].includes(kind)
  )
    roles = ['finance', 'financeManager', 'cfo', 'gm', 'approval.admin'];
  if (kind === 'oa.loan')
    roles = ['finance', 'cashier', 'cfo', 'gm', 'approval.admin'];
  if (kind === 'oa.payment')
    roles = [
      'finance',
      'financeManager',
      'cashier',
      'cfo',
      'gm',
      'approval.admin',
    ];
  if (kind === 'oa.purchase') roles.push('purchasing');
  if (kind === 'oa.probation') roles.push('cfo');
  if (owner || role(...roles)) return true;
  if (
    [
      'oa.expensePlan',
      'oa.training',
      'oa.travel',
      'oa.loan',
      'oa.payment',
      'oa.purchase',
    ].includes(kind) &&
    row.executiveApproverId === actor
  )
    return true;
  if (kind === 'oa.reimbursement' && row.executiveId === actor) return true;
  if (await involved()) return true;
  if (
    !['oa.payment', 'oa.probation'].includes(kind) &&
    (await d.approvals.tasksFor(d.lifecycle, row.id)).some(
      (task) => task.actorId === actor,
    )
  )
    return true;
  const primaryKinds = [
    'oa.leave',
    'oa.overtime',
    'oa.attendanceChange',
    'oa.general',
    'oa.outing',
    'oa.supplies',
    'oa.leaveCancellation',
    'oa.travelCancellation',
  ];
  const department = primaryKinds.includes(kind)
    ? ((await d.org.primaryDepartmentOf(row.applicantId))?.id ?? null)
    : row.departmentId;
  return (
    (await head(department)) ||
    (kind !== 'oa.purchase' &&
      (await d.employees.isAboveInReportingLine(actor, row.applicantId)))
  );
}
