import {
  defineApprovalAction,
  offered,
  unavailable,
} from '@nocobase/app-plugin-approval/server';
/** The SDK has an abstain answer policy but no exported abstain action factory. */
export const committeeAbstainAction = defineApprovalAction({
  name: 'abstain',
  scope: 'task',
  actors: ['assignee'],
  guards: [
    'runOpen',
    'stayCurrent',
    'actionable',
    'contentCurrent',
    'activeActor',
  ],
  batch: { requireContentHash: true },
  presentation: { primary: false },
  available: (context) =>
    context.task?.kind === 'decide' &&
    context.allowedAnswers(context.task).includes('abstain')
      ? offered({ answer: 'abstain' })
      : unavailable('NOT_ALLOWED', 'This stage does not support abstention.'),
  validate: (input) =>
    !input ||
    typeof input !== 'object' ||
    'answer' in input ||
    ('data' in input && input.data !== undefined)
      ? {
          code: 'INVALID_INPUT',
          message:
            'Abstention accepts only a comment, not a decision or output.',
        }
      : null,
  plan: (_, { task }) => [
    { type: 'answer', task: task?.id ?? '', answer: 'abstain' },
  ],
  summary: () => ({ answer: 'abstain' }),
});
