import {
  itemizedPolicy,
  defineApprovalAction,
  offered,
  type StagePolicy,
} from '@nocobase/app-plugin-approval/server';
import type { JsonObject } from '@nocobase/lifecycle';

/** A returned line immediately opens correction; an undecided line is never recorded as approved. */
export const reimbursementFinancePolicy: StagePolicy<Record<string, never>> = {
  kind: 'oa.reimbursementFinance',
  outcomes: () => ['approved', 'rejected', { returnTo: 'revision' }],
  answers: () => ['return'],
  plan: (context) =>
    itemizedPolicy.plan({
      ...context,
      options: { returnTarget: 'revision', partialSetting: 'allowPartial' },
    }),
  check: (context) => {
    if ('approvedCents' in context.data)
      return 'A reimbursement line must be approved in full or returned for correction.';
    // This stage declares no output fields. Evidence hashes and claimed amounts belong to the submitted
    // subject, never to caller-supplied decision data that the SDK would merge into its task data.
    if (Object.keys(context.data).length)
      return 'A line decision cannot replace submitted evidence or claimed amounts.';
    return itemizedPolicy.check!({
      ...context,
      options: { returnTarget: 'revision', partialSetting: 'allowPartial' },
    });
  },
  decide: ({ tasks }) => {
    if (!tasks.length) return { kind: 'open' };
    const decisions: JsonObject = {};
    for (const task of tasks) {
      if (task.subject === null) continue;
      // subject hashes are generated from the full line by the business service. They are retained as
      // evidence, independently of the manager's amount-ceiling covers used for business-line reuse.
      decisions[task.subject] = {
        outcome:
          task.answer === 'approve'
            ? 'approved'
            : task.answer === 'return'
              ? 'returned'
              : task.answer === 'reject'
                ? 'rejected'
                : 'pending',
        contentHash:
          typeof task.data?.hash === 'string' ? task.data.hash : null,
      };
    }
    if (tasks.some((task) => task.answer === 'reject'))
      return { kind: 'closed', result: 'rejected', data: { decisions } };
    if (tasks.some((task) => task.answer === 'return'))
      return {
        kind: 'closed',
        result: { returnTo: 'revision' },
        data: { decisions },
      };
    if (tasks.every((task) => task.answer === 'approve'))
      return { kind: 'closed', result: 'approved', data: { decisions } };
    return { kind: 'open' };
  },
};

export const returnItem = defineApprovalAction<
  Record<string, never>,
  Record<string, never>
>({
  name: 'returnItem',
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
  reason: true,
  defaults: {},
  available: () => offered(),
  plan: (_input, { task }) => [
    { type: 'answer', task: task!.id, answer: 'return' },
  ],
});
