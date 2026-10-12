import { createHash } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { DepartureApprovalReassignment } from '../departure/contract.js';
import { DepartureReassignmentError } from './service.js';
export type ReassignmentCommand = Parameters<
  DepartureApprovalReassignment['reassign']
>[0];
export interface ReassignmentJournal {
  reserve(
    input: ReassignmentCommand,
    actorId: string,
  ): Promise<{ actorId: string }>;
}
interface StoredCommand {
  id: string;
  requestKey: string;
  fromId: string;
  toId: string;
  reason: string;
  actorId: string;
  createdAt: Date;
}
export function createReassignmentJournal(
  db: DatabaseManager,
  audit: Pick<AuditService, 'record'>,
): ReassignmentJournal {
  function verify(row: StoredCommand, input: ReassignmentCommand) {
    if (
      row.requestKey !== input.requestKey ||
      row.fromId !== input.from ||
      row.toId !== input.to ||
      row.reason !== input.reason
    )
      throw new DepartureReassignmentError(
        'REASSIGNMENT_REQUEST_REUSED',
        'The departure request key is already bound to another handover payload.',
      );
    return { actorId: row.actorId };
  }
  return {
    async reserve(input, actorId) {
      const id = createHash('sha256').update(input.requestKey).digest('hex');
      try {
        return await db.transaction(async (tx) => {
          const repo = tx.repository<StoredCommand>(
            'departureReassignmentCommands',
          );
          const previous = await repo.findOne({ filter: { id } });
          if (previous) return verify(previous, input);
          await repo.createOne({
            values: {
              id,
              requestKey: input.requestKey,
              fromId: input.from,
              toId: input.to,
              reason: input.reason,
              actorId,
              createdAt: new Date(),
            },
          });
          await audit.record(
            {
              actorId,
              action: 'departure.reassignmentReserved',
              targetType: 'departureReassignmentCommands',
              targetId: id,
              after: {
                fromId: input.from,
                toId: input.to,
                requestKey: input.requestKey,
              },
              reason: input.reason,
            },
            tx,
          );
          return { actorId };
        });
      } catch (cause) {
        // Unique-key losers must read outside the failed transaction (PostgreSQL aborts it).
        // An unknown commit is also reconciled against the durable immutable command.
        const row = await db
          .repository<StoredCommand>('departureReassignmentCommands')
          .findOne({ filter: { id } });
        if (row) return verify(row, input);
        throw cause;
      }
    },
  };
}
