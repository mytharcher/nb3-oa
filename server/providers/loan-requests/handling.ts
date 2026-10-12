import {
  defineApprovalAction,
  offered,
} from '@nocobase/app-plugin-approval/server';
const answer = (name: string, value: 'approve' | 'reject', required: boolean) =>
  defineApprovalAction<{ paymentVoucher?: string }, Record<string, never>>({
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
      (!input.paymentVoucher?.trim() || input.paymentVoucher.length > 255)
        ? 'A payment voucher is required.'
        : null,
    record: ['paymentVoucher'],
    plan: (input, { task }) => {
      const data: import('@nocobase/lifecycle').JsonObject = {};
      if (name === 'complete') data.paymentVoucher = input.paymentVoucher ?? '';
      return [{ type: 'answer', task: task!.id, answer: value, data }];
    },
  });
/** Native first policy: approve means cash completed, reject means handling exception; neither decision is exposed as an approval/rejection button. */
export const loanCashActions = {
  complete: answer('complete', 'approve', false),
  unable: answer('unable', 'reject', true),
};
