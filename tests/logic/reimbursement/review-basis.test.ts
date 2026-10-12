// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { reviewBasis } from '../../../server/providers/reimbursement/review-basis.ts';
const identity = {
  applicantId: 'employee',
  departmentId: 'department',
  authorizationId: null,
  loanId: null,
  reason: 'Travel reimbursement',
  ruleSnapshot: { 'spend.gm': 200000, 'expense.head': 10000 },
};
describe('business-line correction reuse basis', () => {
  it('keeps an original approved ceiling for reductions but renews it for an increase', () => {
    const first = reviewBasis(null, identity, 10001, null);
    const reduced = reviewBasis(first, identity, 2501, 10001);
    expect(reduced).toBe(first);
    expect(reviewBasis(reduced, identity, 5001, 2501)).toEqual({
      identityHash: first.identityHash,
      limitCents: 5001,
    });
    expect(reviewBasis(first, identity, 2501, null)).not.toBe(first);
    expect(reviewBasis(first, identity, 10002, 10001)).toEqual({
      identityHash: first.identityHash,
      limitCents: 10002,
    });
  });
  it('requires the same applicant, department, source, purpose and rules without relying on JSON property order', () => {
    const first = reviewBasis(null, identity, 10001, null);
    for (const change of [
      { applicantId: 'other' },
      { departmentId: 'other' },
      { authorizationId: 'source' },
      { loanId: 'loan' },
      { reason: 'Other purpose' },
      { ruleSnapshot: { 'spend.gm': 200001, 'expense.head': 10000 } },
    ])
      expect(
        reviewBasis(first, { ...identity, ...change }, 2501, 10001),
      ).not.toEqual(first);
    expect(
      reviewBasis(
        first,
        {
          ...identity,
          ruleSnapshot: { 'expense.head': 10000, 'spend.gm': 200000 },
        },
        2501,
        10001,
      ),
    ).toBe(first);
  });
});
