import { demoNow, demoPartition } from '../demo-data/context.js';
import { randomUUID } from 'node:crypto';
import { refuse } from './errors.js';
import type { DatabaseConnection } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import { validateCommittee, type CommitteeVersion } from './committee.js';
export const DEFAULT_COMMITTEE: CommitteeVersion = {
  version: 1,
  min: 2,
  settle: 'veto',
  seats: [
    { key: 'purchasing', source: 'purchasing', veto: false },
    { key: 'finance', source: 'finance', veto: true },
    { key: 'department', source: 'applicantHead', veto: false },
  ],
};
interface StoredVersion extends CommitteeVersion {
  createdById: string;
  createdAt: Date;
}
export interface Assignment {
  id: string;
  committeeVersion: number;
  seatKey: string;
  personId: string | null;
  version: number;
  updatedAt: Date;
}
/** Public configuration writes run only after the owning route checks the explicit manage action. */
export function createCommitteeConfiguration(
  audit: AuditService,
  eligible: (
    personId: string,
    source: string,
    tx: DatabaseConnection,
  ) => Promise<boolean>,
) {
  return {
    async versions(tx: DatabaseConnection): Promise<CommitteeVersion[]> {
      const rows = await tx
        .repository<StoredVersion>('vendorCommitteeVersions')
        .findMany({ sort: (s) => [s.field('version').asc()] });
      return rows.length
        ? rows.map(validateCommittee)
        : [validateCommittee(DEFAULT_COMMITTEE)];
    },
    async assignments(version: number, tx: DatabaseConnection) {
      const demo = demoPartition(tx);
      if (demo?.identities) {
        const structure = (await this.versions(tx)).find(
          (v) => v.version === version,
        );
        const roles = {
          purchasing: 'purchasing2',
          finance: 'finance',
          technical: 'committeeTech',
          legal: 'legal',
        } as const;
        return (structure?.seats ?? [])
          .filter((seat) => seat.source !== 'applicantHead')
          .map((seat) => ({
            id: `${demo.id}:${seat.key}`,
            committeeVersion: version,
            seatKey: seat.key,
            personId:
              seat.source === 'applicantHead'
                ? null
                : (demo.identities![roles[seat.source]] ?? null),
            version: 0,
            updatedAt: demoNow(),
          }));
      }
      return tx.repository<Assignment>('vendorCommitteeAssignments').findMany({
        filter: { committeeVersion: version },
        sort: (s) => [s.field('seatKey').asc()],
      });
    },
    async removalHead(tx: DatabaseConnection) {
      return tx
        .repository<{
          id: string;
          personId: string | null;
          version: number;
          updatedAt: Date;
        }>('vendorRemovalConfiguration')
        .findOne({ filter: { id: 'main' } });
    },
    async assignRemovalHead(
      input: {
        personId: string | null;
        expectedVersion: number;
        actorId: string;
        reason: string;
      },
      tx: DatabaseConnection,
    ) {
      if (!input.reason.trim())
        refuse(
          'REASON_REQUIRED',
          'Changing the purchasing head requires a reason.',
        );
      if (input.personId && !(await eligible(input.personId, 'purchasing', tx)))
        refuse('INELIGIBLE_HEAD', 'Choose an active purchasing head.');
      const repo = tx.repository<{
        id: string;
        personId: string | null;
        version: number;
        updatedAt: Date;
      }>('vendorRemovalConfiguration');
      const before = await repo.findOne({ filter: { id: 'main' } });
      if ((before?.version ?? 0) !== input.expectedVersion)
        refuse(
          'CONFIGURATION_CHANGED',
          'The purchasing head configuration changed.',
          'conflict',
        );
      const values = {
        personId: input.personId,
        version: input.expectedVersion + 1,
        updatedAt: demoNow(),
      };
      if (before) {
        const changed = await repo.updateMany({
          filter: { id: 'main', version: input.expectedVersion },
          values,
        });
        if (!changed.updatedCount)
          refuse(
            'CONFIGURATION_CHANGED',
            'The purchasing head configuration changed.',
            'conflict',
          );
      } else await repo.createOne({ values: { id: 'main', ...values } });
      await audit.record(
        {
          actorId: input.actorId,
          action: 'vendorRemoval.configureHead',
          targetType: 'vendorRemovalConfiguration',
          targetId: 'main',
          reason: input.reason.trim(),
          before: {
            personId: before?.personId ?? null,
            version: before?.version ?? 0,
          },
          after: values,
        },
        tx,
      );
      return { ...values, existingTasksRequirePublicReassignment: true };
    },
    async publish(
      input: CommitteeVersion & { actorId: string; reason: string },
      tx: DatabaseConnection,
    ) {
      const clean = validateCommittee(input);
      if (!input.reason.trim())
        refuse('REASON_REQUIRED', 'Configuration changes require a reason.');
      const repo = tx.repository<StoredVersion>('vendorCommitteeVersions');
      const previous = await repo.findMany({
        sort: (s) => [s.field('version').desc()],
      });
      const latest = previous[0]?.version ?? 1;
      if (clean.version !== latest + 1)
        refuse(
          'VERSION_CONFLICT',
          'A new committee structure must use the next immutable version.',
          'conflict',
        );
      // First configuration persists the default historical structure too.
      if (!previous.length)
        await repo.createOne({
          values: {
            ...DEFAULT_COMMITTEE,
            seats: [...DEFAULT_COMMITTEE.seats],
            createdById: input.actorId,
            createdAt: demoNow(),
          },
        });
      await repo.createOne({
        values: {
          ...clean,
          seats: [...clean.seats],
          createdById: input.actorId,
          createdAt: demoNow(),
        },
      });
      await audit.record(
        {
          actorId: input.actorId,
          action: 'vendorCommittee.publish',
          targetType: 'vendorCommitteeVersions',
          targetId: String(clean.version),
          reason: input.reason.trim(),
          after: clean,
        },
        tx,
      );
      return { version: clean.version, restartRequired: true };
    },
    async assign(
      input: {
        committeeVersion: number;
        seatKey: string;
        personId: string | null;
        expectedVersion: number;
        actorId: string;
        reason: string;
      },
      tx: DatabaseConnection,
    ) {
      if (!input.reason.trim())
        refuse(
          'REASON_REQUIRED',
          'Changing a committee person requires a reason.',
        );
      const structure = (await this.versions(tx)).find(
        (v) => v.version === input.committeeVersion,
      );
      const seat = structure?.seats.find((s) => s.key === input.seatKey);
      if (!seat || seat.source === 'applicantHead')
        refuse('INVALID_SEAT', 'Choose a configured fixed-person seat.');
      if (input.personId && !(await eligible(input.personId, seat.source, tx)))
        refuse(
          'INELIGIBLE_PERSON',
          'Choose an active person qualified for this fixed seat.',
        );
      const repo = tx.repository<Assignment>('vendorCommitteeAssignments');
      const before = await repo.findOne({
        filter: {
          committeeVersion: input.committeeVersion,
          seatKey: input.seatKey,
        },
      });
      if ((before?.version ?? 0) !== input.expectedVersion)
        refuse(
          'VERSION_CONFLICT',
          'The fixed seat assignment changed.',
          'conflict',
        );
      const values = {
        personId: input.personId,
        version: input.expectedVersion + 1,
        updatedAt: demoNow(),
      };
      if (before) {
        const result = await repo.updateMany({
          filter: { id: before.id, version: input.expectedVersion },
          values,
        });
        if (!result.updatedCount)
          refuse(
            'VERSION_CONFLICT',
            'The fixed seat assignment changed.',
            'conflict',
          );
      } else
        await repo.createOne({
          values: {
            id: randomUUID(),
            committeeVersion: input.committeeVersion,
            seatKey: input.seatKey,
            ...values,
          },
        });
      await audit.record(
        {
          actorId: input.actorId,
          action: 'vendorCommittee.assign',
          targetType: 'vendorCommitteeAssignments',
          targetId: `${input.committeeVersion}:${input.seatKey}`,
          reason: input.reason.trim(),
          before: {
            personId: before?.personId ?? null,
            version: before?.version ?? 0,
          },
          after: values,
        },
        tx,
      );
      return { ...values, existingTasksRequirePublicReassignment: true };
    },
  };
}
