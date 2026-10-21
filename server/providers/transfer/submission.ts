import { inDemoPartition } from '../demo-data/context.js';
import type { DatabaseConnection } from '@nocobase/db';
import type { EmployeeService, EmployeeStatus } from '../employees/contract.js';
import type { OrgService } from '../org/contract.js';
import type {
  SalaryGradeService,
  SalaryGradeSelection,
} from '../job-grades/contract.js';
import { assertSalaryRange } from '../job-grades/ranges.js';
import type { CalendarService, RuleService } from '../platform/index.js';
import { isLocalDate } from '../platform/time-zone.js';
import { raiseExceeds, salaryCents } from './salary.js';
export class TransferError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
  }
}
export interface TransferProposal {
  employeeId: string;
  kinds: readonly ('transfer' | 'salaryChange' | 'promotion')[];
  targetDepartmentId: string;
  targetPositionId: string;
  targetGradeId: string;
  targetManagerId: string | null;
  effectiveDate: string;
  targetSalary: string;
}
/** Only this safe snapshot may enter the approval SDK and lifecycle journal. */
export interface TransferSnapshot {
  employeeId: string;
  userId: string;
  sourceDepartmentId: string;
  sourcePositionId: string;
  sourceGradeId: string | null;
  sourceManagerId: string | null;
  sourceStatus: EmployeeStatus;
  targetDepartmentId: string;
  targetPositionId: string;
  targetGradeId: string;
  targetManagerId: string | null;
  capacityChanges: boolean;
  gradeRevisionId: string;
  gradeTableVersion: number;
  directManagerId: string | null;
  directManagerRequired: boolean;
  sourceHeadId: string | null;
  targetHeadId: string | null;
  targetHeadRequired: boolean;
  hrIds: string[];
  executiveId: string | null;
  executiveRequired: boolean;
  gmId: string | null;
  gmRequired: boolean;
  ruleSnapshot: Record<string, number>;
}
export interface TransferSalarySnapshot {
  currentCompensationId: string;
  currentCents: number;
  targetCents: number;
  band: SalaryGradeSelection;
}
export function transferPreparation(d: {
  employees: EmployeeService;
  org: OrgService;
  grades: SalaryGradeService;
  calendar: CalendarService;
  rules: RuleService;
}) {
  return async (
    proposal: TransferProposal,
    actorId: string,
    now: Date,
    tx: DatabaseConnection,
    frozen?: Pick<TransferSnapshot, 'gradeRevisionId' | 'ruleSnapshot'>,
  ): Promise<{
    snapshot: TransferSnapshot;
    salary: TransferSalarySnapshot;
  }> => {
    const fail = (reason: string): never => {
      throw new TransferError(reason);
    };
    const kinds = [...new Set(proposal.kinds)];
    if (
      !kinds.length ||
      kinds.length !== proposal.kinds.length ||
      kinds.some(
        (kind) => !['transfer', 'salaryChange', 'promotion'].includes(kind),
      )
    )
      fail('TRANSFER_INVALID_KINDS');
    const currentDate = d.calendar.localDate(now);
    if (
      !isLocalDate(proposal.effectiveDate) ||
      (!frozen && proposal.effectiveDate < currentDate)
    )
      fail('TRANSFER_INVALID_DATE');
    const employee = await d.employees.getById(proposal.employeeId, tx);
    if (
      !employee?.active ||
      !['probation', 'regular'].includes(employee.status) ||
      !employee.positionId
    )
      fail('TRANSFER_EMPLOYEE_UNAVAILABLE');
    const actual = employee!;
    const department = await d.org.primaryDepartmentOf(actual.userId, tx);
    if (!department) fail('TRANSFER_SOURCE_DEPARTMENT_UNAVAILABLE');
    const manager = await d.employees.managerOf(actual.userId, tx);
    if (
      actorId !== manager?.userId &&
      !(await d.org.hasDutyRole(actorId, 'hr', tx))
    )
      fail('TRANSFER_FORBIDDEN');
    if (!(await d.org.activeChain(proposal.targetDepartmentId, tx)))
      fail('TRANSFER_TARGET_DEPARTMENT_UNAVAILABLE');
    if (
      !(await d.org.listPositions(tx)).some(
        (position) =>
          position.id === proposal.targetPositionId && position.active,
      )
    )
      fail('TRANSFER_TARGET_POSITION_UNAVAILABLE');
    if (proposal.targetManagerId) {
      const targetManager = await d.employees.getById(
        proposal.targetManagerId,
        tx,
      );
      if (
        !targetManager?.active ||
        !['probation', 'regular'].includes(targetManager.status) ||
        targetManager.id === actual.id ||
        (await d.employees.isAboveInReportingLine(
          actual.userId,
          targetManager.userId,
          tx,
        ))
      )
        fail('TRANSFER_TARGET_MANAGER_UNAVAILABLE');
    }
    const capacityChanges =
      department!.id !== proposal.targetDepartmentId ||
      actual.positionId !== proposal.targetPositionId;
    if (capacityChanges !== kinds.includes('transfer'))
      fail('TRANSFER_KIND_FACTS_MISMATCH');
    const band = await d.grades.snapshotForGrade(
      proposal.targetGradeId,
      tx,
      frozen?.gradeRevisionId,
    );
    const sourceGrade = (await d.org.listGrades(tx)).find(
      (grade) => grade.id === actual.gradeId,
    );
    if (
      actual.gradeId !== proposal.targetGradeId &&
      !kinds.includes('promotion')
    )
      fail('TRANSFER_KIND_FACTS_MISMATCH');
    if (
      kinds.includes('promotion') &&
      (!sourceGrade || band.rank <= sourceGrade.rank)
    )
      fail('TRANSFER_INVALID_PROMOTION');
    const current = await d.employees.currentCompensationOf(
      actual.id,
      currentDate,
      tx,
    );
    if (!current) fail('TRANSFER_CURRENT_SALARY_INVALID');
    const currentCents = salaryCents(current!.baseSalary),
      targetCents = salaryCents(proposal.targetSalary);
    assertSalaryRange(band, targetCents);
    if (!kinds.includes('salaryChange') && currentCents !== targetCents)
      fail('TRANSFER_KIND_FACTS_MISMATCH');
    if (
      !capacityChanges &&
      actual.gradeId === proposal.targetGradeId &&
      currentCents === targetCents &&
      actual.managerId === proposal.targetManagerId
    )
      fail('TRANSFER_NO_CHANGE');
    const rules =
      frozen?.ruleSnapshot ??
      (await d.rules.snapshot(
        ['raise.vp', 'raise.gm', 'grade.managerRank', 'grade.directorRank'],
        now,
        tx,
      ));
    const ruleSnapshot = Object.fromEntries(
      ['raise.vp', 'raise.gm', 'grade.managerRank', 'grade.directorRank'].map(
        (key) => [key, Number(rules[key])],
      ),
    ) as Record<string, number>;
    if (
      !Number.isSafeInteger(ruleSnapshot['grade.managerRank']) ||
      !Number.isSafeInteger(ruleSnapshot['grade.directorRank'])
    )
      fail('TRANSFER_INVALID_RULES');
    const vpRaise = raiseExceeds(
      currentCents,
      targetCents,
      ruleSnapshot['raise.vp'],
    );
    const gmRaise = raiseExceeds(
      currentCents,
      targetCents,
      ruleSnapshot['raise.gm'],
    );
    // Freeze candidates from the same partition used by the approval directory.
    const hrIds = [...new Set(await d.org.dutyRoleMembers('hr', tx))].filter(
      (id) => inDemoPartition(id, tx),
    );
    const gmIds = (await d.org.dutyRoleMembers('gm', tx)).filter((id) =>
      inDemoPartition(id, tx),
    );
    if (gmIds.length > 1) fail('TRANSFER_AMBIGUOUS_SINGLE_ROLE');
    return {
      snapshot: {
        employeeId: actual.id,
        userId: actual.userId,
        sourceDepartmentId: department!.id,
        sourcePositionId: actual.positionId!,
        sourceGradeId: actual.gradeId,
        sourceManagerId: actual.managerId,
        sourceStatus: actual.status,
        targetDepartmentId: proposal.targetDepartmentId,
        targetPositionId: proposal.targetPositionId,
        targetGradeId: proposal.targetGradeId,
        targetManagerId: proposal.targetManagerId,
        capacityChanges,
        gradeRevisionId: band.revisionId,
        gradeTableVersion: band.tableVersion,
        directManagerId: manager?.userId ?? null,
        directManagerRequired: actorId !== manager?.userId,
        sourceHeadId: (await d.org.headOf(department!.id, tx)) ?? null,
        targetHeadId:
          (await d.org.headOf(proposal.targetDepartmentId, tx)) ?? null,
        targetHeadRequired: kinds.includes('transfer'),
        hrIds,
        executiveId:
          (await d.org.executiveOf(proposal.targetDepartmentId, tx)) ?? null,
        executiveRequired:
          vpRaise || band.rank >= ruleSnapshot['grade.managerRank'],
        gmId: gmIds[0] ?? null,
        gmRequired: gmRaise || band.rank >= ruleSnapshot['grade.directorRank'],
        ruleSnapshot,
      },
      salary: {
        currentCompensationId: current!.id,
        currentCents,
        targetCents,
        band,
      },
    };
  };
}
