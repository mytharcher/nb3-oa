import type { DatabaseConnection } from '@nocobase/db';
import type { HeadcountService } from '../headcounts/contract.js';
import type { SalaryGradeService } from '../job-grades/contract.js';
import { assertSalaryRange } from '../job-grades/ranges.js';
import {
  RecruitmentSubmissionError,
  type RecruitmentSubmissionSnapshot,
} from './submission.js';
/** The private salary revision is selected by immutable record reference; it is not an SDK snapshot. */
export async function assertRecruitmentApprovalCheckpoint(
  recordId: string,
  snapshot: RecruitmentSubmissionSnapshot,
  salary: { minimumCents: number; maximumCents: number },
  services: { headcounts: HeadcountService; grades: SalaryGradeService },
  tx: DatabaseConnection,
): Promise<void> {
  const reservation = await services.headcounts.reservation(
    { sourceKind: 'oa.recruitment', sourceId: recordId },
    tx,
  );
  if (
    !reservation ||
    reservation.accountId !== snapshot.accountId ||
    reservation.quantity !== snapshot.quantity ||
    reservation.remaining !== snapshot.quantity ||
    reservation.consumed !== 0 ||
    reservation.blocked !== 0 ||
    reservation.state !== 'pending'
  )
    throw new RecruitmentSubmissionError('RECRUITMENT_RESERVATION_UNAVAILABLE');
  // Never use current publication here: an in-flight request retains its submitted table revision.
  const band = await services.grades.snapshotForGrade(
    snapshot.gradeId,
    tx,
    snapshot.gradeRevisionId,
  );
  if (
    band.tableVersion !== snapshot.gradeTableVersion ||
    band.rank !== snapshot.rank
  )
    throw new RecruitmentSubmissionError('RECRUITMENT_GRADE_SNAPSHOT_MISMATCH');
  assertSalaryRange(band, salary.minimumCents, salary.maximumCents);
}
