import { lockUserForAdministration } from '@nocobase/app-plugin-authentication';
import type { DatabaseConnection } from '@nocobase/db';
import type { EmployeeService } from '../employees/contract.js';
import type { OrganizationService } from '../org/service.js';
import type { HeadcountService } from '../headcounts/contract.js';
import type { CalendarService } from '../platform/index.js';
import type { SalaryGradeService } from '../job-grades/contract.js';
import { assertSalaryRange } from '../job-grades/ranges.js';
import {
  TransferError,
  type TransferSnapshot,
  type TransferSalarySnapshot,
} from './submission.js';
import { salaryCents } from './salary.js';
export interface TransferExecution {
  id: string;
  actorId: string;
  effectiveDate: string;
  sourceAccountId: string | null;
  snapshot: TransferSnapshot;
  salary: TransferSalarySnapshot;
  now: Date;
}
/** Called only from the owning lifecycle's due execution transition; no business success is synthesized. */
export function transferExecutor(d: {
  employees: EmployeeService;
  organization: OrganizationService;
  headcounts: HeadcountService;
  grades: SalaryGradeService;
  calendar: CalendarService;
}) {
  return async (
    input: TransferExecution,
    connection: DatabaseConnection,
  ): Promise<void> =>
    d.headcounts.within(connection, async (tx) => {
      const refuse = (reason: string): never => {
        throw new TransferError(reason);
      };
      const s = input.snapshot;
      await lockUserForAdministration(tx, s.userId);
      const today = d.calendar.localDate(input.now);
      if (today < input.effectiveDate) refuse('TRANSFER_NOT_DUE');
      const current = await d.employees.getById(s.employeeId, tx);
      if (
        !current?.active ||
        !['probation', 'regular'].includes(current.status)
      )
        refuse('TRANSFER_EMPLOYEE_UNAVAILABLE');
      if (
        current!.userId !== s.userId ||
        current!.positionId !== s.sourcePositionId ||
        current!.gradeId !== s.sourceGradeId ||
        current!.managerId !== s.sourceManagerId ||
        current!.status !== s.sourceStatus
      )
        refuse('TRANSFER_SOURCE_CHANGED');
      const sourceDepartment = await d.organization.primaryDepartmentOf(
        s.userId,
        tx,
      );
      if (sourceDepartment?.id !== s.sourceDepartmentId)
        refuse('TRANSFER_SOURCE_CHANGED');
      if (!(await d.organization.activeChain(s.targetDepartmentId, tx)))
        refuse('TRANSFER_TARGET_DEPARTMENT_UNAVAILABLE');
      const compensation = await d.employees.currentCompensationOf(
        s.employeeId,
        today,
        tx,
      );
      if (
        compensation?.id !== input.salary.currentCompensationId ||
        salaryCents(compensation.baseSalary) !== input.salary.currentCents
      )
        refuse('TRANSFER_COMPENSATION_CHANGED');
      const band = await d.grades.snapshotForGrade(
        s.targetGradeId,
        tx,
        s.gradeRevisionId,
      );
      assertSalaryRange(band, input.salary.targetCents);
      const source = { sourceKind: 'oa.transfer', sourceId: input.id };
      if (s.capacityChanges) {
        if (!input.sourceAccountId)
          refuse('TRANSFER_SOURCE_ACCOUNT_UNAVAILABLE');
        const original = await d.headcounts.balance(input.sourceAccountId!, tx);
        if (
          !original ||
          original.departmentId !== s.sourceDepartmentId ||
          original.positionId !== s.sourcePositionId ||
          original.year !== Number(today.slice(0, 4))
        )
          refuse('TRANSFER_YEAR_REBIND_REQUIRED');
        const reservation = await d.headcounts.reservation(source, tx);
        if (
          !reservation ||
          reservation.state !== 'allocated' ||
          reservation.remaining !== 1 ||
          reservation.blocked
        )
          refuse('TRANSFER_ALLOCATION_UNAVAILABLE');
        const target = await d.headcounts.balance(reservation!.accountId, tx);
        if (
          !target ||
          target.departmentId !== s.targetDepartmentId ||
          target.positionId !== s.targetPositionId ||
          target.year !== original!.year
        )
          refuse('TRANSFER_YEAR_REBIND_REQUIRED');
      }
      const origin = {
        actorId: input.actorId,
        sourceApplication: `oa.transfer:${input.id}`,
      };
      await d.employees.applyAssignmentChange(
        {
          employeeId: s.employeeId,
          expected: {
            positionId: s.sourcePositionId,
            gradeId: s.sourceGradeId,
            managerId: s.sourceManagerId,
            status: s.sourceStatus,
          },
          positionId: s.targetPositionId,
          gradeId: s.targetGradeId,
          managerId: s.targetManagerId,
          effectiveAt: input.effectiveDate,
        },
        origin,
        tx,
      );
      if (sourceDepartment!.id !== s.targetDepartmentId)
        await d.organization.addMember(
          {
            departmentId: s.targetDepartmentId,
            userId: s.userId,
            primary: true,
          },
          { actorId: input.actorId, connection: tx },
        );
      if (s.capacityChanges)
        await d.headcounts.transfer(
          {
            ...source,
            employeeId: s.employeeId,
            sourceAccountId: input.sourceAccountId!,
            actorId: input.actorId,
            requestKey: `effective:${input.id}`,
            reason: 'Approved personnel change effective execution',
          },
          tx,
        );
      if (
        input.salary.targetCents !== input.salary.currentCents ||
        s.targetGradeId !== s.sourceGradeId
      ) {
        const target = BigInt(input.salary.targetCents);
        const amount = `${target / 100n}.${String(target % 100n).padStart(2, '0')}`;
        await d.employees.appendCompensation(
          {
            employeeId: s.employeeId,
            gradeId: s.targetGradeId,
            baseSalary: amount,
            effectiveFrom: input.effectiveDate,
          },
          origin,
          tx,
        );
      }
    });
}
