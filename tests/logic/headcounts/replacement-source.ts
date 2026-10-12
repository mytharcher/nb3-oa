import { randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '@nocobase/db';
/** A synthetic business-owned record fixture; no published SDK/plugin rows are fabricated. */
export async function replacementSource(
  tx: DatabaseConnection,
  input: {
    applicantId: string;
    departmentId: string;
    positionId: string;
    accountId: string;
    year: number;
    employeeId: string;
    hrId?: string;
  },
) {
  const id = randomUUID(),
    now = new Date();
  await tx.repository('recruitmentRequests').createOne({
    values: {
      id,
      applicantId: input.applicantId,
      departmentId: input.departmentId,
      positionId: input.positionId,
      gradeId: randomUUID(),
      accountId: input.accountId,
      privateSalaryRevisionId: randomUUID(),
      quantity: 1,
      year: input.year,
      kind: 'replacement',
      replacementEmployeeIds: [input.employeeId],
      expectedStartDate: '2026-12-01',
      jobDescription: 'Sensitive synthetic job description',
      reason: 'Sensitive synthetic reason',
      snapshot: { hrbpIds: input.hrId ? [input.hrId] : [] },
      status: 'approved',
      lifecycleVersion: 1,
      statusChangedAt: now,
      createdAt: now,
    },
  });
  return { sourceKind: 'oa.recruitment', sourceId: id };
}
