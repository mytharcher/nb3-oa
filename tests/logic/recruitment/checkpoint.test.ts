// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { DatabaseConnection } from '@nocobase/db';
import type { HeadcountService } from '../../../server/providers/headcounts/contract.js';
import type { SalaryGradeService } from '../../../server/providers/job-grades/contract.js';
import type { RecruitmentSubmissionSnapshot } from '../../../server/providers/recruitment/submission.js';
import { assertRecruitmentApprovalCheckpoint } from '../../../server/providers/recruitment/checkpoint.js';
function fixture() {
  const tx = {} as DatabaseConnection;
  const snapshot = {
    accountId: 'a1',
    quantity: 2,
    gradeId: 'g1',
    gradeRevisionId: 'old',
    gradeTableVersion: 1,
    rank: 5,
  } as RecruitmentSubmissionSnapshot;
  const reservation = {
    accountId: 'a1',
    quantity: 2,
    remaining: 2,
    consumed: 0,
    blocked: 0,
    state: 'pending',
  };
  const band = {
    tableVersion: 1,
    rank: 5,
    minimumCents: 10000,
    maximumCents: 20000,
  };
  const reservationRead = vi.fn(async () => reservation),
    gradeRead = vi.fn(async () => band);
  const services = {
    headcounts: { reservation: reservationRead } as unknown as HeadcountService,
    grades: { snapshotForGrade: gradeRead } as unknown as SalaryGradeService,
  };
  const run = () =>
    assertRecruitmentApprovalCheckpoint(
      'r1',
      snapshot,
      { minimumCents: 12000, maximumCents: 18000 },
      services,
      tx,
    );
  return { run, reservationRead, gradeRead, reservation, band, tx };
}
it('checks actual source and the frozen historical publication in caller transaction', async () => {
  const f = fixture();
  await f.run();
  expect(f.reservationRead).toHaveBeenCalledWith(
    { sourceKind: 'oa.recruitment', sourceId: 'r1' },
    f.tx,
  );
  expect(f.gradeRead).toHaveBeenCalledWith('g1', f.tx, 'old');
});
it.each([
  { blocked: 1 },
  { accountId: 'other' },
  { quantity: 3 },
  { remaining: 1 },
  { consumed: 1 },
  { state: 'allocated' },
])('fails closed on actual source drift %s', async (change) => {
  const f = fixture();
  Object.assign(f.reservation, change);
  await expect(f.run()).rejects.toThrow('RECRUITMENT_RESERVATION_UNAVAILABLE');
  expect(f.gradeRead).not.toHaveBeenCalled();
});
it('does not accept a mismatched published rank/version', async () => {
  const f = fixture();
  f.band.tableVersion = 2;
  await expect(f.run()).rejects.toThrow('RECRUITMENT_GRADE_SNAPSHOT_MISMATCH');
});
