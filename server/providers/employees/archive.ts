import { createHash } from 'node:crypto';
import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection } from '@nocobase/db';
import type { EmployeeService } from './contract.js';
import type { AuditService } from '../audit/index.js';

export interface EmployeeArchiveReference {
  id: string;
  employeeId: string;
  sourceKind: 'oa.certificate';
  sourceId: string;
  fileId: string;
  contentHash: string;
  sensitivity: 'ordinary' | 'income';
  archivedById: string;
  archivedAt: Date | string;
}
export type EmployeeArchiveEvidence = Pick<
  EmployeeArchiveReference,
  | 'employeeId'
  | 'sourceKind'
  | 'sourceId'
  | 'fileId'
  | 'contentHash'
  | 'sensitivity'
>;
export interface EmployeeArchiveService {
  /** Trusted owner integration only; never a file-byte authorization grant. */
  append(
    input: EmployeeArchiveEvidence & { actorId: string },
    verify: (tx: DatabaseConnection) => Promise<EmployeeArchiveEvidence | null>,
    tx: DatabaseConnection,
  ): Promise<EmployeeArchiveReference>;
  /** Trusted owning facade only. HTTP must enforce its source's current policies. */
  source(
    sourceKind: 'oa.certificate',
    sourceId: string,
    tx: DatabaseConnection,
  ): Promise<EmployeeArchiveReference | undefined>;
}
export const employeeArchiveServiceToken =
  createServiceToken<EmployeeArchiveService>('oa/employee-archive-service');

export function createEmployeeArchiveService(dependencies: {
  employees: Pick<EmployeeService, 'getById'>;
  audit: AuditService;
}): EmployeeArchiveService {
  const keys = [
    'employeeId',
    'sourceKind',
    'sourceId',
    'fileId',
    'contentHash',
    'sensitivity',
  ] as const;
  return {
    async source(sourceKind, sourceId, tx) {
      return tx
        .repository<EmployeeArchiveReference>('employeeArchiveReferences')
        .findOne({ filter: { sourceKind, sourceId } });
    },
    async append(input, verify, tx) {
      if (
        input.sourceKind !== 'oa.certificate' ||
        !input.actorId ||
        !input.sourceId ||
        !input.fileId ||
        !/^[a-f0-9]{64}$/.test(input.contentHash) ||
        !['ordinary', 'income'].includes(input.sensitivity)
      )
        throw new Error('EMPLOYEE_ARCHIVE_INVALID');
      const employee = await dependencies.employees.getById(
        input.employeeId,
        tx,
      );
      if (!employee) throw new Error('EMPLOYEE_ARCHIVE_EMPLOYEE_MISSING');
      const evidence = await verify(tx);
      if (!evidence || keys.some((key) => evidence[key] !== input[key]))
        throw new Error('EMPLOYEE_ARCHIVE_EVIDENCE_MISMATCH');
      const previous = await this.source(input.sourceKind, input.sourceId, tx);
      if (previous) {
        if (keys.some((key) => previous[key] !== input[key]))
          throw new Error('EMPLOYEE_ARCHIVE_SOURCE_CONFLICT');
        return previous;
      }
      const id = createHash('sha256')
        .update(JSON.stringify([input.sourceKind, input.sourceId]))
        .digest('hex');
      await tx
        .repository<EmployeeArchiveReference>('employeeArchiveReferences')
        .createOne({
          values: {
            id,
            employeeId: input.employeeId,
            sourceKind: input.sourceKind,
            sourceId: input.sourceId,
            fileId: input.fileId,
            contentHash: input.contentHash,
            sensitivity: input.sensitivity,
            archivedById: input.actorId,
            archivedAt: new Date(),
          },
        });
      await dependencies.audit.record(
        {
          actorId: input.actorId,
          action: 'employee.archive',
          targetType: 'employeeArchiveReferences',
          targetId: id,
          after: {
            employeeId: input.employeeId,
            sourceKind: input.sourceKind,
            sourceId: input.sourceId,
            sensitivity: input.sensitivity,
          },
        },
        tx,
      );
      const row = await this.source(input.sourceKind, input.sourceId, tx);
      if (!row) throw new Error('EMPLOYEE_ARCHIVE_WRITE_FAILED');
      return row;
    },
  };
}
