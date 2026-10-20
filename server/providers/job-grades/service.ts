import { demoNow, demoPartition } from '../demo-data/context.js';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { DatabaseConnection } from '@nocobase/db';
import type { OrgService } from '../org/contract.js';
import type { AuditService } from '../audit/index.js';
import type { SalaryGradeRevision, SalaryGradeService } from './contract.js';
import { freezeSalaryRanges } from './ranges.js';
/** Separate storage prevents demo publications from replacing the company's current table. */
export function salaryCollections(tx?: DatabaseConnection) {
  return demoPartition(tx)
    ? {
        pointer: 'demoSalaryGradeCurrent',
        revision: 'demoSalaryGradeRevisions',
      }
    : { pointer: 'salaryGradeCurrent', revision: 'salaryGradeRevisions' };
}
export class SalaryTableError extends Error {
  constructor(
    public readonly reason:
      | 'VERSION_CONFLICT'
      | 'TABLE_UNAVAILABLE'
      | 'GRADE_UNAVAILABLE'
      | 'INVALID_PUBLICATION'
      | 'STORED_DATA_INVALID'
      | 'IDEMPOTENCY_CONFLICT',
  ) {
    super(reason);
  }
}
const bandsSchema = z
  .array(
    z
      .strictObject({
        gradeId: z.string().min(1),
        gradeCode: z.string(),
        gradeTitle: z.string(),
        rank: z.number().int().safe(),
        minimumCents: z.number().int().safe().nonnegative(),
        maximumCents: z.number().int().safe().nonnegative(),
      })
      .refine((b) => b.maximumCents >= b.minimumCents),
  )
  .min(1)
  .refine(
    (bands) => new Set(bands.map((b) => b.gradeId)).size === bands.length,
  );
