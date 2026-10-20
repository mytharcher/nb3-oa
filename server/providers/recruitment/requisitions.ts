import { demoNow } from '../demo-data/context.js';
import { createHash } from 'node:crypto';
import type {
  DatabaseConnection,
  RepositoryPolicy,
  RepositoryRecord,
} from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';
import type {
  HeadcountService,
  HeadcountCommand,
} from '../headcounts/contract.js';
import type { AuditService } from '../audit/index.js';
import {
  RecruitmentSubmissionError,
  type RecruitmentSubmissionSnapshot,
} from './submission.js';
export const REQUISITION_FIELDS = [
  'id',
  'requestId',
  'departmentId',
  'positionId',
  'gradeId',
  'accountId',
  'originalQuantity',
  'remaining',
  'consumed',
  'sourceYear',
  'sourceVersion',
  'status',
  'version',
  'createdAt',
  'updatedAt',
] as const;
export interface Requisition extends RepositoryRecord {
  id: string;
  requestId: string;
  departmentId: string;
  positionId: string;
  gradeId: string;
  accountId: string;
  originalQuantity: number;
  remaining: number;
  consumed: number;
  sourceYear: number;
  sourceVersion: number;
  status: 'recruiting' | 'full' | 'closed';
  version: number;
}
export interface RequisitionService {
  publish(
    source: {
      id: string;
      lifecycleVersion: number;
      snapshot: RecruitmentSubmissionSnapshot;
    },
    command: HeadcountCommand,
    tx: DatabaseConnection,
  ): Promise<Requisition>;
  get(
    id: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<Partial<Requisition> | null>;
  close(
    id: string,
    expectedVersion: number,
    command: HeadcountCommand,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<Requisition>;
  /** Explicit HR caller transaction: move all remaining seats and synchronize the requisition. */
  rebind(
    id: string,
    targetAccountId: string,
    targetYear: number,
    expectedVersion: number,
    command: HeadcountCommand,
    tx: DatabaseConnection,
  ): Promise<Requisition>;
  /** Trusted onboarding caller only, which must create its real employee in this same transaction. */
  consume(
    id: string,
    employeeId: string,
    expectedVersion: number,
    command: HeadcountCommand,
    tx: DatabaseConnection,
  ): Promise<Requisition>;
}
export const requisitionServiceToken = createServiceToken<RequisitionService>(
  'oa/requisition-service',
);
const digest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function createRequisitionService(d: {
  headcounts: HeadcountService;
  audit: AuditService;
}): RequisitionService {
  async function durable(
    kind: string,
    payload: unknown,
    command: HeadcountCommand,
    connection: DatabaseConnection,
    work: (tx: DatabaseConnection) => Promise<Requisition>,
  ): Promise<Requisition> {
    if (!command.requestKey || !command.actorId || !command.reason.trim())
      throw new RecruitmentSubmissionError('RECRUITMENT_INVALID_COMMAND');
    return d.headcounts.within(connection, async (tx) => {
      const id = digest([command.actorId, command.requestKey]),
        fingerprint = digest([kind, payload, command.actorId, command.reason]);
      const repository = tx.repository<{
        id: string;
        fingerprint: string;
        result: Requisition;
        createdAt: Date;
      }>('requisitionCommands');
      const old = await repository.findOne({ filter: { id } });
      if (old) {
        if (old.fingerprint !== fingerprint)
          throw new RecruitmentSubmissionError(
            'RECRUITMENT_IDEMPOTENCY_CONFLICT',
          );
        return old.result;
      }
      const result = await work(tx);
      await repository.createOne({
        values: { id, fingerprint, result, createdAt: demoNow() },
      });
      return result;
    });
  }
  async function update(
    id: string,
    version: number,
    values: Partial<Requisition>,
    tx: DatabaseConnection,
  ): Promise<Requisition> {
    const changed = await tx
      .repository<Requisition>('requisitions')
      .updateMany({
        filter: { id, version },
        values: { ...values, version: version + 1, updatedAt: demoNow() },
      });
    if (changed.updatedCount !== 1)
      throw new RecruitmentSubmissionError('RECRUITMENT_VERSION_CONFLICT');
    return (await tx
      .repository<Requisition>('requisitions')
      .findOne({ filter: { id } }))!;
  }
  return {
    async publish(source, command, connection) {
      return durable('publish', source, command, connection, async (tx) => {
        const prior = await tx
          .repository<Requisition>('requisitions')
          .findOne({ filter: { requestId: source.id } });
        if (prior)
          throw new RecruitmentSubmissionError(
            'RECRUITMENT_REQUISITION_ALREADY_PUBLISHED',
          );
        const r = await d.headcounts.allocate(
          { ...command, sourceKind: 'oa.recruitment', sourceId: source.id },
          tx,
        );
        if (
          r.blocked !== 0 ||
          r.quantity !== source.snapshot.quantity ||
          r.accountId !== source.snapshot.accountId
        )
          throw new RecruitmentSubmissionError(
            'RECRUITMENT_RESERVATION_UNAVAILABLE',
          );
        const now = demoNow();
        const created = await tx
          .repository<Requisition>('requisitions')
          .createOne({
            values: {
              id: source.id,
              requestId: source.id,
              departmentId: source.snapshot.departmentId,
              positionId: source.snapshot.positionId,
              gradeId: source.snapshot.gradeId,
              accountId: r.accountId,
              originalQuantity: r.quantity,
              remaining: r.remaining,
              consumed: r.consumed,
              sourceYear: source.snapshot.year,
              sourceVersion: source.lifecycleVersion,
              status: 'recruiting',
              version: 0,
              createdAt: now,
              updatedAt: now,
            },
          });
        await d.audit.record(
          {
            actorId: command.actorId,
            action: 'requisition.publish',
            targetType: 'requisitions',
            targetId: source.id,
            after: { sourceId: source.id, quantity: r.quantity },
          },
          tx,
        );
        return created.record;
      });
    },
    async get(id, tx, policy) {
      const row = await tx
        .repository<Requisition>('requisitions')
        .withPolicy(policy)
        .findOne({ filter: { id } });
      if (!row) return null;
      if (REQUISITION_FIELDS.some((field) => !(field in row)))
        throw new RecruitmentSubmissionError('RECRUITMENT_FORBIDDEN');
      return Object.fromEntries(
        REQUISITION_FIELDS.map((field) => [field, row[field]]),
      );
    },
    async close(id, expectedVersion, command, connection, policy) {
      // Check current authorization even on command replay; a cached result never revives a revoked grant.
      return d.headcounts.within(connection, async (tx) => {
        const visible = await tx
          .repository<Requisition>('requisitions')
          .withPolicy(policy)
          .findOne({ filter: { id } });
        if (!visible?.requestId)
          throw new RecruitmentSubmissionError(
            'RECRUITMENT_REQUISITION_UNAVAILABLE',
          );
        const allowed = await tx
          .repository<Requisition>('requisitions')
          .withPolicy(policy)
          .updateMany({ filter: { id }, values: { status: visible.status } });
        if (allowed.updatedCount !== 1)
          throw new RecruitmentSubmissionError('RECRUITMENT_FORBIDDEN');
        return durable(
          'close',
          { id, expectedVersion },
          command,
          tx,
          async (inner) => {
            const record = (await inner
              .repository<Requisition>('requisitions')
              .findOne({ filter: { id } }))!;
            if (
              record.version !== expectedVersion ||
              record.status !== 'recruiting'
            )
              throw new RecruitmentSubmissionError(
                'RECRUITMENT_VERSION_CONFLICT',
              );
            const reservation = await d.headcounts.close(
              {
                ...command,
                sourceKind: 'oa.recruitment',
                sourceId: record.requestId,
              },
              inner,
            );
            const result = await update(
              id,
              expectedVersion,
              {
                remaining: reservation.remaining,
                consumed: reservation.consumed,
                status: 'closed',
              },
              inner,
            );
            await d.audit.record(
              {
                actorId: command.actorId,
                action: 'requisition.close',
                targetType: 'requisitions',
                targetId: id,
                after: {
                  remaining: reservation.remaining,
                  consumed: reservation.consumed,
                },
              },
              inner,
            );
            return result;
          },
        );
      });
    },
    async rebind(
      id,
      targetAccountId,
      targetYear,
      expectedVersion,
      command,
      connection,
    ) {
      return durable(
        'rebind',
        { id, targetAccountId, targetYear, expectedVersion },
        command,
        connection,
        async (tx) => {
          const record = await tx
            .repository<Requisition>('requisitions')
            .findOne({ filter: { id } });
          if (
            !record ||
            record.status !== 'recruiting' ||
            record.version !== expectedVersion
          )
            throw new RecruitmentSubmissionError(
              'RECRUITMENT_VERSION_CONFLICT',
            );
          const target = await d.headcounts.balance(targetAccountId, tx);
          if (
            !target ||
            target.year !== targetYear ||
            target.departmentId !== record.departmentId ||
            target.positionId !== record.positionId
          )
            throw new RecruitmentSubmissionError(
              'RECRUITMENT_RESERVATION_UNAVAILABLE',
            );
          const reservation = await d.headcounts.rebind(
            {
              ...command,
              sourceKind: 'oa.recruitment',
              sourceId: record.requestId,
              targetAccountId,
            },
            tx,
          );
          const result = await update(
            id,
            expectedVersion,
            {
              accountId: reservation.accountId,
              sourceYear: targetYear,
              remaining: reservation.remaining,
              consumed: reservation.consumed,
            },
            tx,
          );
          await d.audit.record(
            {
              actorId: command.actorId,
              action: 'requisition.rebind',
              targetType: 'requisitions',
              targetId: id,
              before: {
                accountId: record.accountId,
                sourceYear: record.sourceYear,
              },
              after: {
                accountId: result.accountId,
                sourceYear: result.sourceYear,
              },
              reason: command.reason,
            },
            tx,
          );
          return result;
        },
      );
    },
    async consume(id, employeeId, expectedVersion, command, connection) {
      return durable(
        'consume',
        { id, employeeId, expectedVersion },
        command,
        connection,
        async (tx) => {
          const record = await tx
            .repository<Requisition>('requisitions')
            .findOne({ filter: { id } });
          if (
            !record ||
            record.status !== 'recruiting' ||
            record.version !== expectedVersion
          )
            throw new RecruitmentSubmissionError(
              'RECRUITMENT_VERSION_CONFLICT',
            );
          const r = await d.headcounts.consume(
            {
              ...command,
              sourceKind: 'oa.recruitment',
              sourceId: record.requestId,
              employeeId,
            },
            tx,
          );
          const result = await update(
            id,
            expectedVersion,
            {
              remaining: r.remaining,
              consumed: r.consumed,
              status: r.remaining === 0 ? 'full' : 'recruiting',
            },
            tx,
          );
          await d.audit.record(
            {
              actorId: command.actorId,
              action: 'requisition.consume',
              targetType: 'requisitions',
              targetId: id,
              after: { remaining: r.remaining, consumed: r.consumed },
            },
            tx,
          );
          return result;
        },
      );
    },
  };
}
