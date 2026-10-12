import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { OrgService } from '../org/contract.js';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';
import type {
  FinanceAssignment,
  FinanceAssignmentService,
} from './contract.js';
export class FinanceAssignmentError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
function fail(code: string, message: string): never {
  throw new FinanceAssignmentError(`FINANCE_ASSIGNMENT_${code}`, message);
}
export function createFinanceAssignmentService(d: {
  db: DatabaseManager;
  audit: AuditService;
  org: OrgService;
  directory: ApprovalDirectoryService;
}): FinanceAssignmentService {
  const get = async (id: string, tx = d.db.connection()) =>
    (await tx
      .repository<FinanceAssignment>('financeAssignments')
      .findOne({ filter: { id } })) ?? null;
  async function candidates(tx = d.db.connection()) {
    const directory = await d.directory.snapshot(tx);
    return directory
      .roleMembers('finance')
      .filter((id) => directory.isActive(id));
  }
  async function validate(
    departmentId: string,
    accountantId: string,
    input: { actorId: string; reason: string },
    tx: DatabaseConnection,
  ) {
    if (!input.actorId || !input.reason.trim() || input.reason.length > 4000)
      fail('INVALID_COMMAND', 'An actor and reason are required.');
    if (!(await d.org.activeChain(departmentId, tx)))
      fail('INVALID_DEPARTMENT', 'Select an active department.');
    if (!(await candidates(tx)).includes(accountantId))
      fail('INVALID_ACCOUNTANT', 'Select an active finance duty-role member.');
  }
  async function audited(
    before: FinanceAssignment | null,
    after: FinanceAssignment,
    input: { actorId: string; reason: string },
    tx: DatabaseConnection,
  ) {
    await d.audit.record(
      {
        actorId: input.actorId,
        action: before
          ? 'financeAssignment.update'
          : 'financeAssignment.create',
        targetType: 'financeAssignments',
        targetId: after.id,
        before,
        after,
        reason: input.reason,
      },
      tx,
    );
    return after;
  }
  return {
    get,
    candidates,
    async list(query, tx = d.db.connection()) {
      const data = await tx
        .repository<FinanceAssignment>('financeAssignments')
        .findMany({
          ...(query.departmentId || query.active !== undefined
            ? {
                filter: {
                  ...(query.departmentId
                    ? { departmentId: query.departmentId }
                    : {}),
                  ...(query.active !== undefined
                    ? { active: query.active }
                    : {}),
                },
              }
            : {}),
          sort: (s) =>
            query.order === 'asc'
              ? [s.field('updatedAt').asc(), s.field('id').asc()]
              : [s.field('updatedAt').desc(), s.field('id').desc()],
        });
      const page = Math.min(
        Math.max(1, query.page),
        Math.max(1, Math.ceil(data.length / query.pageSize)),
      );
      return {
        data: data.slice((page - 1) * query.pageSize, page * query.pageSize),
        meta: { page, pageSize: query.pageSize, total: data.length },
      };
    },
    async create(input, connection) {
      return connection.transaction(async (tx) => {
        await validate(input.departmentId, input.accountantId, input, tx);
        let after: FinanceAssignment;
        try {
          after = await tx.transaction(
            async (savepoint) =>
              (
                await savepoint
                  .repository<FinanceAssignment>('financeAssignments')
                  .createOne({
                    values: {
                      id: randomUUID(),
                      departmentId: input.departmentId,
                      accountantId: input.accountantId,
                      active: true,
                      version: 1,
                      updatedAt: new Date(),
                    },
                  })
              ).record,
          );
        } catch (error) {
          if (
            await tx
              .repository('financeAssignments')
              .findOne({ filter: { departmentId: input.departmentId } })
          )
            fail(
              'ALREADY_EXISTS',
              'This department already has an assignment; edit that assignment.',
            );
          throw error;
        }
        return audited(null, after, input, tx);
      });
    },
    async update(id, input, connection) {
      return connection.transaction(async (tx) => {
        const repo = tx.repository<FinanceAssignment>('financeAssignments');
        const lock = await repo.updateMany({
          filter: { id, version: input.version },
          values: { version: { increment: 1 } },
        });
        if (!lock.updatedCount) {
          if (await get(id, tx))
            fail(
              'VERSION_CONFLICT',
              'This assignment changed; refresh before trying again.',
            );
          fail('NOT_FOUND', 'This assignment does not exist.');
        }
        const current = (await get(id, tx))!,
          before = { ...current, version: input.version };
        const accountantId = input.accountantId ?? current.accountantId,
          active = input.active ?? current.active;
        // Disabling a stale assignment must remain possible; reactivation and reassignment validate the full active pool.
        if (active)
          await validate(current.departmentId, accountantId, input, tx);
        else if (
          !input.actorId ||
          !input.reason.trim() ||
          input.reason.length > 4000
        )
          fail('INVALID_COMMAND', 'An actor and reason are required.');
        const after = (
          await repo.updateOne({
            filter: { id },
            values: { accountantId, active, updatedAt: new Date() },
          })
        ).record;
        return audited(before, after, input, tx);
      });
    },
    async resolve(departmentId, applicantId, tx) {
      const chain = await d.org.activeChain(departmentId, tx);
      if (!chain) return undefined;
      const directory = await d.directory.snapshot(tx);
      let selected: string | undefined;
      for (const department of chain) {
        const row = await tx
          .repository<FinanceAssignment>('financeAssignments')
          .findOne({ filter: { departmentId: department.id, active: true } });
        if (
          row &&
          directory.isActive(row.accountantId) &&
          directory.hasRole(row.accountantId, 'finance')
        ) {
          selected = row.accountantId;
          break;
        }
      }
      selected ??= directory.uniqueRoleMember('financeManager');
      if (selected === applicantId) selected = directory.managerOf(applicantId);
      return selected &&
        selected !== applicantId &&
        directory.isActive(selected)
        ? selected
        : undefined;
    },
  };
}