/** Trusted caller facade: HTTP authorization belongs to its route; every mutation joins the supplied transaction. */
export function createSalaryGradeService(d: {
  org: OrgService;
  audit: AuditService;
}): SalaryGradeService {
  async function revision(
    id: string,
    tx: DatabaseConnection,
  ): Promise<SalaryGradeRevision> {
    const row = await tx
      .repository(salaryCollections(tx).revision)
      .findOne({ filter: { id } });
    const bands = bandsSchema.safeParse(row?.bands);
    const createdAt =
      row?.createdAt instanceof Date
        ? row.createdAt
        : typeof row?.createdAt === 'string'
          ? new Date(row.createdAt)
          : undefined;
    if (
      !row ||
      !bands.success ||
      typeof row.version !== 'number' ||
      !Number.isSafeInteger(row.version) ||
      row.version < 1 ||
      typeof row.createdById !== 'string' ||
      typeof row.reason !== 'string' ||
      !createdAt ||
      !Number.isFinite(createdAt.getTime())
    )
      throw new SalaryTableError('STORED_DATA_INVALID');
    return {
      id,
      version: row.version,
      bands: bands.data,
      createdById: row.createdById,
      reason: row.reason,
      createdAt,
    };
  }
  const service: SalaryGradeService = {
    async current(tx) {
      const pointer = await tx
        .repository(salaryCollections(tx).pointer)
        .findOne({ filter: { id: 'current' } });
      if (!pointer && demoPartition(tx)) return { version: 0, revision: null };
      if (
        !pointer ||
        typeof pointer.version !== 'number' ||
        !Number.isSafeInteger(pointer.version) ||
        pointer.version < 0
      )
        throw new SalaryTableError('TABLE_UNAVAILABLE');
      const current =
        typeof pointer.revisionId === 'string'
          ? await revision(pointer.revisionId, tx)
          : null;
      if ((current?.version ?? 0) !== pointer.version)
        throw new SalaryTableError('STORED_DATA_INVALID');
      return { version: pointer.version, revision: current };
    },
    async publish(input, connection, policies) {
      if (
        !Number.isSafeInteger(input.expectedVersion) ||
        input.expectedVersion < 0 ||
        input.expectedVersion >= 2147483647 ||
        !input.actorId ||
        !input.reason.trim() ||
        input.reason.length > 2000 ||
        (input.requestKey !== undefined &&
          (!input.requestKey.trim() || input.requestKey.length > 128))
      )
        throw new SalaryTableError('INVALID_PUBLICATION');
      return connection.transaction(async (tx) => {
        const pointerRepository = policies
          ? tx
              .repository(salaryCollections(tx).pointer)
              .withPolicy(policies.pointer)
          : tx.repository(salaryCollections(tx).pointer);
        const revisionRepository = policies
          ? tx
              .repository(salaryCollections(tx).revision)
              .withPolicy(policies.revision)
          : tx.repository(salaryCollections(tx).revision);
        if (
          demoPartition(tx) &&
          !(await tx
            .repository(salaryCollections(tx).pointer)
            .exists({ filter: { id: 'current' } }))
        )
          await tx.repository(salaryCollections(tx).pointer).createOne({
            values: { id: 'current', version: 0, revisionId: null },
          });
        const locked = await pointerRepository.updateMany({
          filter: { id: 'current' },
          values: { version: { increment: 0 } },
        });
        if (locked.updatedCount !== 1)
          throw new SalaryTableError('TABLE_UNAVAILABLE');
        const publicationHash = input.requestKey
          ? createHash('sha256')
              .update(
                JSON.stringify({
                  expectedVersion: input.expectedVersion,
                  reason: input.reason.trim(),
                  bands: input.bands
                    .map((band) => ({
                      gradeId: band.gradeId,
                      minimumCents: band.minimumCents,
                      maximumCents: band.maximumCents,
                    }))
                    .sort((a, b) => a.gradeId.localeCompare(b.gradeId)),
                }),
              )
              .digest('hex')
          : undefined;
        if (input.requestKey) {
          const prior = await tx
            .repository(salaryCollections(tx).revision)
            .findOne({
              filter: {
                createdById: input.actorId,
                publicationKey: input.requestKey,
              },
            });
          if (prior) {
            if (prior.publicationHash !== publicationHash)
              throw new SalaryTableError('IDEMPOTENCY_CONFLICT');
            if (typeof prior.id !== 'string')
              throw new SalaryTableError('STORED_DATA_INVALID');
            return revision(prior.id, tx);
          }
        }
        const before = await service.current(tx);
        if (before.version !== input.expectedVersion)
          throw new SalaryTableError('VERSION_CONFLICT');
        const bands = freezeSalaryRanges(
          input.bands,
          await d.org.listGrades(tx),
        );
        const row: SalaryGradeRevision = {
          id: randomUUID(),
          version: before.version + 1,
          bands,
          createdById: input.actorId,
          reason: input.reason.trim(),
          createdAt: demoNow(),
        };
        await revisionRepository.createOne({
          values: {
            ...row,
            publicationKey: input.requestKey ?? null,
            publicationHash: publicationHash ?? null,
          },
        });
        const updated = await pointerRepository.updateMany({
          filter: { id: 'current', version: before.version },
          values: { version: row.version, revisionId: row.id },
        });
        if (updated.updatedCount !== 1)
          throw new SalaryTableError('VERSION_CONFLICT');
        // Ordinary audit readers see revision identities and counts, never private salary amounts.
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'salaryGrade.publish',
            targetType: 'salaryGradeRevisions',
            targetId: row.id,
            reason: null,
            before: { version: before.version },
            after: { version: row.version, gradeCount: bands.length },
          },
          tx,
        );
        return row;
      });
    },
    async snapshotForGrade(gradeId, tx, revisionId) {
      if (
        !revisionId &&
        !(await d.org.listGrades(tx)).some((g) => g.id === gradeId && g.active)
      )
        throw new SalaryTableError('GRADE_UNAVAILABLE');
      const selected = revisionId
        ? await revision(revisionId, tx)
        : (await service.current(tx)).revision;
      if (!selected) throw new SalaryTableError('TABLE_UNAVAILABLE');
      const band = selected.bands.find((b) => b.gradeId === gradeId);
      if (!band) throw new SalaryTableError('GRADE_UNAVAILABLE');
      return {
        ...band,
        revisionId: selected.id,
        tableVersion: selected.version,
      };
    },
  };
  return service;
}
