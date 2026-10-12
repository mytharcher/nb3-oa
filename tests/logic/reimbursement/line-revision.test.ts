// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  checkReturnedLineRevision,
  reimbursementLineHash,
} from '../../../server/providers/reimbursement/line-revision.ts';
import type { ReimbursementLine } from '../../../server/providers/reimbursement/contract.ts';
const line = (id: string): ReimbursementLine => ({
  id,
  category: 'lodging',
  date: '2026-10-11',
  amountCents: 10001,
  invoiceNumber: `INVOICE-${id}`,
  attachmentIds: [`evidence-${id}`],
  standardExceptionReason: '',
});
describe('finance-return line edit permissions', () => {
  it('allows only returned lines to change or be removed, preserving pending and approved evidence', () => {
    const previous = [line('approved'), line('returned'), line('pending')];
    const facts = {
      approved: {
        outcome: 'approved' as const,
        contentHash: reimbursementLineHash(previous[0]),
      },
      returned: {
        outcome: 'returned' as const,
        contentHash: reimbursementLineHash(previous[1]),
      },
      pending: {
        outcome: 'pending' as const,
        contentHash: reimbursementLineHash(previous[2]),
      },
    };
    expect(() =>
      checkReturnedLineRevision(
        previous,
        [
          previous[0],
          { ...previous[1], amountCents: 29, attachmentIds: ['corrected'] },
          previous[2],
        ],
        facts,
      ),
    ).not.toThrow();
    expect(() =>
      checkReturnedLineRevision(previous, [previous[0], previous[2]], facts),
    ).not.toThrow();
    for (const proposed of [
      [previous[1], previous[2]],
      [previous[0], previous[1]],
      [{ ...previous[0], amountCents: 29 }, previous[1], previous[2]],
      [previous[0], previous[1], { ...previous[2], invoiceNumber: 'REPLACED' }],
      [...previous, line('new')],
      [...previous, previous[0]],
    ])
      expect(() =>
        checkReturnedLineRevision(previous, proposed, facts),
      ).toThrow();
    expect(() =>
      checkReturnedLineRevision(previous, previous, {
        ...facts,
        returned: { ...facts.returned, contentHash: 'caller-forged' },
      }),
    ).toThrow();
    expect(() =>
      checkReturnedLineRevision(previous, previous, {
        ...facts,
        returned: { ...facts.returned, outcome: 'pending' },
      }),
    ).toThrow();
  });
});
