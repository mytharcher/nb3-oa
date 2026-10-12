import {
  defineApprovalAction,
  offered,
  unavailable,
} from '@nocobase/app-plugin-approval/server';
const answer = (name: string, value: 'approve' | 'reject', required: boolean) =>
  defineApprovalAction<
    { voucherNumber?: string; voucherAttachments?: string[] },
    Record<string, never>
  >({
    name,
    scope: 'task',
    actors: ['assignee', 'delegate'],
    guards: [
      'runOpen',
      'stayCurrent',
      'taskOpen',
      'actionable',
      'contentCurrent',
      'activeActor',
    ],
    presentation: {
      primary: name === 'complete',
      tone: name === 'unable' ? 'danger' : 'default',
    },
    reason: required,
    defaults: {},
    available: () => offered(),
    validate: (input) =>
      name === 'complete' &&
      (!input.voucherNumber?.trim() ||
        input.voucherNumber.length > 128 ||
        !Array.isArray(input.voucherAttachments) ||
        !input.voucherAttachments.length ||
        input.voucherAttachments.length > 10 ||
        input.voucherAttachments.some((id) => typeof id !== 'string' || !id))
        ? 'A payment voucher is required.'
        : null,
    record: ['voucherNumber', 'voucherAttachments'],
    plan: (input, { task }) => {
      const data: import('@nocobase/lifecycle').JsonObject = {};
      if (name === 'complete') {
        data.voucherNumber = input.voucherNumber?.trim() ?? '';
        data.voucherAttachments = input.voucherAttachments ?? [];
      }
      return [{ type: 'answer', task: task!.id, answer: value, data }];
    },
  });
/** Native first policy: approve means cash completed, reject means handling exception; neither decision is exposed as an approval/rejection button. */
const forceComplete = defineApprovalAction<
  { confirmedCents: number; voucherNumber: string | null },
  Record<string, never>
>({
  name: 'forceComplete',
  scope: 'run',
  actors: ['admin'],
  guards: ['runOpen', 'contentCurrent'],
  defaults: {},
  reason: true,
  presentation: { tone: 'danger' },
  record: ['confirmedCents', 'voucherNumber'],
  outcomes: () => [{ exit: 'forcedPaid' }],
  available: ({ record }) =>
    record.sourceContractId
      ? unavailable(
          'NOT_ALLOWED',
          'Contract payment requires actual cashier completion.',
        )
      : offered({ amountCents: Number(record.amountCents) }),
  validate: (input, { record }) =>
    input.confirmedCents !== Number(record.amountCents)
      ? 'Confirm the exact approved payment amount.'
      : input.voucherNumber !== null &&
          (typeof input.voucherNumber !== 'string' ||
            !input.voucherNumber.trim() ||
            input.voucherNumber.length > 128)
        ? 'Use a nonempty voucher number or null.'
        : null,
  plan: (input, { comment }) => [
    {
      type: 'conclude',
      result: { exit: 'forcedPaid' },
      input: {
        confirmedCents: input.confirmedCents,
        voucherNumber: input.voucherNumber?.trim() ?? null,
        reason: comment!,
      },
    },
  ],
});
export const paymentCashActions = {
  forceComplete,
  complete: answer('complete', 'approve', false),
  unable: answer('unable', 'reject', true),
};
