// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  itemizedPolicy,
  type PolicyTask,
} from '@nocobase/app-plugin-approval/server';
import { reimbursementFinancePolicy } from '../../../server/providers/reimbursement/finance-policy.ts';
const line = (subject: string, answer: string | null): PolicyTask => ({
  id: subject,
  placeKey: subject,
  pool: null,
  veto: false,
  assigneeId: 'accountant',
  status: answer ? 'completed' : 'pending',
  answer,
  order: 0,
  seq: null,
  subject,
  data: { hash: `evidence-${subject}`, amountCents: 29 },
});
const context = (tasks: PolicyTask[]) => ({
  tasks,
  settings: {},
  options: {},
  event: { kind: 'changed' as const },
});
describe('reimbursement finance correction policy', () => {
  it('returns a line immediately while preserving approved and pending evidence separately', () => {
    const tasks = [
      line('approved', 'approve'),
      line('returned', 'return'),
      line('unheard', null),
    ];
    expect(
      itemizedPolicy.decide({
        ...context(tasks),
        options: { returnTarget: 'revision', partialSetting: 'allowPartial' },
      }),
    ).toEqual({ kind: 'open' });
    expect(reimbursementFinancePolicy.decide(context(tasks))).toEqual({
      kind: 'closed',
      result: { returnTo: 'revision' },
      data: {
        decisions: {
          approved: { outcome: 'approved', contentHash: 'evidence-approved' },
          returned: { outcome: 'returned', contentHash: 'evidence-returned' },
          unheard: { outcome: 'pending', contentHash: 'evidence-unheard' },
        },
      },
    });
  });
  it('never treats a pending or unassigned line as approved and rejects the whole claim before any return', () => {
    expect(reimbursementFinancePolicy.decide(context([]))).toEqual({
      kind: 'open',
    });
    expect(
      reimbursementFinancePolicy.decide(
        context([
          line('a', 'approve'),
          { ...line('b', null), assigneeId: '', status: 'unassigned' },
        ]),
      ),
    ).toEqual({ kind: 'open' });
    expect(
      reimbursementFinancePolicy.decide(
        context([line('a', 'reject'), line('b', 'return'), line('c', null)]),
      ),
    ).toMatchObject({ kind: 'closed', result: 'rejected' });
    expect(
      reimbursementFinancePolicy.decide(
        context([line('a', 'approve'), line('b', 'approve')]),
      ),
    ).toMatchObject({ kind: 'closed', result: 'approved' });
  });
  it('requires rejection/return reasons and refuses partial monetary approval output', () => {
    const check = (answer: string, comment: string | null, data = {}) =>
      reimbursementFinancePolicy.check!({
        task: line('a', null),
        answer,
        comment,
        data,
        options: {},
      });
    expect(check('return', null)).toBeTruthy();
    expect(check('reject', null)).toBeTruthy();
    expect(check('return', 'Fix invoice')).toBeNull();
    expect(check('approve', null, { approvedCents: 1 })).toBeTruthy();
    expect(check('approve', null, { hash: 'forged' })).toBeTruthy();
    expect(check('approve', null, { amountCents: 1 })).toBeTruthy();
  });
});
