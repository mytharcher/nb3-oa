import { demoNow } from '../demo-data/context.js';
import { randomUUID } from 'node:crypto';
import type { DatabaseManager, DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { Employee } from '../employees/contract.js';
import type { LeaveBalanceService } from '../leave-balances/contract.js';
import type { CalendarService } from '../platform/calendar.js';
import type { DictionaryService } from '../platform/dictionaries.js';
import {
  AnnualLeaveError,
  calculateAnnualLeave,
  annualLeaveLocalGrantInstant,
} from './calculation.js';
import type {
  AnnualLeaveAccrual,
  AnnualLeavePolicyResolver,
  AnnualLeaveService,
  AnnualLeaveSweepResult,
} from './contract.js';

export function createAnnualLeaveService(deps: {
  db: DatabaseManager;
  audit: AuditService;
  balances: LeaveBalanceService;
  calendar: Pick<CalendarService, 'localDate' | 'timeZone'>;
  dictionaries: Pick<DictionaryService, 'list'>;
  resolver: AnnualLeavePolicyResolver;
}): AnnualLeaveService {
  const { db, audit, balances, calendar, dictionaries, resolver } = deps;
  const service: AnnualLeaveService = {
    async accrue(employeeId, year, at, connection) {
      if (
        !Number.isInteger(year) ||
        year !== Number(calendar.localDate(at).slice(0, 4))
      ) {
        throw new AnnualLeaveError(
          'ANNUAL_LEAVE_YEAR_INVALID',
          'Only the current platform-calendar year may be reconciled.',
        );
      }
      // The unique employee/year claim is committed with the balance and audit. Conflicting workers
      // roll back instead of double-granting; their next daily reconciliation observes the winner.
      return connection.transaction(async (tx) => {
        const records = tx.repository<AnnualLeaveAccrual>(
          'annualLeaveAccruals',
        );
        const existing = await records.findOne({
          filter: { employeeId, year },
        });
        if (existing) return { status: 'existing', record: existing };
        const employee = await tx
          .repository<Employee>('employees')
          .findOne({ filter: { id: employeeId } });
        if (!employee?.active || employee.status === 'left')
          return { status: 'skipped' };
        const policy = await resolver.policy(at, tx);
        if (!policy?.enabled) return { status: 'skipped' };
        const today = calendar.localDate(at);
        if (!employee.hireDate)
          throw new AnnualLeaveError(
            'ANNUAL_LEAVE_HIRE_DATE_MISSING',
            'An employment date is required.',
          );
        if (employee.hireDate > today) return { status: 'skipped' };
        const seniorityStartDate = await resolver.seniorityStartDate(
          employee,
          policy,
          tx,
        );
        if (!seniorityStartDate)
          throw new AnnualLeaveError(
            'ANNUAL_LEAVE_SENIORITY_MISSING',
            'Verified first-work date is required; company hire date is not a substitute.',
          );
        const entries = await dictionaries.list('annualLeaveTier', {}, tx);
        const calculation = calculateAnnualLeave({
          year,
          hireDate: employee.hireDate,
          seniorityStartDate,
          tiers: entries
            .filter((e) => e.active)
            .map((e) => ({
              code: e.code,
              minYears: Number(e.extra?.minYears),
              days: Number(e.extra?.days),
            })),
          policy,
          timeZone: calendar.timeZone(),
        });
        const record: AnnualLeaveAccrual = {
          id: randomUUID(),
          employeeId,
          year,
          units: calculation.units,
          expiresAt: calculation.expiresAt,
          grantedAt: at,
          snapshot: {
            policy,
            seniorityStartDate,
            hireDate: employee.hireDate,
            timeZone: calendar.timeZone(),
            tiers: entries.map((e) => ({
              code: e.code,
              active: e.active,
              extra: e.extra,
            })),
            entitlementDate: calculation.entitlementDate,
            serviceYears: calculation.serviceYears,
            tierCode: calculation.tierCode,
            months: calculation.months,
          },
        };
        await records.createOne({ values: record });
        if (record.units > 0) {
          await balances.grant(
            {
              employeeId,
              leaveType: 'annual',
              units: record.units,
              requestKey: `annual-accrual:${year}`,
              reference: `annual-accrual:${year}:${employeeId}`,
              expiresAt: calculation.expiresAt,
              at: annualLeaveLocalGrantInstant(
                calculation.entitlementDate,
                calendar.timeZone(),
              ),
              actorId: null,
              reason: `Annual leave accrual ${year}`,
            },
            tx,
          );
        }
        await audit.record(
          {
            actorId: null,
            action: 'annualLeave.accrue',
            targetType: 'annualLeaveAccruals',
            targetId: `${employeeId}:${year}`,
            after: record,
          },
          tx,
        );
        return { status: 'granted', record };
      });
    },
    async reconcile(at = demoNow()) {
      const result: AnnualLeaveSweepResult = {
        granted: 0,
        existing: 0,
        skipped: 0,
        blocked: [],
      };
      const year = Number(calendar.localDate(at).slice(0, 4));
      // No historical backfill: daily current-year scans catch a missed January 1 and newly hired staff.
      // Bounded paging avoids an application-wide transaction and a large in-memory employee list.
      let offset = 0;
      while (true) {
        const employees = await db.repository<Employee>('employees').findMany({
          filter: { active: true },
          sort: (s) => [s.field('id').asc()],
          offset,
          limit: 100,
        });
        if (!employees.length) break;
        for (const employee of employees) {
          try {
            const accrued = await db.transaction((tx: DatabaseConnection) =>
              service.accrue(employee.id, year, at, tx),
            );
            result[accrued.status] += 1;
          } catch (error) {
            if (!(error instanceof AnnualLeaveError)) throw error;
            result.blocked.push({
              employeeId: employee.id,
              year,
              code: error.code,
            });
          }
        }
        offset += employees.length;
      }
      return result;
    },
  };
  return service;
}
