import {
  defineApprovalAction,
  offered,
  type StagePolicy,
} from '@nocobase/app-plugin-approval/server';
export const certificateExecutionPolicy: StagePolicy<Record<string, never>> = {
  kind: 'oa.certificateExecution',
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
export const completeCertificate = defineApprovalAction<
  { preparationId: string },
  Record<string, never>
>({
  name: 'complete',
  scope: 'task',
  actors: ['assignee'],
  guards: [...guards],
  defaults: {},
  record: ['preparationId'],
  available: () => offered(),
  validate: (input) =>
    typeof input.preparationId === 'string' && input.preparationId
      ? null
      : 'A generated certificate preparation is required.',
  plan: (input, { task }) => [
    {
      type: 'answer',
      task: task!.id,
      answer: 'completed',
      data: { preparationId: input.preparationId },
    },
  ],
});
export const unableCertificate = defineApprovalAction<
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
