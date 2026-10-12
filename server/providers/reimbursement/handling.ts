import {
  defineApprovalAction,
  offered,
  type StageOutputs,
} from '@nocobase/app-plugin-approval/server';
import { z } from 'zod';
import { paymentAmounts } from './amounts.js';

/** Used with a claimable cashier pool and the native first policy. A rejection answer is only the
 * implementation of an unable-to-pay exit; the stage must not register the generic reject action. */
export const reimbursementPaymentOutputs: StageOutputs = {
  fields: { voucherNumber: z.string().trim().min(1).max(128) },
  required: ['voucherNumber'],
  writes: { voucherNumber: 'voucherNumber' },
};

const guards = [
  'runOpen',
  'stayCurrent',
  'taskOpen',
  'actionable',
  'contentCurrent',
  'activeActor',
] as const;
const complete = defineApprovalAction<
  { voucherNumber: string },
  Record<string, never>
>({
  name: 'complete',
  scope: 'task',
  actors: ['assignee', 'delegate'],
  guards,
  defaults: {},
  record: ['voucherNumber'],
  presentation: { primary: true },
  available: () => offered(),
  validate: (input) =>
    typeof input.voucherNumber !== 'string' ||
    !input.voucherNumber.trim() ||
    input.voucherNumber.trim().length > 128
      ? 'A payment voucher number is required.'
      : null,
  plan: (input, { task }) => [
    {
      type: 'answer',
      task: task!.id,
      answer: 'approve',
      data: { voucherNumber: input.voucherNumber.trim() },
    },
  ],
});
const unable = defineApprovalAction<
  Record<string, never>,
  Record<string, never>
>({
  name: 'unable',
  scope: 'task',
  actors: ['assignee', 'delegate'],
  guards,
  defaults: {},
  reason: true,
  presentation: { tone: 'danger' },
  available: () => offered(),
  plan: (_input, { task }) => [
    { type: 'answer', task: task!.id, answer: 'reject' },
  ],
});
interface ForcedPaymentInput {
  voucherNumber: string | null;
  confirmedGrossCents: number;
  confirmedOffsetCents: number;
  confirmedNetCents: number;
}
const forceComplete = defineApprovalAction<
  ForcedPaymentInput,
  Record<string, never>
>({
  name: 'forceComplete',
  scope: 'run',
  actors: ['admin'],
  guards: ['runOpen', 'contentCurrent'],
  defaults: {},
  reason: true,
  presentation: { tone: 'danger' },
  record: [
    'voucherNumber',
    'confirmedGrossCents',
    'confirmedOffsetCents',
    'confirmedNetCents',
  ],
  outcomes: () => [{ exit: 'forcedPaid' }],
  available: ({ record }) =>
    offered({
      grossCents: Number(record.totalCents),
      offsetCents: Number(record.offsetCents),
      netCents: Number(record.totalCents) - Number(record.offsetCents),
    }),
  validate: (input, { record }) => {
    let amounts;
    try {
      amounts = paymentAmounts(
        Number(record.totalCents),
        Number(record.offsetCents),
      );
    } catch {
      return 'The current approved payment amounts are invalid.';
    }
    if (
      input.confirmedGrossCents !== amounts.grossCents ||
      input.confirmedOffsetCents !== amounts.offsetCents ||
      input.confirmedNetCents !== amounts.netCents
    )
      return 'Confirm the exact gross reimbursement, loan offset and net cash amounts.';
    if (
      input.voucherNumber !== null &&
      (typeof input.voucherNumber !== 'string' ||
        !input.voucherNumber.trim() ||
        input.voucherNumber.trim().length > 128)
    )
      return 'A supplied voucher must be nonempty text, or use null when no voucher exists.';
    return null;
  },
  plan: (input, { comment }) => [
    {
      type: 'conclude',
      result: { exit: 'forcedPaid' },
      input: {
        ...input,
        voucherNumber: input.voucherNumber?.trim() ?? null,
        reason: comment!,
      },
    },
  ],
});
export const reimbursementCashierActions = { complete, unable, forceComplete };
