import {
  defineApprovalAction,
  offered,
  type StagePolicy,
} from '@nocobase/app-plugin-approval/server';
import type { SealRequest } from './contract.js';
export const sealExecutionPolicy: StagePolicy<Record<string, never>> = {
  kind: 'oa.sealExecution',
  outcomes: () => [{ exit: 'completed' }, { exit: 'unavailable' }],
  answers: () => ['completed', 'unavailable'],
  plan: ({ places }) =>
    places.map((p) => ({ placeKey: p.placeKey, status: 'pending' })),
  decide: ({ tasks }) => {
    const t = tasks.find(
      (t) =>
        t.status === 'completed' &&
        ['completed', 'unavailable'].includes(t.answer ?? ''),
    );
    return t
      ? { kind: 'closed', result: { exit: t.answer! } }
      : { kind: 'open' };
  },
};
const guards = [
  'runOpen',
  'stayCurrent',
  'taskOpen',
  'actionable',
  'contentCurrent',
  'activeActor',
] as const;
export const completeSeal = defineApprovalAction<
  {
    sealId: string;
    actualCopies: number | null;
    sealedAt: string | null;
    borrowedAt: string | null;
    returnedAt: string | null;
  },
  Record<string, never>
>({
  name: 'complete',
  scope: 'task',
  actors: ['assignee'],
  guards: [...guards],
  defaults: {},
  record: ['sealId', 'actualCopies', 'sealedAt', 'borrowedAt', 'returnedAt'],
  available: () => offered(),
  validate: (input, context) => {
    const record = context.record as SealRequest;
    if (typeof input.sealId !== 'string' || !input.sealId)
      return 'Select the actual seal instance.';
    if (['returning', 'returnException'].includes(record.status))
      return !input.returnedAt ||
        !input.sealedAt ||
        !Number.isInteger(input.actualCopies) ||
        !input.actualCopies
        ? 'Confirm the actual return and completed sealing.'
        : null;
    if (record.external)
      return !input.borrowedAt ||
        input.sealedAt !== null ||
        input.actualCopies !== null ||
        input.returnedAt !== null
        ? 'Confirm actual checkout; checkout is not completed sealing.'
        : null;
    return !input.sealedAt ||
      !Number.isInteger(input.actualCopies) ||
      !input.actualCopies ||
      input.borrowedAt !== null ||
      input.returnedAt !== null
      ? 'Confirm actual completed internal sealing.'
      : null;
  },
  plan: (input, { task }) => [
    {
      type: 'answer',
      task: task!.id,
      answer: 'completed',
      data: {
        sealId: input.sealId,
        actualCopies: input.actualCopies,
        sealedAt: input.sealedAt,
        borrowedAt: input.borrowedAt,
        returnedAt: input.returnedAt,
      },
    },
  ],
});
export const unableSeal = defineApprovalAction<
  Record<string, never>,
  Record<string, never>
>({
  name: 'unable',
  scope: 'task',
  actors: ['assignee'],
  guards: [...guards],
  reason: true,
  defaults: {},
  available: () => offered(),
  plan: (_, { task, comment }) => [
    {
      type: 'answer',
      task: task!.id,
      answer: 'unavailable',
      data: { exceptionReason: comment },
    },
  ],
});
